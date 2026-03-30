# SECTION 1 — Prerequisites & Tool Installation

> Before touching AWS, install every tool on your local machine.
> Every command below runs in your terminal (Mac/Linux) or WSL2 (Windows).

---

## STEP 1.1 — Install AWS CLI v2

The AWS CLI lets you talk to AWS from your terminal.

OPEN your terminal and RUN:

```bash
# macOS (using Homebrew)
brew install awscli

# Linux (Ubuntu/Debian)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
# Expected output: aws-cli/2.x.x Python/3.x.x ...
```

---

## STEP 1.2 — Install Terraform

Terraform is the tool that creates all your AWS infrastructure from code files.

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Linux (Ubuntu/Debian)
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Verify
terraform --version
# Expected: Terraform v1.7.x or later
```

---

## STEP 1.3 — Install Kops

Kops creates and manages Kubernetes clusters on AWS.

```bash
# macOS
brew install kops

# Linux
curl -Lo kops https://github.com/kubernetes/kops/releases/download/v1.28.4/kops-linux-amd64
chmod +x kops
sudo mv kops /usr/local/bin/kops

# Verify
kops version
# Expected: Version 1.28.x
```

---

## STEP 1.4 — Install kubectl

kubectl is the command-line tool for talking to your Kubernetes cluster.

```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/kubectl

# Verify
kubectl version --client
# Expected: Client Version: v1.28.x
```

---

## STEP 1.5 — Install Docker

Docker builds and packages your application into container images.

```bash
# macOS — Download Docker Desktop from https://www.docker.com/products/docker-desktop/

# Linux (Ubuntu)
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# LOG OUT and LOG BACK IN after this command

# Verify
docker --version
# Expected: Docker version 24.x.x
```

---

## STEP 1.6 — Install Helm

Helm is the package manager for Kubernetes — like apt/brew but for Kubernetes apps.

```bash
# macOS
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version
# Expected: version.BuildInfo{Version:"v3.x.x"...}
```

---

## STEP 1.7 — Install kubeseal (for Sealed Secrets)

kubeseal encrypts your Kubernetes secrets so they are safe to commit to Git.

```bash
# macOS
brew install kubeseal

# Linux
KUBESEAL_VERSION=$(curl -s https://api.github.com/repos/bitnami-labs/sealed-secrets/tags | jq -r '.[0].name' | cut -c 2-)
curl -OL "https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz"
tar -xvzf kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz kubeseal
sudo install -m 755 kubeseal /usr/local/bin/kubeseal

# Verify
kubeseal --version
```

---

## STEP 1.8 — Install Ansible (Optional but Recommended for +bonus)

Ansible automates server configuration without needing to SSH manually.

```bash
# macOS
brew install ansible

# Linux (Ubuntu)
sudo apt update
sudo apt install -y ansible

# Verify
ansible --version
# Expected: ansible [core 2.x.x]
```

---

## STEP 1.9 — Create Your Project Repository

OPEN VS Code. OPEN a terminal inside VS Code (Terminal → New Terminal).

```bash
# Create your project directory
mkdir capstone-taskapp
cd capstone-taskapp

# Initialize git
git init
git checkout -b main

# Create the full folder structure
mkdir -p terraform/modules/{vpc,iam,dns}
mkdir -p kops
mkdir -p k8s/base/{postgres,backend,frontend}
mkdir -p k8s/production/patches
mkdir -p ansible/{inventory,playbooks,roles}
mkdir -p scripts
mkdir -p docs

# Create a .gitignore immediately — CRITICAL to avoid committing secrets
cat > .gitignore << 'EOF'
# Terraform state — NEVER commit these
*.tfstate
*.tfstate.backup
*.tfstate.lock.info
.terraform/
.terraform.lock.hcl
terraform.tfvars

# Secrets
*.pem
*.key
kubeconfig
.env
.env.*
!.env.example

# Kops
kops-state/

# OS
.DS_Store
*.swp
EOF

echo "✅ Project structure created"
```

---

## STEP 1.10 — Verify All Tools Are Installed

RUN this verification script to confirm everything is ready:

```bash
echo "=== Tool Verification ==="
aws --version && echo "✅ AWS CLI OK" || echo "❌ AWS CLI MISSING"
terraform --version | head -1 && echo "✅ Terraform OK" || echo "❌ Terraform MISSING"
kops version && echo "✅ Kops OK" || echo "❌ Kops MISSING"
kubectl version --client --short 2>/dev/null && echo "✅ kubectl OK" || echo "❌ kubectl MISSING"
docker --version && echo "✅ Docker OK" || echo "❌ Docker MISSING"
helm version --short && echo "✅ Helm OK" || echo "❌ Helm MISSING"
kubeseal --version && echo "✅ kubeseal OK" || echo "❌ kubeseal MISSING"
```

All items must show ✅ before proceeding.
