# SECTION 15 — Ansible: Node Hardening (Optional but Recommended)

> Ansible is a configuration management tool. It connects to your servers
> over SSH and runs tasks automatically — no need to SSH into each node
> manually. You describe WHAT you want the server to look like (desired state)
> and Ansible makes it happen.
>
> Why harden nodes? Fresh EC2 instances have default settings that are not
> production-ready: outdated packages, no log rotation, no time sync, etc.
> Hardening fixes all of this automatically across all nodes at once.
>
> This section is optional but earns you bonus marks and demonstrates
> Configuration Management mastery.

---

## STEP 15.1 — Get the Node IP Addresses

Kops nodes are in private subnets — you cannot SSH directly from your laptop.
You need a bastion host OR use AWS Systems Manager Session Manager.

```bash
# Get the private IPs of all worker nodes
kubectl get nodes -o wide | grep -v control-plane | awk '{print $6}'

# Get the private IPs of all master nodes
kubectl get nodes -o wide | grep control-plane | awk '{print $6}'

# Save them for the Ansible inventory
MASTER_IPS=$(kubectl get nodes -o wide | grep control-plane | awk '{print $6}' | tr '\n' ' ')
WORKER_IPS=$(kubectl get nodes -o wide | grep -v control-plane | grep -v NAME | awk '{print $6}' | tr '\n' ' ')

echo "Masters: $MASTER_IPS"
echo "Workers: $WORKER_IPS"
```

---

## STEP 15.2 — Set Up a Bastion Host for SSH Access

Since nodes are in private subnets, create a small bastion EC2 instance
in a public subnet to jump through.

```bash
# Create a security group for the bastion
BASTION_SG=$(aws ec2 create-security-group \
  --group-name taskapp-bastion-sg \
  --description "Bastion host for Ansible access" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

# Allow SSH from your IP only (replace with your actual public IP)
MY_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress \
  --group-id $BASTION_SG \
  --protocol tcp --port 22 \
  --cidr "${MY_IP}/32"

# Get the first public subnet ID
FIRST_PUBLIC_SUBNET=$(echo $PUBLIC_SUBNET_IDS | cut -d',' -f1)

# Launch a tiny bastion instance (t3.micro is free tier eligible)
BASTION_ID=$(aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --instance-type t3.micro \
  --key-name taskapp-k8s \
  --security-group-ids $BASTION_SG \
  --subnet-id $FIRST_PUBLIC_SUBNET \
  --associate-public-ip-address \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=taskapp-bastion}]' \
  --query 'Instances[0].InstanceId' --output text)

# Wait for it to be running
aws ec2 wait instance-running --instance-ids $BASTION_ID

BASTION_IP=$(aws ec2 describe-instances \
  --instance-ids $BASTION_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Bastion IP: $BASTION_IP"
echo "export BASTION_IP=$BASTION_IP" >> ~/.bashrc
```

---

## STEP 15.3 — Create the Ansible Inventory

OPEN VS Code. CREATE `ansible/inventory/hosts.ini`:

```ini
# ansible/inventory/hosts.ini
# Replace the IP addresses with your actual node IPs

[bastion]
bastion ansible_host=YOUR_BASTION_IP ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/taskapp-k8s

[masters]
master-1 ansible_host=10.0.11.XXX ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/taskapp-k8s ansible_ssh_common_args='-o ProxyJump=ubuntu@YOUR_BASTION_IP -o StrictHostKeyChecking=no'
master-2 ansible_host=10.0.12.XXX ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/taskapp-k8s ansible_ssh_common_args='-o ProxyJump=ubuntu@YOUR_BASTION_IP -o StrictHostKeyChecking=no'
master-3 ansible_host=10.0.13.XXX ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/taskapp-k8s ansible_ssh_common_args='-o ProxyJump=ubuntu@YOUR_BASTION_IP -o StrictHostKeyChecking=no'

[workers]
worker-1 ansible_host=10.0.11.YYY ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/taskapp-k8s ansible_ssh_common_args='-o ProxyJump=ubuntu@YOUR_BASTION_IP -o StrictHostKeyChecking=no'
worker-2 ansible_host=10.0.12.YYY ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/taskapp-k8s ansible_ssh_common_args='-o ProxyJump=ubuntu@YOUR_BASTION_IP -o StrictHostKeyChecking=no'
worker-3 ansible_host=10.0.13.YYY ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/taskapp-k8s ansible_ssh_common_args='-o ProxyJump=ubuntu@YOUR_BASTION_IP -o StrictHostKeyChecking=no'

[k8s_nodes:children]
masters
workers
```

REPLACE `YOUR_BASTION_IP` with `$BASTION_IP`.
REPLACE the `10.0.11.XXX` etc. with your actual node private IPs from Step 15.1.

---

## STEP 15.4 — Create the Node Hardening Role

CREATE `ansible/roles/node-hardening/tasks/main.yml`:

```yaml
# ansible/roles/node-hardening/tasks/main.yml
# These tasks harden each Kubernetes node for production use.

---
# ── OS UPDATES ────────────────────────────────────────────────────────────────
- name: Update apt package cache
  apt:
    update_cache: yes
    cache_valid_time: 3600
  become: yes

- name: Upgrade all packages to latest security patches
  apt:
    upgrade: safe
    autoremove: yes
    autoclean: yes
  become: yes

# ── TIME SYNCHRONIZATION ──────────────────────────────────────────────────────
# Kubernetes requires all nodes to have synchronized clocks.
# Clock drift causes certificate validation failures and etcd issues.
- name: Install chrony for time synchronization
  apt:
    name: chrony
    state: present
  become: yes

- name: Ensure chrony is running and enabled
  systemd:
    name: chrony
    state: started
    enabled: yes
  become: yes

- name: Configure chrony to use AWS time servers
  copy:
    dest: /etc/chrony/chrony.conf
    content: |
      # Use Amazon Time Sync Service (most accurate for AWS EC2)
      server 169.254.169.123 prefer iburst
      # Fallback to public NTP servers
      pool 2.ubuntu.pool.ntp.org iburst
      driftfile /var/lib/chrony/drift
      makestep 1.0 3
      rtcsync
      logdir /var/log/chrony
    owner: root
    group: root
    mode: '0644'
  become: yes
  notify: restart chrony

# ── LOG ROTATION ──────────────────────────────────────────────────────────────
- name: Configure log rotation for container logs
  copy:
    dest: /etc/logrotate.d/containers
    content: |
      /var/log/containers/*.log {
          daily
          rotate 7
          compress
          delaycompress
          missingok
          notifempty
          copytruncate
      }
    owner: root
    group: root
    mode: '0644'
  become: yes

- name: Configure log rotation for Kubernetes logs
  copy:
    dest: /etc/logrotate.d/kubernetes
    content: |
      /var/log/kube*.log {
          daily
          rotate 5
          compress
          delaycompress
          missingok
          notifempty
          copytruncate
      }
    owner: root
    group: root
    mode: '0644'
  become: yes

# ── DOCKER DAEMON OPTIMIZATION ────────────────────────────────────────────────
- name: Configure Docker daemon for production
  copy:
    dest: /etc/docker/daemon.json
    content: |
      {
        "log-driver": "json-file",
        "log-opts": {
          "max-size": "100m",
          "max-file": "3"
        },
        "storage-driver": "overlay2",
        "live-restore": true,
        "userland-proxy": false,
        "no-new-privileges": true
      }
    owner: root
    group: root
    mode: '0644'
  become: yes
  notify: restart docker

# ── SECURITY HARDENING ────────────────────────────────────────────────────────
- name: Disable unused filesystems
  copy:
    dest: /etc/modprobe.d/disable-filesystems.conf
    content: |
      install cramfs /bin/true
      install freevxfs /bin/true
      install jffs2 /bin/true
      install hfs /bin/true
      install hfsplus /bin/true
      install squashfs /bin/true
      install udf /bin/true
    owner: root
    group: root
    mode: '0644'
  become: yes

- name: Set kernel security parameters via sysctl
  sysctl:
    name: "{{ item.name }}"
    value: "{{ item.value }}"
    state: present
    reload: yes
  become: yes
  loop:
    - { name: 'net.ipv4.ip_forward', value: '1' }           # Required for Kubernetes
    - { name: 'net.bridge.bridge-nf-call-iptables', value: '1' }  # Required for Calico
    - { name: 'net.ipv4.conf.all.send_redirects', value: '0' }
    - { name: 'net.ipv4.conf.default.send_redirects', value: '0' }
    - { name: 'net.ipv4.conf.all.accept_redirects', value: '0' }
    - { name: 'kernel.dmesg_restrict', value: '1' }

# ── INSTALL USEFUL TOOLS ──────────────────────────────────────────────────────
- name: Install useful diagnostic tools
  apt:
    name:
      - htop
      - iotop
      - net-tools
      - tcpdump
      - curl
      - jq
      - vim
    state: present
  become: yes
```

CREATE `ansible/roles/node-hardening/handlers/main.yml`:

```yaml
# ansible/roles/node-hardening/handlers/main.yml
# Handlers run only when notified by a task (e.g., when config changes)

---
- name: restart chrony
  systemd:
    name: chrony
    state: restarted
  become: yes

- name: restart docker
  systemd:
    name: docker
    state: restarted
  become: yes
```

---

## STEP 15.5 — Create the Main Hardening Playbook

CREATE `ansible/playbooks/harden-nodes.yml`:

```yaml
# ansible/playbooks/harden-nodes.yml
# Run this playbook to harden ALL Kubernetes nodes at once.

---
- name: Harden all Kubernetes nodes
  hosts: k8s_nodes
  gather_facts: yes
  serial: 1          # Run on one node at a time to avoid disrupting the cluster

  pre_tasks:
  - name: Verify node is reachable
    ping:

  roles:
  - role: node-hardening

  post_tasks:
  - name: Verify chrony is synchronized
    command: chronyc tracking
    register: chrony_output
    become: yes

  - name: Show time sync status
    debug:
      msg: "{{ chrony_output.stdout_lines }}"
```

---

## STEP 15.6 — Run the Ansible Playbook

```bash
# First, test connectivity to all nodes
ansible all -i ansible/inventory/hosts.ini -m ping

# Expected output for each node:
# worker-1 | SUCCESS => {"ping": "pong"}
# worker-2 | SUCCESS => {"ping": "pong"}
# ...

# Run the hardening playbook
ansible-playbook \
  -i ansible/inventory/hosts.ini \
  ansible/playbooks/harden-nodes.yml \
  --diff \
  -v

# The --diff flag shows exactly what changed on each server
# The -v flag gives verbose output so you can see each task executing

echo "✅ All nodes hardened"
```

---

## STEP 15.7 — Commit Ansible Files

```bash
git add ansible/
git commit -m "feat: add Ansible node hardening playbook

- OS security updates and patches
- Chrony time synchronization (AWS time server)
- Log rotation for container and Kubernetes logs
- Docker daemon optimization (log limits, overlay2, live-restore)
- Kernel security parameters via sysctl
- Unused filesystem modules disabled"
```
