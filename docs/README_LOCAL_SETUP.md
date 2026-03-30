# TaskApp Capstone Project - Local Development & AWS Deployment

## 📋 Overview

This repository contains a complete TaskApp capstone project with:
- **Local Development Setup** - Run the app locally with Docker Compose
- **AWS Deployment Guide** - 20-section step-by-step guide for AWS deployment
- **Comprehensive Documentation** - Everything explained for beginners

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Docker Desktop installed
- Windows with PowerShell

### Start the Application
```powershell
cd "C:\Users\[YourUsername]\Documents\2026 Projects\capstone-project-novara"
docker-compose up -d
```

### Access the Application
Open your browser: **http://localhost:3000**

### Test It
1. Sign up with a test account
2. Create a task
3. Drag tasks between columns
4. Delete a task

**Done!** The application is running locally.

## 📚 Documentation Guide

### For Local Development

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **QUICK_START.md** | Essential commands and quick reference | 2 min |
| **LOCAL_DEVELOPMENT_SETUP.md** | Detailed 10-step setup guide | 10 min |
| **FIXES_APPLIED.md** | Technical details of all fixes | 5 min |
| **SETUP_COMPLETE.md** | Verification and next steps | 5 min |

### For AWS Deployment

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **DEPLOYMENT_GUIDE.md** | Overview and table of contents | 5 min |
| **docs/guide/00-overview.md** | Architecture and concepts | 10 min |
| **docs/guide/01-prerequisites.md** | Tool installation | 15 min |
| **docs/guide/02-aws-iam-setup.md** | AWS account setup | 10 min |
| **docs/guide/03-domain-dns.md** | Domain registration | 10 min |
| **docs/guide/04-docker-ecr.md** | Docker and ECR setup | 15 min |
| **docs/guide/05-terraform-bootstrap.md** | Terraform state setup | 10 min |
| **docs/guide/06-terraform-vpc.md** | VPC creation | 15 min |
| **docs/guide/07-terraform-iam-dns.md** | IAM and DNS setup | 10 min |
| **docs/guide/08-terraform-apply.md** | Terraform execution | 10 min |
| **docs/guide/09-kops-cluster.md** | Kubernetes cluster | 20 min |
| **docs/guide/10-k8s-addons.md** | Kubernetes add-ons | 15 min |
| **docs/guide/11-sealed-secrets-postgres.md** | Database setup | 15 min |
| **docs/guide/12-backend-deployment.md** | Backend deployment | 10 min |
| **docs/guide/13-frontend-deployment.md** | Frontend deployment | 10 min |
| **docs/guide/14-ingress-ssl.md** | SSL/TLS setup | 10 min |
| **docs/guide/15-ansible.md** | Node hardening | 10 min |
| **docs/guide/16-validation.md** | Testing and validation | 15 min |
| **docs/guide/17-cost-cleanup.md** | Cost analysis and cleanup | 10 min |
| **docs/guide/18-documentation.md** | Documentation | 10 min |
| **docs/guide/19-final-checklist.md** | Final submission | 10 min |

## 🎯 Recommended Reading Order

### Phase 1: Local Testing (Today)
1. Read: **QUICK_START.md** (2 min)
2. Read: **LOCAL_DEVELOPMENT_SETUP.md** (10 min)
3. Run: `docker-compose up -d`
4. Test: http://localhost:3000
5. Read: **SETUP_COMPLETE.md** (5 min)

### Phase 2: AWS Deployment (Next)
1. Read: **DEPLOYMENT_GUIDE.md** (5 min)
2. Read: **docs/guide/00-overview.md** (10 min)
3. Follow: **docs/guide/01-prerequisites.md** through **docs/guide/19-final-checklist.md**

### Phase 3: Submission
1. Review: **docs/guide/16-validation.md**
2. Complete: **docs/guide/19-final-checklist.md**
3. Submit: Your capstone project

## 📁 Project Structure

```
capstone-project-novara/
│
├── 📄 README_LOCAL_SETUP.md          ← You are here
├── 📄 QUICK_START.md                 ← Start here for quick reference
├── 📄 LOCAL_DEVELOPMENT_SETUP.md     ← Detailed local setup
├── 📄 FIXES_APPLIED.md               ← Technical details
├── 📄 SETUP_COMPLETE.md              ← Verification checklist
├── 📄 DEPLOYMENT_GUIDE.md            ← AWS deployment overview
│
├── 📁 docs/guide/                    ← 20-section AWS deployment guide
│   ├── 00-overview.md
│   ├── 01-prerequisites.md
│   ├── 02-aws-iam-setup.md
│   ├── ... (16 more files)
│   └── 19-final-checklist.md
│
├── 📁 taskapp_backend/               ← Flask backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── __init__.py
│       ├── routes.py
│       ├── models.py
│       └── auth.py
│
├── 📁 taskapp_frontend/              ← React frontend
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       ├── contexts/
│       ├── pages/
│       ├── services/
│       └── types/
│
└── 📄 docker-compose.yml             ← Local development setup
```

## ✅ What's Included

### Local Development
- ✓ Docker Compose configuration
- ✓ PostgreSQL database
- ✓ Flask backend with API
- ✓ React frontend with Kanban board
- ✓ Health checks and networking
- ✓ Database initialization

### AWS Deployment
- ✓ AWS IAM setup
- ✓ Domain and DNS configuration
- ✓ Docker and ECR setup
- ✓ Terraform infrastructure as code
- ✓ Kubernetes cluster with Kops
- ✓ Backend and frontend deployment
- ✓ SSL/TLS with Let's Encrypt
- ✓ Node hardening with Ansible
- ✓ Cost analysis and cleanup

### Documentation
- ✓ Step-by-step guides
- ✓ Troubleshooting sections
- ✓ Command references
- ✓ Architecture diagrams
- ✓ Validation checklists

## 🔧 System Requirements

### For Local Development
- Windows 10/11 with WSL 2
- Docker Desktop (4GB+ RAM)
- 10GB free disk space
- PowerShell or Command Prompt

### For AWS Deployment
- AWS account with billing enabled
- Domain name (Route53 or external)
- ~$332/month for AWS resources
- 2-3 hours for complete deployment

## 🐛 Common Issues & Solutions

### Docker won't start
```powershell
# Restart Docker Desktop
# Then run:
docker-compose up -d
```

### Port already in use
```powershell
# Kill the process using the port
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### Database connection error
```powershell
# Wait 30 seconds for database to initialize
# Then check logs:
docker-compose logs postgres
```

### Frontend shows blank page
```powershell
# Clear browser cache (Ctrl+Shift+Delete)
# Refresh page (F5)
# Check browser console (F12)
```

## 📊 Architecture

### Local Development
```
Browser (localhost:3000)
    ↓
Nginx (Frontend)
    ↓
React App
    ↓
API Calls (localhost:5000/api)
    ↓
Flask Backend
    ↓
PostgreSQL Database
```

### AWS Deployment
```
Internet Users
    ↓
Route53 (DNS)
    ↓
AWS Load Balancer
    ↓
NGINX Ingress Controller
    ↓
Kubernetes Cluster (3 Masters, 3 Workers)
    ├── Backend Pods (Flask)
    ├── Frontend Pods (React)
    └── PostgreSQL StatefulSet
```

## 🔐 Security

### Local Development
- Hardcoded credentials (for development only)
- No HTTPS
- CORS open to all origins

### AWS Deployment
- AWS Secrets Manager for credentials
- HTTPS/SSL with Let's Encrypt
- CORS restricted to specific domains
- Node hardening with Ansible
- Database encryption
- Network security groups

## 💰 Cost Estimation

### AWS Monthly Cost
- EC2 instances: ~$200
- Load balancer: ~$50
- Data transfer: ~$50
- Storage: ~$32
- **Total: ~$332/month**

See `docs/guide/17-cost-cleanup.md` for detailed breakdown.

## 📞 Support

### For Local Development Issues
1. Check **QUICK_START.md** troubleshooting section
2. Review **LOCAL_DEVELOPMENT_SETUP.md** step-by-step
3. Check Docker logs: `docker-compose logs`

### For AWS Deployment Issues
1. Check the specific guide section (e.g., `docs/guide/09-kops-cluster.md`)
2. Review **docs/guide/16-validation.md** for testing
3. Check AWS console for errors

### For General Questions
- Docker: https://docs.docker.com/
- AWS: https://docs.aws.amazon.com/
- Kubernetes: https://kubernetes.io/docs/
- Terraform: https://www.terraform.io/docs/

## 🎓 Learning Objectives

By completing this capstone project, you will learn:

✓ Docker containerization  
✓ Docker Compose for multi-container apps  
✓ AWS account setup and IAM  
✓ Terraform infrastructure as code  
✓ Kubernetes cluster management  
✓ Kops for Kubernetes operations  
✓ Helm for package management  
✓ SSL/TLS with Let's Encrypt  
✓ Ansible for infrastructure automation  
✓ CI/CD concepts  
✓ Cloud cost management  
✓ Production deployment best practices  

## 📋 Submission Checklist

Before submitting your capstone project:

- [ ] Local application runs without errors
- [ ] All features work (create, read, update, delete tasks)
- [ ] AWS deployment is complete
- [ ] Application is accessible via domain name
- [ ] SSL/TLS certificate is valid
- [ ] All validation tests pass
- [ ] Documentation is complete
- [ ] Cost analysis is documented
- [ ] Cleanup script is tested

See `docs/guide/19-final-checklist.md` for complete checklist.

## 🚀 Next Steps

### Right Now
1. Open **QUICK_START.md**
2. Run `docker-compose up -d`
3. Test at http://localhost:3000

### After Local Testing
1. Open **DEPLOYMENT_GUIDE.md**
2. Follow `docs/guide/00-overview.md` through `docs/guide/19-final-checklist.md`
3. Deploy to AWS

### Before Submission
1. Complete all validation tests
2. Review final checklist
3. Submit your project

## 📝 Notes

- All guides are written for beginners
- Every step includes detailed explanations
- Commands are provided for copy-paste
- Troubleshooting sections included
- No prior AWS/Kubernetes experience required

## ✨ Key Features

- **Complete Documentation** - 20 detailed guides
- **Local Testing** - Test before deploying
- **Production Ready** - Enterprise-grade setup
- **Cost Optimized** - ~$332/month
- **Beginner Friendly** - Explained for everyone
- **Fully Automated** - Terraform and Ansible scripts
- **Secure** - SSL/TLS, secrets management, hardening

## 📄 License

This capstone project is provided as-is for educational purposes.

---

## 🎯 Start Here

**Choose your path:**

### 👤 First Time?
→ Read **QUICK_START.md** (2 minutes)

### 🔧 Want Detailed Setup?
→ Read **LOCAL_DEVELOPMENT_SETUP.md** (10 minutes)

### ☁️ Ready for AWS?
→ Read **DEPLOYMENT_GUIDE.md** (5 minutes)

### 🐛 Troubleshooting?
→ Check **FIXES_APPLIED.md** (5 minutes)

---

**Good luck with your capstone project! 🚀**

*Last Updated: March 27, 2026*  
*Status: ✓ Complete and Ready*
