# TaskApp - System Architecture Documentation

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Project:** Cloud-Native TaskApp Deployment on AWS  
**Domain:** https://task-app.online

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Network Design & CIDR Allocation](#network-design--cidr-allocation)
4. [High Availability Strategy](#high-availability-strategy)
5. [Security Model](#security-model)
6. [Component Specifications](#component-specifications)
7. [Data Flow](#data-flow)
8. [Design Decisions](#design-decisions)

---

## 📊 Executive Summary

This document describes the architecture of the TaskApp cloud-native deployment on AWS Kubernetes infrastructure. The system is designed for **production-grade reliability** with high availability across 3 Availability Zones, automated SSL/TLS certificates, private subnet topology, and Infrastructure as Code practices.

### Architecture Overview

| Attribute | Implementation |
|-----------|----------------|
| **Cloud Provider** | AWS (us-east-1) |
| **Kubernetes Version** | 1.28.x via kops |
| **Cluster Topology** | Private subnets, 3 AZs |
| **Control Plane** | 3 master nodes (HA) |
| **Worker Nodes** | 3 nodes (auto-scaling enabled) |
| **CNI** | Calico (NetworkPolicy support) |
| **Ingress** | NGINX Ingress Controller |
| **SSL/TLS** | Let's Encrypt via cert-manager |
| **Domain** | task-app.online |
| **Storage** | EBS gp3 volumes (encrypted) |

### Key Design Principles

1. **High Availability**: No single point of failure across 3 Availability Zones
2. **Security First**: Private subnets, encrypted storage, least-privilege IAM
3. **Infrastructure as Code**: All AWS resources defined in Terraform
4. **Cloud-Native**: Kubernetes-native patterns (Deployments, StatefulSets, Services)
5. **Operational Excellence**: Automated backups, monitoring, and recovery procedures

---

## 🏗️ System Architecture Diagram

### High-Level Architecture

<img width="1650" height="870" alt="image" src="https://github.com/user-attachments/assets/32dc205b-5343-45d8-8356-0c9625fe94be" />


**Figure 1: TaskApp System Architecture**  

### Component Inventory

| Component | Type | Namespace | Replicas | AZ Distribution |
|-----------|------|-----------|----------|-----------------|
| **kube-apiserver** | System | kube-system | 3 (masters) | us-east-1a/b/c |
| **etcd** | System | kube-system | 3 (masters) | us-east-1a/b/c |
| **NGINX Ingress** | Deployment | ingress-nginx | 2+ | us-east-1a/b |
| **cert-manager** | Deployment | cert-manager | 1 | us-east-1a |
| **frontend** | Deployment | taskapp | 2 | us-east-1a/b |
| **backend** | Deployment | taskapp | 2 | us-east-1b/c |
| **postgres** | StatefulSet | taskapp | 1 | us-east-1c |

---

## 🌐 Network Design & CIDR Allocation

### VPC CIDR Block

**Primary CIDR**: `10.0.0.0/16`

**Rationale**:
- Provides 65,536 IP addresses
- Sufficient for current and future scaling (up to 256 subnets with /24)
- Aligns with AWS best practices for VPC sizing
- Allows for easy VPC peering if needed
- Non-overlapping with common on-premises networks (192.168.x.x, 172.16.x.x)

### Subnet Allocation
<img width="647" height="569" alt="image" src="https://github.com/user-attachments/assets/a8434210-46ce-4feb-b36d-ef45e0e585e3" />


### CIDR Allocation Table

| Network | CIDR | Size | Purpose | Justification |
|---------|------|------|---------|---------------|
| **VPC** | 10.0.0.0/16 | 65,536 | Main network | Industry standard, allows expansion |
| **Public Subnets** | 10.0.0.0/23 | 512 | NAT, Bastion, LB | 3 AZs × /24 = 768 IPs needed |
| **Master Subnets** | 10.0.3.0/23 | 512 | Control plane | 3 masters + etcd + system pods |
| **Node Subnets** | 10.0.6.0/23 | 512 | Worker nodes | 3+ nodes + system pods per AZ |
| **Pod CIDR** | 100.64.0.0/10 | 4M+ | Container IPs | CGNAT range, avoids conflicts |
| **Service CIDR** | 100.64.0.0/16 | 65K | Cluster services | Supports up to 65K services |

### CIDR Design Decisions

| Decision | Rationale |
|----------|-----------|
| **/16 VPC** | Balance between IP utilization and future growth |
| **/24 Subnets** | Standard practice, manageable broadcast domains |
| **Separate Master/Node Subnets** | Security isolation, easier troubleshooting |
| **Calico IP Pool (100.64.0.0/10)** | RFC 6598 (shared address space), avoids conflicts |
| **Service CIDR (/16)** | Far exceeds our needs, allows future microservices |

### Network Flow
<img width="323" height="319" alt="image" src="https://github.com/user-attachments/assets/763beee1-aa6c-49a1-835f-450f0157cb68" />


**Security Groups**:
- **Masters**: API server (443), etcd (2379), SSH (22) from bastion only
- **Nodes**: Node ports (30000-32767), kubelet (10250), container runtime
- **Ingress**: HTTP (80), HTTPS (443) from NLB
- **Database**: PostgreSQL (5432) from backend pods only

---

## 🔄 High Availability Strategy

### Multi-AZ Deployment

**Availability Zones**: us-east-1a, us-east-1b, us-east-1c

<img width="576" height="235" alt="image" src="https://github.com/user-attachments/assets/61defd3f-b833-48ba-a0f2-61793b082567" />


### HA Components Summary

| Component | Strategy | RPO | RTO | Survives |
|-----------|----------|-----|-----|----------|
| **Control Plane** | 3 masters across 3 AZs | 0 | <5 min | 1 master failure |
| **etcd** | 3-node quorum, S3 backups | 1 hour | <30 min | 1 etcd member failure |
| **Worker Nodes** | 3 nodes across 3 AZs | N/A | <10 min | 1 node failure |
| **Application** | 2+ replicas with anti-affinity | N/A | <1 min | 1 AZ failure |
| **Database** | StatefulSet + PVC + EBS snapshots | 1 hour | <30 min | Pod failure |
| **Load Balancer** | AWS NLB (multi-AZ by default) | 0 | <1 min | AZ failure |
| **NAT Gateway** | 1 per AZ (3 total) | N/A | <5 min | 1 NAT failure |

### Pod Anti-Affinity Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taskapp-backend
  namespace: taskapp
spec:
  replicas: 2
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: taskapp-backend
              topologyKey: topology.kubernetes.io/zone
```

### Why This Matters:
Ensures backend pods are scheduled in different AZs
Prevents single AZ failure from taking down all replicas
Maintains service availability during AZ outages
Kubernetes scheduler respects this during normal operation and recovery
etcd High Availability

### etcd High Availability

<img width="824" height="307" alt="image" src="https://github.com/user-attachments/assets/653e6c28-0a75-4a35-8442-b44f25e670f9" />

### etcd Backup Configuration:
```
# kops cluster specification
spec:
  etcdClusters:
  - name: main
    backups:
      backupStore: s3://taskapp-kops-state-755077304796/backups/etcd/main/
```
### Backup Strategy:
- EBS Snapshots: Automated via AWS Data Lifecycle Manager (every 24 hours)
- Logical Backups: pg_dump cronjob (retained 7 days)
- Point-in-Time Recovery: Via EBS snapshots
- RPO: 1 hour (maximum data loss)
- RTO: 30 minutes (time to restore)
- Failover Testing
- Test Procedure (Documented in runbook):
- Delete one master node: kops delete instance <master-name> --yes
- Verify cluster remains operational: kops validate cluster
- Delete one worker node: kubectl delete node <node-name>
- Verify pods reschedule to remaining nodes
- Verify application remains accessible
- Expected Results:
- ✅ Cluster remains healthy
- ✅ API server responds
- ✅ Application pods reschedule within 60 seconds
- ✅ No data loss
- ✅ HTTPS endpoints remain accessible

### 🔐 Security Model
Defense in Depth Layers

<img width="505" height="693" alt="image" src="https://github.com/user-attachments/assets/4bb1c660-574f-4800-ac76-eeddd0c8ab96" />

### IAM Roles (Least Privilege)
    Master Nodes IAM Policy:
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:AttachVolume",
        "ec2:DetachVolume",
        "elasticloadbalancing:*",
        "autoscaling:Describe*",
        "route53:ListHostedZones",
        "route53:ChangeResourceRecordSets",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": "*"
    }
  ]
}
```
### Worker Nodes IAM Policy:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "s3:GetObject",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
    
   ### Key Principles:
- ✅ No root account usage
- ✅ Separate IAM roles for masters vs. nodes
- ✅ Instance profiles (no hardcoded credentials)
- ✅ No wildcard (*) actions where specific actions suffice

### SSL/TLS Configuration

<img width="823" height="345" alt="image" src="https://github.com/user-attachments/assets/5a627b56-e928-4e5d-ada2-6077e8a685d4" />

### Ingress TLS Configuration:
```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: taskapp-ingress
  namespace: taskapp
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - task-app.online
        - api.task-app.online
      secretName: taskapp-tls
  rules:
    - host: task-app.online
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
    - host: api.task-app.online
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 80
```

### Secrets Management

<img width="823" height="222" alt="image" src="https://github.com/user-attachments/assets/1ebc089c-ca28-40d3-bb26-5f8d078c7812" />

### etcd Encryption at Rest:

```
# kops cluster specification
spec:
  encryptionConfig:
    provider: aescbc
    resources:
      - secrets
```

### Network Policies (Calico)

```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: taskapp
spec:
  podSelector:
    matchLabels:
      app: taskapp-backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 80
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
```
### Security Group Rules

<img width="883" height="337" alt="image" src="https://github.com/user-attachments/assets/f07fc6f5-c4c8-4126-a1d9-5b46bcb0a724" />

### 🧩 Component Specifications

<img width="818" height="303" alt="image" src="https://github.com/user-attachments/assets/d673113c-2193-4f78-8339-42e02f54c163" />


### Application Components

<img width="903" height="170" alt="image" src="https://github.com/user-attachments/assets/786a556b-fdce-4653-8f05-bfa9720c2d28" />


### Storage Configuration

<img width="781" height="167" alt="image" src="https://github.com/user-attachments/assets/f32152c3-c19d-4f03-83a0-0f1f19b72064" />


### 🔄 Data Flow
Request Flow Example

```
1. User Request:
   Browser → https://task-app.online/login

2. DNS Resolution:
   Route53 → NLB DNS (aaff744...elb.us-east-1.amazonaws.com)

3. Load Balancing:
   NLB → NGINX Ingress Controller (port 443)

4. TLS Termination:
   Ingress decrypts HTTPS using Let's Encrypt certificate

5. Path Routing:
   /api/* → backend-service:80
   /* → frontend-service:80

6. Backend Processing:
   Flask API → SQLAlchemy ORM → PostgreSQL

7. Response:
   PostgreSQL → Flask → Ingress → TLS encrypt → Browser
```

### Database Connection Flow

```
taskapp-backend pod
    ↓ (environment variables from Secret)
DATABASE_URL=postgresql://taskapp_user:***@postgres-service:5432/taskapp_db
    ↓ (DNS resolution)
postgres-service.taskapp.svc.cluster.local:5432
    ↓ (Kubernetes Service)
postgres-0.taskapp-headless.taskapp.svc.cluster.local:5432
    ↓ (PersistentVolume)
EBS volume: vol-xxxxxxxx (encrypted gp3, us-east-1c)

```

### Architecture Decisions Log

<img width="810" height="622" alt="image" src="https://github.com/user-attachments/assets/6b7cb939-8d39-4181-a846-a5a9cbebd3cf" />

### Trade-offs Acknowledged

<img width="814" height="215" alt="image" src="https://github.com/user-attachments/assets/f599d5b7-d875-4d71-9f4f-ff36ac98719a" />

<img width="817" height="623" alt="image" src="https://github.com/user-attachments/assets/df40cced-8ee5-46a2-97eb-a1ccf626a0a4" />

<img width="644" height="181" alt="image" src="https://github.com/user-attachments/assets/c04fc5d9-73fd-4593-9079-19829d1b410d" />

- Document Version: 1.0
- Last Updated: April 2026
- Author: Olaoluwa Afolami
- Project: TaskApp Capstone - Cloud-Native Deployment


