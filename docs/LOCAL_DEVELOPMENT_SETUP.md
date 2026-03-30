# Local Development Setup Guide for TaskApp

This guide will help you run the TaskApp application locally using Docker Compose for testing before deploying to AWS.

## Prerequisites

Before starting, ensure you have the following installed on your Windows machine:

1. **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
   - Includes Docker Engine and Docker Compose
   - Requires WSL 2 (Windows Subsystem for Linux 2)
   - Allocate at least 4GB RAM to Docker

2. **Git** - Download from https://git-scm.com/download/win

3. **VS Code** (Optional but recommended) - Download from https://code.visualstudio.com/

## Step 1: Verify Docker Installation

OPEN PowerShell and run the following commands to verify Docker is installed correctly:

```powershell
docker --version
docker-compose --version
```

You should see version numbers for both commands. If not, restart Docker Desktop and try again.

## Step 2: Navigate to Project Directory

OPEN PowerShell and navigate to your project directory:

```powershell
cd "C:\Users\[YourUsername]\Documents\2026 Projects\capstone-project-novara"
```

Replace `[YourUsername]` with your actual Windows username.

## Step 3: Verify Project Structure

VERIFY that your project has the following structure:

```
capstone-project-novara/
├── docker-compose.yml
├── taskapp_backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── run.py
│   └── app/
│       ├── __init__.py
│       ├── routes.py
│       ├── models.py
│       └── auth.py
├── taskapp_frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       └── ...
└── docs/
    └── guide/
        └── (20 deployment guide files)
```

If any files are missing, the Docker build will fail.

## Step 4: Build and Start Services

In PowerShell, run the following command to build and start all services:

```powershell
docker-compose up -d
```

The `-d` flag runs services in the background (detached mode).

**What this does:**
- Builds the backend Docker image
- Builds the frontend Docker image
- Creates a PostgreSQL database container
- Starts all three services (PostgreSQL, Flask backend, React frontend)
- Creates a Docker network for service communication

**Expected output:**
```
[+] Building 45.2s (25/25) FINISHED
[+] Running 4/4
  ✔ Container taskapp-postgres    Healthy
  ✔ Container taskapp-backend     Started
  ✔ Container taskapp-frontend    Started
```

## Step 5: Verify Services Are Running

WAIT 30 seconds for all services to fully initialize, then check their status:

```powershell
docker-compose ps
```

You should see all three containers with status "Up":

```
NAME                COMMAND                  SERVICE      STATUS
taskapp-postgres    "docker-entrypoint.s…"   postgres     Up (healthy)
taskapp-backend     "gunicorn --bind 0.0…"   backend      Up
taskapp-frontend    "nginx -g daemon off…"   frontend     Up
```

## Step 6: Test Backend Health

TEST that the backend is running and the database is connected:

```powershell
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-03-27T10:30:45.123456"
}
```

If you get a connection error, wait another 10 seconds and try again. The database needs time to initialize.

## Step 7: Access the Application

OPEN your web browser and navigate to:

```
http://localhost:3000
```

You should see the TaskApp landing page.

## Step 8: Test User Registration

1. CLICK on "Sign Up" button
2. ENTER a username (e.g., `testuser`)
3. ENTER a password (e.g., `testpassword123`)
4. CLICK "Sign Up"

**Expected result:** You should be logged in and see the Kanban dashboard with empty columns (To Do, In Progress, Done).

## Step 9: Test Task Creation

1. CLICK on the "To Do" column
2. ENTER a task title (e.g., "Test Task")
3. ENTER a description (optional)
4. SELECT priority (Low, Medium, High)
5. CLICK "Create Task"

**Expected result:** The task appears in the To Do column.

## Step 10: Test Task Management

1. DRAG the task from "To Do" to "In Progress"
2. DRAG the task from "In Progress" to "Done"
3. CLICK the delete button (trash icon) on the task

**Expected result:** All operations work smoothly without errors.

## Troubleshooting

### Issue: "Port 3000 is already in use"

**Solution:** Kill the process using port 3000:

```powershell
# Find the process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the actual process ID)
taskkill /PID [PID] /F
```

Then restart Docker Compose:

```powershell
docker-compose down
docker-compose up -d
```

### Issue: "Cannot connect to Docker daemon"

**Solution:** 
1. OPEN Docker Desktop application
2. WAIT for it to fully start (you'll see the Docker icon in the system tray)
3. TRY the docker-compose command again

### Issue: "Frontend shows blank page or 'Cannot GET /'"

**Solution:**
1. CLEAR your browser cache (Ctrl+Shift+Delete)
2. REFRESH the page (Ctrl+R or F5)
3. OPEN browser developer tools (F12) and check the Console tab for errors
4. CHECK backend logs: `docker-compose logs backend`

### Issue: "Login fails with 'Unexpected token' error"

**Solution:**
1. CHECK backend logs: `docker-compose logs backend`
2. VERIFY backend is healthy: `curl http://localhost:5000/api/health`
3. RESTART services: `docker-compose restart`
4. CLEAR browser cache and try again

### Issue: "Database connection error"

**Solution:**
1. CHECK PostgreSQL logs: `docker-compose logs postgres`
2. VERIFY database is healthy: `docker-compose ps` (should show postgres as "Healthy")
3. WAIT 30 seconds for database to fully initialize
4. RESTART services: `docker-compose restart`

### Issue: "Cannot read Dockerfile"

**Solution:**
1. VERIFY you're in the correct directory: `pwd` (should show capstone-project-novara)
2. VERIFY Dockerfiles exist:
   ```powershell
   ls taskapp_backend/Dockerfile
   ls taskapp_frontend/Dockerfile
   ```
3. If files don't exist, recreate them from the repository

## Viewing Logs

To view logs from any service:

```powershell
# View all logs
docker-compose logs

# View backend logs only
docker-compose logs backend

# View frontend logs only
docker-compose logs frontend

# View PostgreSQL logs only
docker-compose logs postgres

# Follow logs in real-time (Ctrl+C to stop)
docker-compose logs -f backend
```

## Stopping Services

To stop all services:

```powershell
docker-compose down
```

This stops and removes all containers but keeps the database volume (data persists).

To stop services AND remove the database volume:

```powershell
docker-compose down -v
```

**Warning:** This deletes all data in the database. Use only if you want a fresh start.

## Restarting Services

To restart all services:

```powershell
docker-compose restart
```

To restart a specific service:

```powershell
docker-compose restart backend
docker-compose restart frontend
docker-compose restart postgres
```

## Rebuilding Services

If you make code changes, rebuild the images:

```powershell
docker-compose up -d --build
```

This rebuilds the backend and frontend images with your latest code changes.

## Database Access

To access the PostgreSQL database directly:

```powershell
docker exec -it taskapp-postgres psql -U taskapp_user -d taskapp
```

Common PostgreSQL commands:

```sql
-- List all tables
\dt

-- View users table
SELECT * FROM "user";

-- View tasks table
SELECT * FROM task;

-- Exit
\q
```

## Next Steps

Once you've verified the application works locally:

1. REVIEW the AWS deployment guide in `DEPLOYMENT_GUIDE.md`
2. FOLLOW the 20-section guide to deploy to AWS
3. TEST the deployed application on AWS
4. SUBMIT your capstone project

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Services won't start | Check Docker Desktop is running, restart it if needed |
| Port already in use | Kill the process using the port or change the port in docker-compose.yml |
| Database won't connect | Wait 30 seconds for database to initialize, check logs |
| Frontend shows blank page | Clear browser cache, refresh page, check browser console |
| Login fails | Check backend logs, verify backend health endpoint |
| Cannot build images | Verify Dockerfiles exist, check file paths are correct |

## Performance Tips

1. **Allocate enough RAM to Docker:** Go to Docker Desktop Settings → Resources → Memory (set to 4GB or more)
2. **Use SSD storage:** Docker performs better on solid-state drives
3. **Close unnecessary applications:** Free up system resources for Docker
4. **Use WSL 2 backend:** Docker Desktop on Windows should use WSL 2 for better performance

## Security Notes

**For local development only:**
- Database password is hardcoded in docker-compose.yml
- Secret key is not secure
- CORS is enabled for all origins

**Before deploying to AWS:**
- Use environment variables for sensitive data
- Generate strong secret keys
- Restrict CORS to specific domains
- Enable HTTPS/SSL
- Use AWS Secrets Manager for credentials

## Support

If you encounter issues:

1. CHECK the troubleshooting section above
2. REVIEW Docker logs: `docker-compose logs`
3. VERIFY all prerequisites are installed
4. RESTART Docker Desktop
5. REBUILD images: `docker-compose up -d --build`

Good luck with your local testing!
