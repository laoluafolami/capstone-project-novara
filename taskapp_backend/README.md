# Team Task Manager – Backend API

A Flask-based REST API that powers the Team Task Manager (TeamFlow) application.

This backend provides:

- JWT-based authentication
- Secure task CRUD operations
- PostgreSQL persistence via SQLAlchemy
- CORS-enabled API access for frontend clients
- Production-style application factory pattern

It is designed to be consumed by a modern frontend (React/Vite) and deployed in real-world DevOps environments.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Authentication & Authorization](#authentication--authorization)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Database Initialization & Seeding](#database-initialization--seeding)
- [Running the Application](#running-the-application)
- [Security Considerations](#security-considerations)
- [Assumptions](#assumptions)
- [Future Improvements](#future-improvements)

## Overview

The Team Task Manager Backend is a RESTful API built with Flask that handles:

- User authentication (signup & login)
- JWT token generation and verification
- Task creation, retrieval, updating, and deletion
- Database persistence using PostgreSQL

All task endpoints are protected and require a valid JWT token.

## Features

### Authentication
- User signup
- User login
- JWT token issuance
- Token validation via request middleware
- Password hashing with Werkzeug

### Task Management
- Create tasks
- Retrieve all tasks
- Update tasks
- Delete tasks
- Task attributes:
  - Title
  - Description
  - Priority (low, medium, high)
  - Status (todo, in_progress, done)

### Backend Capabilities
- Flask application factory pattern
- SQLAlchemy ORM
- Automatic database table creation
- Default user seeding
- CORS enabled for frontend integration

## Tech Stack

### Backend
- Python 3
- Flask
- Flask-SQLAlchemy
- Flask-CORS
- PyJWT
- PostgreSQL

### Supporting Libraries
- psycopg2-binary
- python-dotenv
- werkzeug.security

## Architecture Overview

The backend follows a clean, modular structure:

```
Request
  ↓
Flask Routes (Blueprint)
  ↓
Auth Middleware (JWT validation)
  ↓
Service / Model Logic
  ↓
SQLAlchemy ORM
  ↓
PostgreSQL Database
```

**Key Design Choices**
- Blueprint-based routing (`/api`)
- Decorator-based authentication
- Centralized app creation
- Environment-driven configuration

## Authentication & Authorization

### JWT Authentication
- Tokens are generated using HS256
- Tokens contain:
  - `user_id`
  - `username`
- Tokens are passed via the Authorization header

**Example:**
```
Authorization: Bearer <JWT_TOKEN>
```

### Token Enforcement
Protected routes use a decorator: `@token_required`

If the token is:
- Missing → 401 Unauthorized
- Invalid → 401 Unauthorized
- Malformed → 401 Unauthorized

## API Endpoints

### Authentication

**POST** `/api/auth/signup`  
Creates a new user and returns a JWT token.

**Request Body**
```json
{
  "username": "example",
  "password": "password123"
}
```

**POST** `/api/auth/login`  
Authenticates a user and returns a JWT token.

### Tasks (Protected)
All task endpoints require authentication.

**GET** `/api/tasks`  
Returns all tasks (ordered by creation date).

**POST** `/api/tasks`  
Creates a new task.

**Request Body**
```json
{
  "title": "My Task",
  "description": "Optional description",
  "priority": "medium",
  "status": "todo"
}
```

**PUT** `/api/tasks/<id>`  
Updates an existing task.

**DELETE** `/api/tasks/<id>`  
Deletes a task.

## Database Models

### User Model
- id
- username (unique)
- password_hash
- created_at

### Task Model
- id
- title
- description
- priority
- status
- created_at
- updated_at

SQLAlchemy automatically maps models to PostgreSQL tables.

## Environment Variables

Create a `.env` file (not committed):

```env
DATABASE_URL=postgresql://taskapp_user:taskapp_password@localhost:5432/taskapp
SECRET_KEY=change-this-in-production
PORT=5000
```

**Important Notes**
- `SECRET_KEY` must be changed in production
- `DATABASE_URL` should point to PostgreSQL
- Defaults are provided for local development

## Local Development Setup

### Prerequisites
- Python 3.10+
- PostgreSQL
- pip or virtualenv

### Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

## Database Initialization & Seeding

On application startup:
- Tables are created automatically using `db.create_all()`
- Default users are seeded only if no users exist

### Default Users

| Username | Password  |
|----------|-----------|
| admin    | admin123  |
| user     | user123   |

This is intended for development and demo purposes only.

## Running the Application

Start the Server
```bash
python run.py
```

The API will be available at:  
http://localhost:5000/api

## Security Considerations

- Passwords are hashed using Werkzeug
- JWT tokens are signed with a secret key
- All task routes are protected
- CORS is enabled (should be restricted in production)

**Warning:** This setup is suitable for development and demos.

Production systems should add:
- Token expiration
- Refresh tokens
- Role-based access control
- Rate limiting

## Assumptions

- PostgreSQL is available and reachable
- Frontend supplies JWT tokens correctly
- API is deployed behind HTTPS in production
- Database migrations are handled externally if needed

## Future Improvements

- Token expiration & refresh tokens
- Role-Based Access Control (RBAC)
- Per-user task ownership
- Alembic migrations
- Structured logging
- API versioning
- Dockerized deployment
- CI/CD integration

