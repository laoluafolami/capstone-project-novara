# TaskApp Capstone Project

A complete full-stack task management application with local Docker development and AWS Kubernetes deployment.

## 🚀 Quick Start

### Local Development (5 minutes)
```powershell
cd "C:\Users\YourUsername\Documents\2026 Projects\capstone-project-novara"
docker-compose up -d
# Open http://localhost:3000
```

### AWS Deployment (3-4 hours)
Follow the comprehensive guides in the `docs/` folder.

---

## 📚 Documentation

All documentation is organized in the `docs/` folder:

### Getting Started
- **[docs/START_HERE.md](docs/START_HERE.md)** - Quick 2-minute start
- **[docs/QUICK_START.md](docs/QUICK_START.md)** - Essential commands
- **[docs/STEP_BY_STEP_VISUAL.md](docs/STEP_BY_STEP_VISUAL.md)** - Visual guide with examples

### Local Development
- **[docs/LOCAL_DEVELOPMENT_SETUP.md](docs/LOCAL_DEVELOPMENT_SETUP.md)** - Complete 10-step setup
- **[docs/FIXES_APPLIED.md](docs/FIXES_APPLIED.md)** - Technical details of fixes
- **[docs/SETUP_COMPLETE.md](docs/SETUP_COMPLETE.md)** - Verification checklist
- **[docs/README_LOCAL_SETUP.md](docs/README_LOCAL_SETUP.md)** - Master overview

### AWS Deployment
- **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - AWS deployment overview
- **[docs/guide/00-overview.md](docs/guide/00-overview.md)** - Architecture & concepts
- **[docs/guide/01-prerequisites.md](docs/guide/01-prerequisites.md)** through **[docs/guide/19-final-checklist.md](docs/guide/19-final-checklist.md)** - 20 detailed step-by-step guides

### Special Topics
- **[docs/SUBDOMAIN_SETUP_GUIDE.md](docs/SUBDOMAIN_SETUP_GUIDE.md)** - Using a subdomain (e.g., taskapp.benbolpharmacy.com)
- **[docs/AWS_DEPLOYMENT_COMPATIBILITY.md](docs/AWS_DEPLOYMENT_COMPATIBILITY.md)** - Compatibility with AWS deployment
- **[docs/READY_FOR_AWS.md](docs/READY_FOR_AWS.md)** - Pre-deployment checklist

### Reference
- **[docs/INDEX.md](docs/INDEX.md)** - Complete index of all documents
- **[docs/COMPLETION_SUMMARY.md](docs/COMPLETION_SUMMARY.md)** - What was accomplished
- **[docs/FINAL_SUMMARY.txt](docs/FINAL_SUMMARY.txt)** - Quick reference summary

---

## 📁 Project Structure

```
capstone-project-novara/
├── README.md                          ← You are here
├── docker-compose.yml                 ← Local development
│
├── docs/                              ← All documentation
│   ├── START_HERE.md
│   ├── QUICK_START.md
│   ├── STEP_BY_STEP_VISUAL.md
│   ├── LOCAL_DEVELOPMENT_SETUP.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SUBDOMAIN_SETUP_GUIDE.md
│   ├── guide/                         ← 20 AWS deployment guides
│   │   ├── 00-overview.md
│   │   ├── 01-prerequisites.md
│   │   ├── ... (16 more files)
│   │   └── 19-final-checklist.md
│   └── ... (other documentation)
│
├── taskapp_backend/                   ← Flask backend
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── __init__.py
│       ├── routes.py
│       ├── models.py
│       └── auth.py
│
└── taskapp_frontend/                  ← React frontend
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        ├── contexts/
        ├── pages/
        ├── services/
        └── types/
```

---

## ✨ Features

### Local Development
- ✅ Docker Compose setup with PostgreSQL, Flask, React
- ✅ Automatic database initialization
- ✅ Health checks and networking
- ✅ Development guides and troubleshooting

### Application
- ✅ User authentication (signup/login)
- ✅ Task management (create, read, update, delete)
- ✅ Kanban board (To Do, In Progress, Done)
- ✅ Responsive React frontend
- ✅ RESTful Flask API

### AWS Deployment
- ✅ 20-section comprehensive deployment guide
- ✅ Terraform infrastructure as code
- ✅ Kubernetes cluster with Kops
- ✅ SSL/TLS with Let's Encrypt
- ✅ Node hardening with Ansible
- ✅ Cost analysis and cleanup procedures

---

## 🎯 Getting Started

### Step 1: Local Testing
1. Read: [docs/START_HERE.md](docs/START_HERE.md)
2. Run: `docker-compose up -d`
3. Test: http://localhost:3000

### Step 2: AWS Deployment
1. Read: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
2. Follow: [docs/guide/00-overview.md](docs/guide/00-overview.md) through [docs/guide/19-final-checklist.md](docs/guide/19-final-checklist.md)

### Step 3: Submission
1. Complete: All validation tests
2. Review: Final checklist
3. Submit: Your capstone project

---

## 🔧 Quick Commands

```powershell
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View status
docker-compose ps

# View logs
docker-compose logs backend

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

---

## 📋 Requirements

### Local Development
- Docker Desktop (4GB+ RAM)
- Windows 10/11 with WSL 2
- PowerShell or Command Prompt

### AWS Deployment
- AWS account with billing enabled
- Domain name (e.g., benbolpharmacy.com)
- ~$332/month for AWS resources
- 2-3 hours for complete deployment

---

## 🐛 Troubleshooting

### Docker won't start
→ Open Docker Desktop, wait 30 seconds, try again

### Port already in use
```powershell
netstat -ano | findstr :3000
taskkill /PID [PID] /F
docker-compose up -d
```

### Frontend shows blank page
→ Clear browser cache (Ctrl+Shift+Delete), refresh (F5)

### Need more help?
→ Read [docs/LOCAL_DEVELOPMENT_SETUP.md](docs/LOCAL_DEVELOPMENT_SETUP.md) troubleshooting section

---

## 📚 Documentation Index

| Document | Purpose | Time |
|----------|---------|------|
| [docs/START_HERE.md](docs/START_HERE.md) | Quick start | 2 min |
| [docs/QUICK_START.md](docs/QUICK_START.md) | Essential commands | 2 min |
| [docs/STEP_BY_STEP_VISUAL.md](docs/STEP_BY_STEP_VISUAL.md) | Visual guide | 5 min |
| [docs/LOCAL_DEVELOPMENT_SETUP.md](docs/LOCAL_DEVELOPMENT_SETUP.md) | Detailed setup | 10 min |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | AWS overview | 5 min |
| [docs/guide/00-overview.md](docs/guide/00-overview.md) | Architecture | 10 min |
| [docs/guide/01-prerequisites.md](docs/guide/01-prerequisites.md) through [docs/guide/19-final-checklist.md](docs/guide/19-final-checklist.md) | AWS deployment | 3-4 hours |
| [docs/SUBDOMAIN_SETUP_GUIDE.md](docs/SUBDOMAIN_SETUP_GUIDE.md) | Subdomain setup | 5 min |
| [docs/INDEX.md](docs/INDEX.md) | Complete index | 5 min |

---

## ✅ Status

- ✅ Local development environment: Ready
- ✅ All features tested and working
- ✅ AWS deployment guide: Complete (20 sections)
- ✅ Documentation: Comprehensive
- ✅ Ready for deployment

---

## 🎓 Learning Outcomes

By completing this project, you will learn:
- Docker containerization and Docker Compose
- AWS account setup and IAM
- Terraform infrastructure as code
- Kubernetes cluster management
- Kops for Kubernetes operations
- SSL/TLS with Let's Encrypt
- Ansible for infrastructure automation
- Production deployment best practices

---

## 📞 Support

### For Local Development Issues
- Check: [docs/LOCAL_DEVELOPMENT_SETUP.md](docs/LOCAL_DEVELOPMENT_SETUP.md) troubleshooting
- Read: [docs/FIXES_APPLIED.md](docs/FIXES_APPLIED.md)

### For AWS Deployment Issues
- Check: Specific guide section (e.g., [docs/guide/09-kops-cluster.md](docs/guide/09-kops-cluster.md))
- Read: [docs/guide/16-validation.md](docs/guide/16-validation.md)

### For General Questions
- Docker: https://docs.docker.com/
- AWS: https://docs.aws.amazon.com/
- Kubernetes: https://kubernetes.io/docs/
- Terraform: https://www.terraform.io/docs/

---

## 🚀 Ready to Start?

**Choose your path:**

### 👤 First Time?
→ Read [docs/START_HERE.md](docs/START_HERE.md) (2 minutes)

### 🔧 Want Detailed Setup?
→ Read [docs/LOCAL_DEVELOPMENT_SETUP.md](docs/LOCAL_DEVELOPMENT_SETUP.md) (10 minutes)

### ☁️ Ready for AWS?
→ Read [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) (5 minutes)

### 📖 Want Complete Overview?
→ Read [docs/INDEX.md](docs/INDEX.md) (5 minutes)

---

**Good luck with your capstone project! 🚀**

*Last Updated: March 27, 2026*  
*Status: ✅ Complete and Ready*
