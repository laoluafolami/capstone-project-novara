# SECTION 9 — Kops: Create the Kubernetes Cluster

> Kops = Kubernetes Operations. It is the tool that creates, upgrades, and
> manages production Kubernetes clusters on AWS. Think of it as a "cluster
> installer" that knows how to set up everything correctly on AWS.
>
> How Kops works:
>   1. You describe the cluster you want in a YAML file (or via CLI flags)
>   2. Kops saves that description to S3 (the Kops state store)
>   3. Kops creates the actual AWS resources (EC2 instances, ASGs, etc.)
>   4. The EC2 instances boot up and form a Kubernetes cluster
>
> Key concept — CLUSTER NAME: Kops requires the cluster name to be a valid
> DNS name (FQDN). We use k8s.yourdomain.com. Kops will create DNS records
> inside this subdomain automatically.

---

## STEP 9.1 — Set Kops Environment Variables

OPEN your terminal. RUN:

```bash
# Your cluster FQDN — must match what you used in Terraform
export CLUSTER_NAME="k8s.${DOMAIN_NAME}"
export KOPS_STATE_STORE="s3://${KOPS_STATE_BUCKET}"

# Persist these
echo "export CLUSTER_NAME=k8s.${DOMAIN_NAME}" >> ~/.bashrc
echo "export KOPS_STATE_STORE=s3://${KOPS_STATE_BUCKET}" >> ~/.bashrc

# Reload your shell config
source ~/.bashrc

echo "Cluster name: $CLUSTER_NAME"
echo "Kops state store: $KOPS_STATE_STORE"
```

---

## STEP 9.2 — Generate an SSH Key Pair for Node Access

Kops needs an SSH public key to inject into the nodes so you can SSH in
for debugging if needed.

```bash
# Generate a dedicated SSH key for this cluster
ssh-keygen -t rsa -b 4096 -f ~/.ssh/taskapp-k8s -N "" -C "taskapp-k8s-cluster"

# Verify the key was created
ls -la ~/.ssh/taskapp-k8s*
# You should see:
# ~/.ssh/taskapp-k8s      (private key — NEVER share this)
# ~/.ssh/taskapp-k8s.pub  (public key — safe to share)
```

---

## STEP 9.3 — Create the Kops Cluster Specification

This is the most important step. You are defining the entire cluster in one command.
Read every flag carefully — each one is explained.

```bash
kops create cluster \
  --name="${CLUSTER_NAME}" \
  --state="${KOPS_STATE_STORE}" \
  \
  # Kubernetes version — must be 1.28.x or later per requirements
  --kubernetes-version="1.28.6" \
  \
  # Cloud provider
  --cloud=aws \
  --regions="${AWS_REGION}" \
  \
  # Spread masters across all 3 AZs — this is the HA requirement
  --master-zones="${AZ1},${AZ2},${AZ3}" \
  \
  # Spread workers across all 3 AZs
  --zones="${AZ1},${AZ2},${AZ3}" \
  \
  # 3 masters = etcd quorum (needs odd number: 1, 3, 5...)
  --master-count=3 \
  \
  # 3 workers minimum — one per AZ
  --node-count=3 \
  \
  # Master instance type — t3.medium is minimum for production masters
  --master-size="t3.medium" \
  \
  # Worker instance type — t3.medium gives 2 vCPU, 4GB RAM
  --node-size="t3.medium" \
  \
  # Use the VPC Terraform created
  --vpc="${VPC_ID}" \
  \
  # Place nodes in PRIVATE subnets — mandatory security requirement
  --subnets="${PRIVATE_SUBNET_IDS}" \
  \
  # Place the API server load balancer in PUBLIC subnets
  --utility-subnets="${PUBLIC_SUBNET_IDS}" \
  \
  # Private topology = nodes have no public IPs
  --topology=private \
  \
  # Use Calico as the CNI (supports NetworkPolicy — required)
  --networking=calico \
  \
  # DNS zone for the cluster
  --dns-zone="${CLUSTER_NAME}" \
  \
  # SSH public key to inject into nodes
  --ssh-public-key="~/.ssh/taskapp-k8s.pub" \
  \
  # Use the IAM instance profiles Terraform created
  --master-security-groups="" \
  \
  # Enable etcd encryption at rest
  --encrypt-etcd-storage \
  \
  # Output as YAML so we can review and version control it
  --output=yaml \
  --dry-run > kops/cluster.yaml

echo "✅ Cluster spec written to kops/cluster.yaml"
```

> The `--dry-run` flag means Kops writes the spec to a file WITHOUT creating
> anything in AWS yet. You review it first, then apply it.

---

## STEP 9.4 — Review and Edit the Cluster YAML

OPEN VS Code. OPEN `kops/cluster.yaml`.

You need to add the etcd backup configuration. FIND the `etcdClusters` section
and REPLACE it with this (it will appear twice — for `main` and `events`):

```yaml
# Inside kops/cluster.yaml — find etcdClusters and update it

etcdClusters:
- etcdMembers:
  - instanceGroup: master-us-east-1a
    name: a
  - instanceGroup: master-us-east-1b
    name: b
  - instanceGroup: master-us-east-1c
    name: c
  name: main
  # Enable etcd backups to S3 — mandatory requirement
  backups:
    backupStore: s3://YOUR_ETCD_BACKUP_BUCKET/k8s.yourdomain.com/etcd/main
  # Encrypt etcd data at rest
  encryptedVolume: true
  # Use gp3 volumes for better performance and lower cost than gp2
  manager:
    backupInterval: 1h
    backupRetentionDays: 7

- etcdMembers:
  - instanceGroup: master-us-east-1a
    name: a
  - instanceGroup: master-us-east-1b
    name: b
  - instanceGroup: master-us-east-1c
    name: c
  name: events
  backups:
    backupStore: s3://YOUR_ETCD_BACKUP_BUCKET/k8s.yourdomain.com/etcd/events
  encryptedVolume: true
```

REPLACE `YOUR_ETCD_BACKUP_BUCKET` with your actual `$ETCD_BACKUP_BUCKET` value.
REPLACE `k8s.yourdomain.com` with your actual `$CLUSTER_NAME`.

Also ADD the cluster autoscaler configuration. FIND `spec:` at the top level
and ADD this section:

```yaml
# Add inside the cluster spec
spec:
  # ... existing spec content ...

  # Cluster Autoscaler — automatically adds/removes nodes based on load
  clusterAutoscaler:
    enabled: true
    expander: least-waste
    balanceSimilarNodeGroups: false
    skipNodesWithSystemPods: true
    skipNodesWithLocalStorage: false
    newPodScaleUpDelay: 0s
    scaleDownDelayAfterAdd: 10m
    scaleDownUnneededTime: 10m
    scaleDownUtilizationThreshold: "0.5"
    maxNodeProvisionTime: 15m
```

---

## STEP 9.5 — Create the Instance Groups YAML

Instance Groups define the EC2 Auto Scaling Groups for masters and workers.

CREATE `kops/instance-groups.yaml`:

```yaml
# kops/instance-groups.yaml
# This file defines the master and worker node groups

---
# Master node group for AZ us-east-1a
apiVersion: kops.k8s.io/v1alpha2
kind: InstanceGroup
metadata:
  labels:
    kops.k8s.io/cluster: k8s.yourdomain.com
  name: master-us-east-1a
spec:
  image: 099720109477/ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-20240301
  machineType: t3.medium
  maxSize: 1
  minSize: 1
  nodeLabels:
    kops.k8s.io/instancegroup: master-us-east-1a
    node-role.kubernetes.io/control-plane: ""
  role: Master
  subnets:
  - us-east-1a
  # Root volume — gp3 is faster and cheaper than gp2
  rootVolumeSize: 64
  rootVolumeType: gp3
  rootVolumeEncryption: true

---
apiVersion: kops.k8s.io/v1alpha2
kind: InstanceGroup
metadata:
  labels:
    kops.k8s.io/cluster: k8s.yourdomain.com
  name: master-us-east-1b
spec:
  image: 099720109477/ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-20240301
  machineType: t3.medium
  maxSize: 1
  minSize: 1
  nodeLabels:
    kops.k8s.io/instancegroup: master-us-east-1b
    node-role.kubernetes.io/control-plane: ""
  role: Master
  subnets:
  - us-east-1b
  rootVolumeSize: 64
  rootVolumeType: gp3
  rootVolumeEncryption: true

---
apiVersion: kops.k8s.io/v1alpha2
kind: InstanceGroup
metadata:
  labels:
    kops.k8s.io/cluster: k8s.yourdomain.com
  name: master-us-east-1c
spec:
  image: 099720109477/ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-20240301
  machineType: t3.medium
  maxSize: 1
  minSize: 1
  nodeLabels:
    kops.k8s.io/instancegroup: master-us-east-1c
    node-role.kubernetes.io/control-plane: ""
  role: Master
  subnets:
  - us-east-1c
  rootVolumeSize: 64
  rootVolumeType: gp3
  rootVolumeEncryption: true

---
# Worker node group — spans all 3 AZs with autoscaling
apiVersion: kops.k8s.io/v1alpha2
kind: InstanceGroup
metadata:
  labels:
    kops.k8s.io/cluster: k8s.yourdomain.com
  name: nodes
spec:
  image: 099720109477/ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-20240301
  machineType: t3.medium
  # Autoscaling: min 3 nodes (one per AZ), max 9 nodes
  maxSize: 9
  minSize: 3
  nodeLabels:
    kops.k8s.io/instancegroup: nodes
    node-role.kubernetes.io/node: ""
  role: Node
  subnets:
  - us-east-1a
  - us-east-1b
  - us-east-1c
  rootVolumeSize: 50
  rootVolumeType: gp3
  rootVolumeEncryption: true
  # Cloud labels for cluster autoscaler
  cloudLabels:
    k8s.io/cluster-autoscaler/enabled: "true"
    k8s.io/cluster-autoscaler/k8s.yourdomain.com: "owned"
```

REPLACE all occurrences of `k8s.yourdomain.com` with your actual `$CLUSTER_NAME`.

---

## STEP 9.6 — Apply the Cluster Specification to Kops State Store

```bash
# Upload the cluster spec to the Kops S3 state store
# This does NOT create AWS resources yet — it just saves the config
kops replace -f kops/cluster.yaml --state="${KOPS_STATE_STORE}" --force
kops replace -f kops/instance-groups.yaml --state="${KOPS_STATE_STORE}" --force

echo "✅ Cluster spec saved to Kops state store"
```

---

## STEP 9.7 — Create the Cluster Secrets (SSH Key)

```bash
# Register the SSH public key with Kops
kops create secret sshpublickey admin \
  --name="${CLUSTER_NAME}" \
  --state="${KOPS_STATE_STORE}" \
  -i ~/.ssh/taskapp-k8s.pub

echo "✅ SSH key registered with Kops"
```

---

## STEP 9.8 — Preview What Kops Will Create

```bash
# Show the full plan of what Kops will create in AWS
kops update cluster \
  --name="${CLUSTER_NAME}" \
  --state="${KOPS_STATE_STORE}"

# Read through the output. You will see:
# Will create resources:
#   AutoscalingGroup/master-us-east-1a.masters.k8s.yourdomain.com
#   AutoscalingGroup/master-us-east-1b.masters.k8s.yourdomain.com
#   AutoscalingGroup/master-us-east-1c.masters.k8s.yourdomain.com
#   AutoscalingGroup/nodes.k8s.yourdomain.com
#   LoadBalancer/api.k8s.yourdomain.com
#   ... and many more
```

---

## STEP 9.9 — Create the Cluster (This Launches EC2 Instances)

```bash
# Apply the cluster — this creates all AWS resources
# --yes confirms you want to proceed
kops update cluster \
  --name="${CLUSTER_NAME}" \
  --state="${KOPS_STATE_STORE}" \
  --yes \
  --admin

# This command returns quickly but the cluster takes 10–15 minutes to be ready
# The --admin flag also exports the kubeconfig to ~/.kube/config
echo "✅ Cluster creation initiated. Waiting for nodes to be ready..."
```

---

## STEP 9.10 — Wait for the Cluster to Become Ready

```bash
# Poll until the cluster is ready — this can take 10–20 minutes
# Run this command repeatedly until you see "Cluster is ready"
kops validate cluster \
  --name="${CLUSTER_NAME}" \
  --state="${KOPS_STATE_STORE}" \
  --wait 20m

# Expected final output:
# Validating cluster k8s.yourdomain.com
#
# INSTANCE GROUPS
# NAME                    ROLE    MACHINETYPE  MIN  MAX  SUBNETS
# master-us-east-1a       Master  t3.medium    1    1    us-east-1a
# master-us-east-1b       Master  t3.medium    1    1    us-east-1b
# master-us-east-1c       Master  t3.medium    1    1    us-east-1c
# nodes                   Node    t3.medium    3    9    us-east-1a,us-east-1b,us-east-1c
#
# NODE STATUS
# NAME                          ROLE    READY
# ip-10-0-11-xxx.ec2.internal   master  True
# ip-10-0-12-xxx.ec2.internal   master  True
# ip-10-0-13-xxx.ec2.internal   master  True
# ip-10-0-11-yyy.ec2.internal   node    True
# ip-10-0-12-yyy.ec2.internal   node    True
# ip-10-0-13-yyy.ec2.internal   node    True
#
# Your cluster k8s.yourdomain.com is ready
```

---

## STEP 9.11 — Verify kubectl Can Talk to the Cluster

```bash
# List all nodes — you should see 3 masters and 3 workers
kubectl get nodes -o wide

# Expected output (IPs will differ):
# NAME                          STATUS   ROLES           AGE   VERSION   INTERNAL-IP
# ip-10-0-11-xxx.ec2.internal   Ready    control-plane   10m   v1.28.6   10.0.11.xxx
# ip-10-0-12-xxx.ec2.internal   Ready    control-plane   10m   v1.28.6   10.0.12.xxx
# ip-10-0-13-xxx.ec2.internal   Ready    control-plane   10m   v1.28.6   10.0.13.xxx
# ip-10-0-11-yyy.ec2.internal   Ready    node            8m    v1.28.6   10.0.11.yyy
# ip-10-0-12-yyy.ec2.internal   Ready    node            8m    v1.28.6   10.0.12.yyy
# ip-10-0-13-yyy.ec2.internal   Ready    node            8m    v1.28.6   10.0.13.yyy

# Verify all nodes have INTERNAL IPs only (10.0.x.x) — no public IPs
# This confirms the private topology requirement is met

# Check system pods are running
kubectl get pods -n kube-system

# Commit your kops files
cd /path/to/capstone-taskapp
git add kops/
git commit -m "feat: add kops cluster spec with 3-master HA configuration

- 3 masters across us-east-1a/b/c
- 3-9 worker nodes with autoscaling
- Private topology (no public node IPs)
- Calico CNI for NetworkPolicy support
- etcd backups to S3 every 1 hour
- gp3 encrypted root volumes"
```
