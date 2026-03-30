# Step-by-Step Visual Guide - Local Development

## 🎯 Goal
Get the TaskApp running locally in 5 minutes

## ⏱️ Timeline
- **Step 1-2:** 1 minute (open PowerShell)
- **Step 3:** 45 seconds (start services)
- **Step 4:** 30 seconds (wait for startup)
- **Step 5:** 1 minute (test application)
- **Total:** ~5 minutes

---

## Step 1: Open PowerShell

### What to do:
1. PRESS `Windows Key + R`
2. TYPE `powershell`
3. PRESS `Enter`

### What you should see:
```
Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\Users\YourUsername>
```

---

## Step 2: Navigate to Project Directory

### What to do:
COPY and PASTE this command (replace `YourUsername` with your actual username):

```powershell
cd "C:\Users\YourUsername\Documents\2026 Projects\capstone-project-novara"
```

### What you should see:
```
PS C:\Users\YourUsername\Documents\2026 Projects\capstone-project-novara>
```

### Verify you're in the right place:
TYPE: `ls`

You should see:
```
    Directory: C:\Users\YourUsername\Documents\2026 Projects\capstone-project-novara

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         3/27/2026   9:00 AM                docs
d-----         3/27/2026   9:00 AM                taskapp_backend
d-----         3/27/2026   9:00 AM                taskapp_frontend
-a----         3/27/2026   9:00 AM          1234 docker-compose.yml
-a----         3/27/2026   9:00 AM          5678 DEPLOYMENT_GUIDE.md
```

---

## Step 3: Start the Application

### What to do:
COPY and PASTE this command:

```powershell
docker-compose up -d
```

### What you should see:
```
[+] Building 45.2s (25/25) FINISHED
[+] Running 4/4
  ✔ Container taskapp-postgres    Healthy
  ✔ Container taskapp-backend     Started
  ✔ Container taskapp-frontend    Started
```

### If you see an error:
- **"Cannot connect to Docker daemon"** → Open Docker Desktop and wait 30 seconds
- **"Port already in use"** → See troubleshooting section below
- **"Cannot find Dockerfile"** → Verify you're in the correct directory

---

## Step 4: Wait for Services to Start

### What to do:
WAIT 30 seconds for all services to fully initialize

### What's happening:
- PostgreSQL database is starting
- Flask backend is connecting to database
- React frontend is being served by Nginx
- Health checks are running

### Monitor progress:
TYPE: `docker-compose ps`

You should see:
```
NAME                COMMAND                  SERVICE      STATUS
taskapp-postgres    "docker-entrypoint.s…"   postgres     Up (healthy)
taskapp-backend     "gunicorn --bind 0.0…"   backend      Up
taskapp-frontend    "nginx -g daemon off…"   frontend     Up
```

---

## Step 5: Test Backend Health

### What to do:
TYPE: `curl http://localhost:5000/api/health`

### What you should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-03-27T10:30:45.123456"
}
```

### If you see an error:
- WAIT another 10 seconds
- TRY the command again
- CHECK logs: `docker-compose logs backend`

---

## Step 6: Open Application in Browser

### What to do:
1. OPEN your web browser (Chrome, Edge, Firefox)
2. NAVIGATE to: `http://localhost:3000`

### What you should see:
```
┌─────────────────────────────────────────┐
│         TaskApp - Task Manager          │
│                                         │
│  Welcome to TaskApp                     │
│  Organize your tasks efficiently        │
│                                         │
│  [Sign Up]  [Log In]                    │
└─────────────────────────────────────────┘
```

---

## Step 7: Create Test Account

### What to do:
1. CLICK on "Sign Up" button
2. ENTER username: `testuser`
3. ENTER password: `testpassword123`
4. CLICK "Sign Up" button

### What you should see:
```
┌─────────────────────────────────────────┐
│         TaskApp - Dashboard             │
│                                         │
│  Welcome, testuser!                     │
│                                         │
│  ┌──────────┬──────────┬──────────┐    │
│  │  To Do   │ In Prog  │   Done   │    │
│  │          │          │          │    │
│  │ [+ Add]  │ [+ Add]  │ [+ Add]  │    │
│  └──────────┴──────────┴──────────┘    │
└─────────────────────────────────────────┘
```

---

## Step 8: Create a Task

### What to do:
1. CLICK on "[+ Add]" button in the "To Do" column
2. ENTER task title: `Test Task`
3. ENTER description: `This is a test task`
4. SELECT priority: `Medium`
5. CLICK "Create Task" button

### What you should see:
```
┌──────────────────────────────────────────┐
│  To Do                                   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ Test Task                          │  │
│  │ This is a test task                │  │
│  │ Priority: Medium                   │  │
│  │ [Edit] [Delete]                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  [+ Add Task]                            │
└──────────────────────────────────────────┘
```

---

## Step 9: Move Task Between Columns

### What to do:
1. DRAG the "Test Task" card from "To Do" column
2. DROP it in the "In Progress" column

### What you should see:
```
┌──────────────┬──────────────┬──────────────┐
│  To Do       │ In Progress  │   Done       │
│              │              │              │
│ [+ Add]      │ ┌──────────┐ │ [+ Add]      │
│              │ │Test Task │ │              │
│              │ │[Edit][X] │ │              │
│              │ └──────────┘ │              │
│              │ [+ Add]      │              │
└──────────────┴──────────────┴──────────────┘
```

---

## Step 10: Complete Task

### What to do:
1. DRAG the "Test Task" card from "In Progress" column
2. DROP it in the "Done" column

### What you should see:
```
┌──────────────┬──────────────┬──────────────┐
│  To Do       │ In Progress  │   Done       │
│              │              │              │
│ [+ Add]      │ [+ Add]      │ ┌──────────┐ │
│              │              │ │Test Task │ │
│              │              │ │[Edit][X] │ │
│              │              │ └──────────┘ │
│              │              │ [+ Add]      │
└──────────────┴──────────────┴──────────────┘
```

---

## Step 11: Delete Task

### What to do:
1. CLICK on the "[X]" (delete) button on the task card

### What you should see:
```
┌──────────────┬──────────────┬──────────────┐
│  To Do       │ In Progress  │   Done       │
│              │              │              │
│ [+ Add]      │ [+ Add]      │ [+ Add]      │
│              │              │              │
└──────────────┴──────────────┴──────────────┘
```

---

## ✅ Success!

If you've completed all steps, your application is working correctly!

### What this means:
✓ Docker is working  
✓ PostgreSQL database is running  
✓ Flask backend is responding  
✓ React frontend is loading  
✓ Frontend-backend communication works  
✓ Database operations work  

---

## 🛑 Troubleshooting

### Problem: "Cannot connect to Docker daemon"

**Solution:**
1. OPEN Docker Desktop application
2. WAIT for it to fully start (look for Docker icon in system tray)
3. WAIT 30 seconds
4. TRY the command again: `docker-compose up -d`

---

### Problem: "Port 3000 is already in use"

**Solution:**
1. FIND the process using port 3000:
   ```powershell
   netstat -ano | findstr :3000
   ```

2. COPY the PID (Process ID) from the output

3. KILL the process (replace `[PID]` with the actual number):
   ```powershell
   taskkill /PID [PID] /F
   ```

4. RESTART services:
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

---

### Problem: "Frontend shows blank page"

**Solution:**
1. PRESS `Ctrl+Shift+Delete` to open browser cache settings
2. SELECT "All time" for time range
3. CHECK "Cookies and other site data"
4. CLICK "Clear data"
5. REFRESH the page: `F5`

---

### Problem: "Login fails with error"

**Solution:**
1. CHECK backend logs:
   ```powershell
   docker-compose logs backend
   ```

2. LOOK for error messages

3. RESTART backend:
   ```powershell
   docker-compose restart backend
   ```

4. WAIT 10 seconds

5. TRY logging in again

---

### Problem: "Database connection error"

**Solution:**
1. CHECK database logs:
   ```powershell
   docker-compose logs postgres
   ```

2. WAIT 30 seconds for database to initialize

3. RESTART all services:
   ```powershell
   docker-compose restart
   ```

4. WAIT 30 seconds

5. TRY again

---

## 📊 Monitoring Commands

### Check all services
```powershell
docker-compose ps
```

### View logs
```powershell
docker-compose logs
```

### View specific service logs
```powershell
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Follow logs in real-time
```powershell
docker-compose logs -f backend
```

### Stop services
```powershell
docker-compose down
```

### Restart services
```powershell
docker-compose restart
```

### Rebuild and restart
```powershell
docker-compose up -d --build
```

---

## 🎯 Next Steps

### After Local Testing Works:
1. READ: `DEPLOYMENT_GUIDE.md`
2. FOLLOW: `docs/guide/00-overview.md` through `docs/guide/19-final-checklist.md`
3. DEPLOY: Your application to AWS

### Quick Reference:
- **Quick commands:** `QUICK_START.md`
- **Detailed setup:** `LOCAL_DEVELOPMENT_SETUP.md`
- **Technical details:** `FIXES_APPLIED.md`
- **AWS deployment:** `DEPLOYMENT_GUIDE.md`

---

## ✨ Summary

You've successfully:
✓ Started Docker services  
✓ Initialized the database  
✓ Accessed the application  
✓ Created a test account  
✓ Created a task  
✓ Moved tasks between columns  
✓ Deleted a task  

**Your local development environment is working perfectly!**

---

**Ready for AWS deployment? Open `DEPLOYMENT_GUIDE.md`**

*Last Updated: March 27, 2026*
