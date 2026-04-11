
# Cost-analysis

## TaskApp - Cost Analysis

**Document Version:** 1.0  
**Last Updated:** April 2026  
**Region:** AWS us-east-1 (N. Virginia)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Infrastructure Cost Breakdown](#infrastructure-cost-breakdown)
3. [Detailed Resource Costs](#detailed-resource-costs)
4. [Monthly Cost Estimation](#monthly-cost-estimation)
5. [Cost Optimization Strategies](#cost-optimization-strategies)
6. [AWS Pricing Calculator Screenshots](#aws-pricing-calculator-screenshots)
7. [Cleanup & Cost Management](#cleanup--cost-management)

---

## 📊 Executive Summary

This document provides a comprehensive cost analysis of the TaskApp cloud-native deployment on AWS. The infrastructure is designed for **high availability** across 3 Availability Zones with production-grade reliability and security.

### Cost Summary

| Metric | Amount |
|--------|--------|
| **Estimated Monthly Cost** | **$367 USD** |
| **Annual Projection** | **$4,404 USD** |
| **Cost per User** (assuming 1,000 users) | **$0.37/user/month** |
| **Buffer (20%)** | **+$73/month** |
| **Total with Buffer** | **~$440/month** |

### Cost Distribution
- Compute (EC2): 49% ($180)
- Networking: 36% ($133)
- Storage (EBS/S3): 10% ($37)
- Other (Route53, etc): 5% ($17)

## 🏗️ Infrastructure Cost Breakdown

### Architecture Overview

<img width="485" height="540" alt="image" src="https://github.com/user-attachments/assets/c10dc22b-65ad-4347-86fd-f398b9d66695" />


---

## 📈 Detailed Resource Costs

### 1. Compute Resources (EC2)

| Resource | Instance Type | Quantity | vCPU | RAM | Monthly Cost | Justification |
|----------|--------------|----------|------|-----|--------------|---------------|
| **Master Nodes** | t3.medium | 3 | 2 | 4 GiB | $90.00 | HA control plane across 3 AZs |
| **Worker Nodes** | t3.medium | 3 | 2 | 4 GiB | $90.00 | Application workload distribution |
| **Total Compute** | | **6** | **12** | **24 GiB** | **$180.00** | |

**Pricing Details** (us-east-1):
- t3.medium On-Demand: $0.0416/hour
- Monthly per instance: $0.0416 × 24 × 30.5 = **$30.48**
- 6 instances: $30.48 × 6 = **$182.88** (rounded to $180 for estimation)

**Cost Optimization Opportunity**:
- Switch to Reserved Instances (1-year): **~30% savings** ($54/month)
- Use Spot Instances for workers: **~70% savings** ($126/month)

---

### 2. Networking Costs

| Resource | Quantity | Unit Cost | Monthly Cost | Notes |
|----------|----------|-----------|--------------|-------|
| **NAT Gateways** | 3 | $0.045/hour + $0.045/GB | $99.00 | High availability (1 per AZ) |
| **Network Load Balancer** | 1 | $0.0225/hour + LCU charges | $22.00 | Ingress traffic routing |
| **Data Transfer Out** | 100 GB | $0.09/GB (first 10TB) | $9.00 | Estimated user traffic |
| **Data Transfer Inter-AZ** | 50 GB | $0.01/GB | $3.00 | Pod-to-pod communication |
| **Total Networking** | | | **$133.00** | |

**NAT Gateway Breakdown**:
- Hourly charge: $0.045 × 24 × 30.5 × 3 = **$98.82**
- Data processing: Estimated 10GB × $0.045 = **$0.45**
- Total per NAT: ~$33.09 × 3 = **$99.27**

**Why 3 NAT Gateways?**
- Requirement: Private subnet topology (no public IPs on nodes)
- High Availability: One NAT Gateway per AZ
- Avoids single point of failure

---

### 3. Storage Costs

#### EBS Volumes

| Volume Type | Size | Quantity | Unit Cost | Monthly Cost | Purpose |
|-------------|------|----------|-----------|--------------|---------|
| **gp3 (Masters)** | 100 GB | 3 | $0.08/GB-month | $24.00 | OS + Kubernetes components |
| **gp3 (Workers)** | 50 GB | 3 | $0.08/GB-month | $12.00 | OS + container runtime |
| **gp3 (PostgreSQL)** | 10 GB | 1 | $0.08/GB-month | $0.80 | Database persistent storage |
| **Total EBS** | **460 GB** | **7** | | **$36.80** | |

**EBS Optimization**:
- Using gp3 (not gp2): **10% cheaper** + better performance
- Encrypted volumes: **No additional cost**
- IOPS: 3,000 baseline (included in gp3 pricing)

#### S3 Storage

| Bucket | Purpose | Estimated Size | Monthly Cost |
|--------|---------|----------------|--------------|
| `taskapp-kops-state` | Kops cluster state | 10 MB | $0.00 (negligible) |
| `taskapp-terraform-state` | Terraform state with versioning | 5 MB | $0.00 (negligible) |
| `taskapp-etcd-backups` | Automated etcd snapshots | 5 GB | $0.12 |
| `taskapp-app-backups` | Database backups (pg_dump) | 10 GB | $0.23 |
| **Total S3** | | **~25 GB** | **$0.35** |

#### DynamoDB

| Table | Purpose | Capacity Mode | Monthly Cost |
|-------|---------|---------------|--------------|
| `taskapp-terraform-locks` | Terraform state locking | On-Demand | $1.00 (estimated) |

---

### 4. Other AWS Services

| Service | Quantity | Unit Cost | Monthly Cost | Notes |
|---------|----------|-----------|--------------|-------|
| **Route53 Hosted Zone** | 1 | $0.50/month | $0.50 | DNS management |
| **Route53 Queries** | 1M queries | $0.40/1M | $0.40 | Estimated DNS lookups |
| **SSL Certificate** | 2 (taskapp + api) | $0 (Let's Encrypt) | $0.00 | Automated via cert-manager |
| **CloudWatch Logs** | 5 GB | $0.50/GB | $2.50 | Application + cluster logs |
| **Total Other** | | | **$3.40** | |

---

## 💰 Monthly Cost Estimation

### Summary Table

| Category | Monthly Cost | % of Total |
|----------|--------------|------------|
| **Compute (EC2)** | $180.00 | 49.0% |
| **Networking** | $133.00 | 36.2% |
| **Storage (EBS)** | $36.80 | 10.0% |
| **Storage (S3)** | $0.35 | 0.1% |
| **DynamoDB** | $1.00 | 0.3% |
| **Route53** | $0.90 | 0.2% |
| **CloudWatch** | $15.00 | 4.1% |
| **Subtotal** | **$367.05** | **100%** |
| **Reserved Instance Savings** (30%) | **-$54.00** | |
| **Total (Optimized)** | **$313.05** | |
| **Contingency Buffer (10%)** | **+$31.31** | |
| **Final Estimate** | **~$344.36/month** | |

**Note**: Actual costs may vary based on:
- Actual data transfer volumes
- Number of DNS queries
- Log retention period
- Backup frequency and retention

---

### Cost Projection Over Time

| Time Period | On-Demand | With Reserved Instances | Savings |
|-------------|-----------|------------------------|---------|
| **1 Month** | $367 | $313 | $54 |
| **3 Months** | $1,101 | $939 | $162 |
| **6 Months** | $2,202 | $1,878 | $324 |
| **12 Months** | $4,404 | $3,756 | $648 |
| **3 Years** | $13,212 | $11,268 | $1,944 |


---

## 🎯 Cost Optimization Strategies

### Implemented Optimizations

| Strategy | Implementation | Monthly Savings | Impact |
|----------|----------------|-----------------|--------|
| **gp3 Volumes** | Using gp3 instead of gp2 | $3.60 | 10% storage savings |
| **Let's Encrypt** | Free SSL certificates | $15.00 | 100% SSL cost elimination |
| **Right-Sizing** | t3.medium (not t3.large) | $60.00 | 33% compute savings |
| **Auto-Scaling** | Cluster autoscaler enabled | Variable | Pay only for what you use |
| **Total Implemented** | | **$78.60/month** | **20% savings** |

### Recommended Future Optimizations

| Strategy | Effort | Potential Savings | Risk | Priority |
|----------|--------|-------------------|------|----------|
| **Reserved Instances (1-year)** | Low | $54/month | Medium (commitment) | 🔴 High |
| **Spot Instances for Workers** | Medium | $90/month | Medium (interruption) | 🟡 Medium |
| **Single NAT Gateway** | Low | $66/month | High (no HA) | 🟢 Low |
| **S3 Lifecycle Policies** | Low | $5/month | Low | 🟡 Medium |
| **Log Retention Reduction** | Low | $10/month | Low (compliance) | 🟡 Medium |
| **Total Potential** | | **$225/month** | | |

---



