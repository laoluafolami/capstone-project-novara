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
