# Team Task Manager (TeamFlow)

A modern Kanban-style task management frontend built with React, TypeScript, Vite, and Tailwind CSS.

This application is designed to work with a JWT-secured backend API and demonstrates real-world frontend patterns used in production DevOps-enabled systems, including authentication, protected routing, API abstraction, and environment-based configuration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [High-Level Architecture](#high-level-architecture)
- [Authentication Flow](#authentication-flow)
- [Task Management Flow](#task-management-flow)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [API Communication](#api-communication)
- [Security Considerations](#security-considerations)
- [Build & Production](#build--production)
- [Linting & Type Safety](#linting--type-safety)
- [Assumptions](#assumptions)
- [Future Improvements](#future-improvements)

## Overview

Team Task Manager (TeamFlow) is a single-page application (SPA) that allows authenticated users to:

- Register and log in securely
- View tasks in a Kanban board
- Create, update, delete, and move tasks across statuses
- Persist login sessions across page reloads
- Interact with a backend REST API using JWT authentication

The project is intentionally structured to resemble real production applications, not demos or tutorials.

## Features

### Authentication & Authorization
- User signup and login
- JWT-based authentication
- Token persistence using localStorage
- Protected routes using a route guard
- Automatic session restoration on reload

### Task Management
- Kanban board with three statuses:
  - To Do
  - In Progress
  - Done
- Drag-and-drop task movement
- Task priorities:
  - Low
  - Medium
  - High
- Task creation modal with validation
- Immediate UI updates after API responses

### UI & UX
- Responsive layout
- Clean, modern design using Tailwind CSS
- Loading and error states
- Accessible and reusable components

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router v6
- Tailwind CSS
- Lucide React (icons)

### Tooling & Quality
- ESLint (TypeScript + React rules)
- Strict TypeScript configuration
- Environment-based configuration via `import.meta.env`

## High-Level Architecture

The application follows a layered frontend architecture:

```
UI Components
   ↓
Pages (Routes)
   ↓
Context (Authentication State)
   ↓
API Service Layer
   ↓
Backend REST API
```

**Why this matters**
- UI is decoupled from business logic
- API calls are centralized
- Authentication state is globally accessible
- Easier testing, debugging, and scaling

## Authentication Flow

1. User submits login or signup form
2. Frontend sends credentials to the backend:
   - `POST /api/auth/login`
   - `POST /api/auth/signup`
3. Backend returns:
   - JWT token
   - User object
4. Frontend:
   - Stores the token in localStorage
   - Stores user metadata
   - Updates global authentication context
5. Protected routes check authentication state before rendering

## Task Management Flow

1. User accesses the dashboard
2. Frontend fetches tasks: `GET /api/tasks`
3Tommy. Tasks are grouped by status:
   - todo
   - in_progress
   - done
4. User actions trigger:
   - `POST /api/tasks`
   - `PUT /api/tasks/:id`
   - `DELETE /api/tasks/:id`
5. UI updates immediately after successful API responses

All task-related API calls go through a single abstraction layer.

## Project Structure

```
.
├── src
│   ├── components     # Reusable UI components
│   ├── contexts       # Global state (authentication)
│   ├── pages          # Route-based pages
│   ├── services       # API abstraction layer
│   ├── types          # TypeScript interfaces
│   ├── App.tsx        # Route definitions
│   ├── main.tsx       # Application entry point
│   └── index.css      # Tailwind base styles
│
├── index.html         # Root HTML file (Vite entry)
├── .env.example       # Environment variable template
├── vite.config.ts
├── tailwind.config.js
├── eslint.config.js
└── package.json
```

**Note:** This project does not use a `public/` folder. Vite serves assets directly from `index.html` and the build output.

## Environment Variables

Environment variables are managed using Vite’s `import.meta.env` system.

**.env.example**
```
VITE_API_URL=http://localhost:5000/api
```

**Important Notes**
- Variables must start with `VITE_`
- `.env` files should never be committed
- Different environments (dev, staging, prod) should use different values

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm (or yarn / pnpm)
- Backend API running locally or remotely

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

The application will be available at: http://localhost:5173

## API Communication

All backend communication is handled in:  
`src/services/api.ts`

**Why this approach?**
- Centralized API logic
- Automatic JWT header injection
- Consistent error handling
- Easier refactoring or mocking

Each request automatically includes:  
`Authorization: Bearer <JWT_TOKEN>`

## Security Considerations

- JWT stored in localStorage
- Authorization headers added automatically
- Protected routes prevent unauthorized access
- Sensitive operations are handled server-side

For higher-security environments, HttpOnly cookies and refresh-token rotation are recommended.

## Build & Production

### Create Production Build
```bash
npm run build
```

This outputs static assets to: `dist/`

### Preview Production Build Locally
```bash
npm run preview
```

The build output is compatible with:
- CapRover
- Nginx
- Cloudflare Pages
- Netlify
- Vercel (static mode)

## Linting & Type Safety

### Run ESLint
```bash
npm run lint
```

### Run Type Checking
```bash
npm run typecheck
```

TypeScript is configured in strict mode to catch issues early.

## Assumptions

- Backend implements JWT authentication correctly
- Backend supports CORS
- API follows REST conventions
- Users must be authenticated before accessing `/dashboard`

## Future Improvements

- Role-Based Access Control (RBAC)
- Task assignment to users
- Real-time updates using WebSockets or SSE
- Pagination and filtering
- Audit logs
- Refresh token rotation
- End-to-end testing (Playwright / Cypress)
- Dockerized frontend build
- CI/CD pipeline integration

