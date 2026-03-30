# Quick Start Guide - TaskApp Local Development

## One-Command Start

```powershell
docker-compose up -d
```

Wait 30 seconds, then open: **http://localhost:3000**

## Essential Commands

### Start Services
```powershell
docker-compose up -d
```

### Stop Services
```powershell
docker-compose down
```

### View Status
```powershell
docker-compose ps
```

### View Logs
```powershell
docker-compose logs -f backend
```

### Rebuild After Code Changes
```powershell
docker-compose up -d --build
```

### Fresh Start (Delete Database)
```powershell
docker-compose down -v
docker-compose up -d
```

## Testing Checklist

- [ ] Backend health: `curl http://localhost:5000/api/health`
- [ ] Frontend loads: Open http://localhost:3000
- [ ] Sign up works: Create a test account
- [ ] Create task: Add a task in To Do column
- [ ] Drag task: Move task to In Progress
- [ ] Complete task: Move task to Done
- [ ] Delete task: Remove the task

## Troubleshooting Quick Fixes

| Problem | Fix |
|---------|-----|
| Services won't start | Restart Docker Desktop |
| Port already in use | `docker-compose down` then `docker-compose up -d` |
| Database error | Wait 30 seconds, check `docker-compose logs postgres` |
| Frontend blank | Clear browser cache (Ctrl+Shift+Delete), refresh (F5) |
| Login fails | Check `docker-compose logs backend` |

## File Locations

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Database:** localhost:5432 (PostgreSQL)

## Credentials

- **Database User:** taskapp_user
- **Database Password:** taskapp_password
- **Database Name:** taskapp

## Next Steps

1. ✓ Local testing complete
2. → Follow `DEPLOYMENT_GUIDE.md` for AWS deployment
3. → Use `docs/guide/` for detailed step-by-step instructions

---

**Ready to deploy? Start with `DEPLOYMENT_GUIDE.md`**
