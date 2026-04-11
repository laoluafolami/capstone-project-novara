**Document Version:** 1.0  
**Last Updated:** April 2026  
**Purpose:** Operational procedures for deployment, scaling, maintenance, and troubleshooting

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [How to Deploy the Application](#how-to-deploy-the-application)
3. [How to Scale the Cluster](#how-to-scale-the-cluster)
4. [How to Rotate Secrets](#how-to-rotate-secrets)
5. [Backup & Recovery Procedures](#backup--recovery-procedures)
6. [Troubleshooting Common Failures](#troubleshooting-common-failures)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Cleanup Procedures](#cleanup-procedures)

---

## 🔧 Prerequisites

### Required Tools

| Tool | Version | Installation |
|------|---------|--------------|
| **kubectl** | 1.28+ | `curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"` |
| **kops** | 1.28+ | `curl -LO https://github.com/kubernetes/kops/releases/download/$(curl -s https://api.github.com/repos/kubernetes/kops/releases/latest | grep tag_name | cut -d '"' -f 4)/kops-linux-amd64` |
| **terraform** | 1.5+ | `wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip` |
| **aws-cli** | 2.x | `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"` |
| **docker** | 24+ | `curl -fsSL https://get.docker.com | sh` |

### Environment Configuration

```bash
cat > scripts/export-env.sh << 'EOF'
export KOPS_CLUSTER_NAME=k8s.task-app.online
export KOPS_STATE_STORE=s3://taskapp-kops-state-755077304796
export AWS_REGION=us-east-1
export DOMAIN_NAME=task-app.online
export ECR_REGISTRY=755077304796.dkr.ecr.us-east-1.amazonaws.com
export TF_VAR_aws_region=us-east-1
export TF_VAR_cluster_name=k8s.task-app.online
export TF_VAR_domain_name=task-app.online
EOF

source scripts/export-env.sh
```

<img width="811" height="285" alt="image" src="https://github.com/user-attachments/assets/c35e1e4e-230e-4d27-9391-48a6d17995a0" />

```
cd ~/capstone-taskapp/terraform
terraform init
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
terraform output
```

<img width="817" height="137" alt="image" src="https://github.com/user-attachments/assets/69cbda47-d4c5-4713-b0e1-11abf7dbc9aa" />

```
kops create cluster \
  --name=${KOPS_CLUSTER_NAME} \
  --state=${KOPS_STATE_STORE} \
  --zones=us-east-1a,us-east-1b,us-east-1c \
  --master-zones=us-east-1a,us-east-1b,us-east-1c \
  --node-count=3 \
  --node-size=t3.medium \
  --master-size=t3.medium \
  --networking=calico \
  --topology=private \
  --bastion \
  --ssh-public-key=~/.ssh/id_rsa.pub \
  --encryption-config=true

kops edit cluster ${KOPS_CLUSTER_NAME}
kops update cluster --name=${KOPS_CLUSTER_NAME} --state=${KOPS_STATE_STORE} --yes
kops validate cluster --wait 300s
```

<img width="343" height="48" alt="image" src="https://github.com/user-attachments/assets/153c4f2c-18fc-40ca-a51e-e036d29b5dfd" />

```
aws ecr create-repository --repository-name taskapp/frontend --region $AWS_REGION
aws ecr create-repository --repository-name taskapp/backend --region $AWS_REGION

cd ~/capstone-taskapp/taskapp_frontend
docker build -t ${ECR_REGISTRY}/taskapp/frontend:v1.0 .
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
docker push ${ECR_REGISTRY}/taskapp/frontend:v1.0

cd ~/capstone-taskapp/taskapp_backend
docker build -t ${ECR_REGISTRY}/taskapp/backend:v1.0 .
docker push ${ECR_REGISTRY}/taskapp/backend:v1.0

cd ~/capstone-taskapp/k8s/base
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f services.yaml
kubectl apply -f ingress.yaml

kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
kubectl wait --for=condition=ready pod --all -n taskapp --timeout=300s
```

### Phase 4: DNS Configuration
```
INGRESS_ELB=$(kubectl get ingress taskapp-ingress -n taskapp -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name ${DOMAIN_NAME}. --query 'HostedZones[0].Id' --output text | cut -d'/' -f3)

cat > /tmp/dns-records.json << EOF
{
  "Comment": "Create records for TaskApp ingress",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${DOMAIN_NAME}",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z26RNL4JYFTOTI",
          "DNSName": "${INGRESS_ELB}",
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
          "HostedZoneId": "Z26RNL4JYFTOTI",
          "DNSName": "${INGRESS_ELB}",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file:///tmp/dns-records.json

<img width="797" height="77" alt="image" src="https://github.com/user-attachments/assets/97b98531-66d5-490c-bccc-b565e938cf5e" />


```
### Phase 5: Verification

```
echo "=== Cluster Validation ==="
kops validate cluster

echo -e "\n=== Pod Status ==="
kubectl get pods -n taskapp -o wide

echo -e "\n=== Certificate Status ==="
kubectl get certificate -n taskapp -o wide

echo -e "\n=== Ingress Status ==="
kubectl get ingress -n taskapp -o wide

echo -e "\n=== HTTPS Test ==="
curl -I https://${DOMAIN_NAME}
curl -s https://api.${DOMAIN_NAME}/api/health
```
<img width="824" height="311" alt="image" src="https://github.com/user-attachments/assets/ccf0ed9f-ac36-4c5f-9c88-643a55e7a713" />


```
kops edit instancegroup nodes-us-east-1a
# Change machineType: t3.large
kops update cluster --yes
kops rolling-update cluster --yes
```

<img width="845" height="81" alt="image" src="https://github.com/user-attachments/assets/93f4a8e4-2c8b-4eb8-880b-d18c8fb79720" />

```
kops edit instancegroup nodes-us-east-1a
# Change maxSize: 5, minSize: 3
kops update cluster --yes
```
<img width="702" height="185" alt="image" src="https://github.com/user-attachments/assets/f194532d-a695-4c9a-8e31-3ee04c2ccea0" />

<img width="845" height="72" alt="image" src="https://github.com/user-attachments/assets/bf0275da-38ed-416d-a1e7-ca50166858f6" />

```
kubectl scale deployment taskapp-backend --replicas=5 -n taskapp
kubectl scale deployment taskapp-frontend --replicas=5 -n taskapp
kubectl get pods -n taskapp -o wide
```

<img width="1490" height="139" alt="image" src="https://github.com/user-attachments/assets/e177bcb7-1433-444c-b02d-b7b2435249c9" />

<img width="841" height="116" alt="image" src="https://github.com/user-attachments/assets/093794db-9d33-4f08-9342-a262ee3e2e2b" />

```
NEW_PASSWORD=$(openssl rand -base64 32)
kubectl exec -n taskapp postgres-0 -- psql -U taskapp_user -d taskapp_db -c "ALTER USER taskapp_user WITH PASSWORD '${NEW_PASSWORD}';"
kubectl create secret generic taskapp-db-credentials --from-literal=DB_PASSWORD=${NEW_PASSWORD} --dry-run=client -o yaml | kubectl apply -f - -n taskapp
kubectl rollout restart deployment taskapp-backend -n taskapp
kubectl wait --for=condition=ready pod -l app=taskapp-backend -n taskapp --timeout=120s
```

<img width="826" height="61" alt="image" src="https://github.com/user-attachments/assets/daea74b5-4fa4-435d-8727-ad607da4f30f" />

```
kubectl delete certificate taskapp-frontend-tls -n taskapp
kubectl delete certificate taskapp-backend-tls -n taskapp
kubectl get certificate -n taskapp -w
```

<img width="859" height="80" alt="image" src="https://github.com/user-attachments/assets/323332e1-c114-41ed-a533-66857a866de2" />

<img width="849" height="118" alt="image" src="https://github.com/user-attachments/assets/917ff27e-acb1-4e7c-8e5f-8e56b19950c4" />

```
kops ssh master-us-east-1a
ETCDCTL_API=3 etcdctl snapshot save /tmp/etcd-snapshot-$(date +%Y%m%d-%H%M%S).db --endpoints=https://127.0.0.1:4001 --cacert=/srv/kubernetes/etcd-manager/ca.crt --cert=/srv/kubernetes/etcd-manager/peer.crt --key=/srv/kubernetes/etcd-manager/peer.key
aws s3 cp /tmp/etcd-snapshot-*.db s3://taskapp-kops-state-755077304796/backups/etcd/manual/
```

<img width="843" height="198" alt="image" src="https://github.com/user-attachments/assets/7db5bad2-99ff-4dab-978f-d9fc332fd1d3" />

```
kubectl exec -n taskapp postgres-0 -- pg_dump -U taskapp_user -d taskapp_db > /tmp/db-backup-$(date +%Y%m%d-%H%M%S).sql
aws s3 cp /tmp/db-backup-*.sql s3://taskapp-app-backups/postgresql/
```

<img width="835" height="190" alt="image" src="https://github.com/user-attachments/assets/fb8c04af-36b5-4706-a4af-c2a2d0cba87e" />

```
cd ~/capstone-taskapp/terraform
terraform init
terraform apply -auto-approve

kops create cluster --name=${KOPS_CLUSTER_NAME} --state=${KOPS_STATE_STORE} ...
kops update cluster --yes
kops validate cluster --wait 300s

cd ~/capstone-taskapp/k8s/base
kubectl apply -f .

curl -s https://api.${DOMAIN_NAME}/api/health
```

<img width="845" height="239" alt="image" src="https://github.com/user-attachments/assets/8eb1c9f8-6cf6-4019-b747-f62442307a49" />

```
kubectl describe pod taskapp-backend-xxxxx -n taskapp | grep -A 10 "Events:"
kubectl describe nodes | grep -A 5 "Allocated resources:"
```

### Solutions:

```
kubectl scale deployment taskapp-backend --replicas=1 -n taskapp
kubectl get pvc -n taskapp
kubectl describe pvc <pvc-name> -n taskapp
```

<img width="834" height="111" alt="image" src="https://github.com/user-attachments/assets/95bc6ee8-1a46-4679-a159-34479e1da55c" />

```
kubectl logs -n cert-manager -l app.kubernetes.io/name=cert-manager --tail=50
kubectl get challenge -n taskapp
dig _acme-challenge.task-app.online TXT +short
```

### Solutions:

```
kubectl delete certificate taskapp-frontend-tls -n taskapp
kubectl apply -f k8s/base/ingress.yaml -n taskapp
```

<img width="830" height="115" alt="image" src="https://github.com/user-attachments/assets/c6e0b0ff-39b6-4d91-92a5-c0ec0640ef82" />

```
kubectl get pods -n taskapp -l app=taskapp-backend
kubectl get endpoints backend-service -n taskapp
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=50
```
### Solutions:

```
kubectl describe pod -n taskapp -l app=taskapp-backend | grep -A 10 "Events:"
kubectl edit service backend-service -n taskapp
kubectl rollout restart deployment -n ingress-nginx

```

### 🧹 Cleanup Procedures

```
#!/bin/bash
set -e
echo "⚠️  WARNING: This will destroy all infrastructure!"
read -p "Type 'DESTROY' to confirm: " CONFIRM
if [ "$CONFIRM" != "DESTROY" ]; then exit 1; fi

kops delete cluster ${KOPS_CLUSTER_NAME} --yes
cd terraform && terraform destroy -auto-approve && cd ..
aws s3 rb s3://taskapp-kops-state-755077304796 --force
aws s3 rb s3://taskapp-terraform-state-755077304796 --force
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name ${DOMAIN_NAME}. --query 'HostedZones[0].Id' --output text | cut -d'/' -f3)
aws route53 delete-hosted-zone --id $HOSTED_ZONE_ID

echo "✅ Cleanup complete!"
```


### Document Version: 1.0
- Last Updated: April 2026
- Author: Olaoluwa Afolami
- Project: TaskApp Capstone - Cloud-Native Deployment


























