
### Cost-analysis

# TaskApp - Cost Analysis

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