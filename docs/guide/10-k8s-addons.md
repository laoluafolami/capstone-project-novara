# SECTION 10 — Kubernetes: Install Core Add-ons

> Add-ons are extra software you install INTO your Kubernetes cluster to give it
> production capabilities. Your cluster is running but it cannot yet:
>   - Serve HTTPS traffic (needs NGINX Ingress Controller)
>   - Get SSL certificates automatically (needs cert-manager)
>   - Provision EBS volumes for the database (needs AWS EBS CSI Driver)
>   - Scale nodes automatically (needs Cluster Autoscaler)
>   - Encrypt secrets safely (needs Sealed Secrets)
>
> You install all of these using Helm — the Kubernetes package manager.

---

## STEP 10.1 — Create the Application Namespace

A Namespace is a logical partition inside Kubernetes. It keeps your app's
resources separate from system resources.

```bash
# Create a dedicated namespace for the TaskApp
kubectl create namespace taskapp

# Verify it was created
kubectl get namespaces
# You should see: taskapp   Active   Xs
```

---

## STEP 10.2 — Install the AWS EBS CSI Driver

> CSI = Container Storage Interface. The EBS CSI Driver lets Kubernetes
> automatically create and attach AWS EBS volumes when your PostgreSQL pod
> needs persistent storage. Without this, your database data is lost when
> the pod restarts.

```bash
# Add the AWS EBS CSI Driver Helm repository
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm repo update

# Install the EBS CSI Driver
helm install aws-ebs-csi-driver aws-ebs-csi-driver/aws-ebs-csi-driver \
  --namespace kube-system \
  --set enableVolumeScheduling=true \
  --set enableVolumeResizing=true \
  --set enableVolumeSnapshot=true

# Wait for the driver pods to be running
kubectl rollout status deployment/ebs-csi-controller -n kube-system
echo "✅ EBS CSI Driver installed"
```

Now create a StorageClass that uses gp3 volumes with encryption:

OPEN VS Code. CREATE `k8s/base/storageclass.yaml`:

```yaml
# k8s/base/storageclass.yaml
# StorageClass defines HOW Kubernetes creates EBS volumes
# gp3 is faster and cheaper than gp2 — always prefer gp3

apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-encrypted
  annotations:
    # Make this the default StorageClass for the cluster
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  # Enable encryption at rest for all EBS volumes
  encrypted: "true"
  # gp3 performance parameters
  throughput: "125"
  iops: "3000"
volumeBindingMode: WaitForFirstConsumer  # Only create volume when pod is scheduled
reclaimPolicy: Retain  # CRITICAL: keep the EBS volume even if the PVC is deleted
allowVolumeExpansion: true
```

```bash
# Apply the StorageClass
kubectl apply -f k8s/base/storageclass.yaml

# Verify
kubectl get storageclass
# You should see gp3-encrypted with (default) next to it
```

---

## STEP 10.3 — Install NGINX Ingress Controller

> The Ingress Controller is the traffic cop for your cluster. It receives all
> incoming HTTP/HTTPS requests and routes them to the correct service based on
> the hostname (taskapp.yourdomain.com → frontend, api.yourdomain.com → backend).
> It also handles SSL termination — decrypting HTTPS so your app pods only
> deal with plain HTTP internally.

```bash
# Add the ingress-nginx Helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install NGINX Ingress Controller
# It will automatically create an AWS Network Load Balancer
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."kubernetes\.io/os"=linux \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb" \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-cross-zone-load-balancing-enabled"="true" \
  --set controller.metrics.enabled=true \
  --set controller.config.use-forwarded-headers="true" \
  --set controller.config.compute-full-forwarded-for="true"

# Wait for the ingress controller to be ready
kubectl rollout status deployment/ingress-nginx-controller -n ingress-nginx

echo "✅ NGINX Ingress Controller installed"
```

Get the Load Balancer DNS name (you will need this for DNS):

```bash
# Wait a minute for AWS to provision the Load Balancer, then run:
export INGRESS_LB=$(kubectl get svc ingress-nginx-controller \
  -n ingress-nginx \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Load Balancer DNS: $INGRESS_LB"
echo "export INGRESS_LB=$INGRESS_LB" >> ~/.bashrc

# If the output is empty, wait 2 more minutes and try again
```

---

## STEP 10.4 — Install cert-manager

> cert-manager automatically requests, issues, and renews SSL/TLS certificates
> from Let's Encrypt. Once installed, you just add an annotation to your Ingress
> and cert-manager handles everything — no manual certificate management ever.

```bash
# Add the cert-manager Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager with CRDs (Custom Resource Definitions)
# CRDs extend Kubernetes with new resource types like Certificate and Issuer
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.14.0 \
  --set installCRDs=true \
  --set global.leaderElection.namespace=cert-manager

# Wait for cert-manager pods to be ready
kubectl rollout status deployment/cert-manager -n cert-manager
kubectl rollout status deployment/cert-manager-webhook -n cert-manager
kubectl rollout status deployment/cert-manager-cainjector -n cert-manager

echo "✅ cert-manager installed"
```

Now create a ClusterIssuer — this tells cert-manager HOW to get certificates
(using Let's Encrypt via the ACME protocol):

CREATE `k8s/base/cluster-issuer.yaml`:

```yaml
# k8s/base/cluster-issuer.yaml
# ClusterIssuer tells cert-manager to use Let's Encrypt for SSL certificates
# Let's Encrypt is free and trusted by all browsers

---
# Staging issuer — use this FIRST to test without hitting rate limits
# Let's Encrypt staging certificates are NOT trusted by browsers but are
# useful for testing your setup works before going to production
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    # REPLACE with your actual email address
    email: your-email@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-staging-key
    solvers:
    - http01:
        ingress:
          class: nginx

---
# Production issuer — use this for the final deployment
# These certificates ARE trusted by browsers
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    # REPLACE with your actual email address
    email: your-email@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
    - http01:
        ingress:
          class: nginx
```

```bash
# REPLACE the email before applying
sed -i 's/your-email@yourdomain.com/YOUR_ACTUAL_EMAIL/g' k8s/base/cluster-issuer.yaml

# Apply the ClusterIssuers
kubectl apply -f k8s/base/cluster-issuer.yaml

# Verify they are ready
kubectl get clusterissuer
# Expected:
# NAME                  READY   AGE
# letsencrypt-staging   True    30s
# letsencrypt-prod      True    30s
```

---

## STEP 10.5 — Install Sealed Secrets Controller

> Sealed Secrets solves a critical problem: how do you store Kubernetes secrets
> in Git without exposing passwords? Answer: you encrypt them with a public key.
> Only the Sealed Secrets controller inside your cluster can decrypt them.
> The encrypted file (SealedSecret) is safe to commit to Git.

```bash
# Add the Sealed Secrets Helm repository
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update

# Install the Sealed Secrets controller
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system \
  --set fullnameOverride=sealed-secrets-controller

# Wait for it to be ready
kubectl rollout status deployment/sealed-secrets-controller -n kube-system

echo "✅ Sealed Secrets controller installed"
```

Fetch the public key (used to encrypt secrets locally):

```bash
# Download the public key from the controller
# This key is used by kubeseal to encrypt secrets
kubeseal --fetch-cert \
  --controller-name=sealed-secrets-controller \
  --controller-namespace=kube-system \
  > sealed-secrets-public-key.pem

echo "✅ Public key saved to sealed-secrets-public-key.pem"
# NOTE: This public key is SAFE to commit to Git
# Only the private key (inside the cluster) can decrypt
git add sealed-secrets-public-key.pem
git commit -m "chore: add sealed secrets public key for local encryption"
```

---

## STEP 10.6 — Install Cluster Autoscaler

> The Cluster Autoscaler watches for pods that cannot be scheduled because
> there are not enough nodes. When it detects this, it adds more EC2 instances.
> When nodes are underutilized, it removes them to save cost.

```bash
# Add the autoscaler Helm repository
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

# Install Cluster Autoscaler
# REPLACE k8s.yourdomain.com with your actual CLUSTER_NAME
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set autoDiscovery.clusterName="${CLUSTER_NAME}" \
  --set awsRegion="${AWS_REGION}" \
  --set rbac.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"="" \
  --set extraArgs.balance-similar-node-groups=false \
  --set extraArgs.skip-nodes-with-system-pods=true \
  --set extraArgs.scale-down-delay-after-add=10m \
  --set extraArgs.scale-down-unneeded-time=10m

kubectl rollout status deployment/cluster-autoscaler -n kube-system
echo "✅ Cluster Autoscaler installed"
```

---

## STEP 10.7 — Verify All Add-ons Are Running

```bash
echo "=== Checking all add-ons ==="

echo "--- EBS CSI Driver ---"
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-ebs-csi-driver

echo "--- NGINX Ingress ---"
kubectl get pods -n ingress-nginx

echo "--- cert-manager ---"
kubectl get pods -n cert-manager

echo "--- Sealed Secrets ---"
kubectl get pods -n kube-system -l app.kubernetes.io/name=sealed-secrets

echo "--- Cluster Autoscaler ---"
kubectl get pods -n kube-system -l app.kubernetes.io/name=cluster-autoscaler

echo "--- StorageClass ---"
kubectl get storageclass
```

All pods should show `Running` status before proceeding.

---

## STEP 10.8 — Create DNS Records for the Ingress Load Balancer

Now that you have the Load Balancer DNS name, create Route53 ALIAS records
so your domain points to it.

```bash
# Get the hosted zone ID for your root domain
ROOT_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" \
  --output text | cut -d'/' -f3)

# Get the Load Balancer hosted zone ID (needed for ALIAS records)
LB_HOSTED_ZONE_ID=$(aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?DNSName=='${INGRESS_LB}'].CanonicalHostedZoneId" \
  --output text 2>/dev/null || \
  aws elb describe-load-balancers \
  --query "LoadBalancerDescriptions[?DNSName=='${INGRESS_LB}'].CanonicalHostedZoneNameID" \
  --output text)

# Create the DNS records using a Route53 change batch
cat > /tmp/dns-records.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "taskapp.${DOMAIN_NAME}",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "${LB_HOSTED_ZONE_ID}",
          "DNSName": "${INGRESS_LB}",
          "EvaluateTargetHealth": true
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.${DOMAIN_NAME}",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "${LB_HOSTED_ZONE_ID}",
          "DNSName": "${INGRESS_LB}",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id "$ROOT_ZONE_ID" \
  --change-batch file:///tmp/dns-records.json

echo "✅ DNS records created for taskapp.${DOMAIN_NAME} and api.${DOMAIN_NAME}"
```
