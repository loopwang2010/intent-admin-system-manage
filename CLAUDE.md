# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **智能音箱意图管理系统 v2.0** (Smart Speaker Intent Management System v2.0) - an enterprise-grade intent recognition and management platform built with Node.js + Express + Vue 3 + Element Plus + SQLite.

The main project is located in `intent-admin-system/` directory with separate backend and frontend applications.

## Development Commands

### Backend (intent-admin-system/backend/)
```bash
cd intent-admin-system/backend

# Development
npm run dev              # Start development server with nodemon
npm start               # Start production server

# Database
npm run init-db         # Initialize database with tables and seed data

# Testing
npm test               # Run Jest tests
npm run test:watch     # Run tests in watch mode  
npm run test:coverage  # Run tests with coverage report

# Code Quality
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix

# Utilities
npm run migrate        # Run database migrations
npm run seed           # Seed database with test data
npm run backup         # Backup database
npm run analytics:daily # Update daily analytics stats
```

### Frontend (intent-admin-system/frontend/)
```bash
cd intent-admin-system/frontend

# Development
npm run dev            # Start Vite dev server (usually localhost:5173)
npm run build          # Build for production
npm run preview        # Preview production build

# Code Quality
npm run lint           # Run ESLint for Vue files
npm run format         # Format code with Prettier

# Testing
npm test              # Run Vitest tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage

# Analysis
npm run build:analyze # Build with bundle analyzer
npm run type-check    # TypeScript type checking
```

## System Architecture

### Backend Architecture
- **Express.js** server with modular controller/route/model structure
- **Sequelize ORM** with SQLite database
- **JWT authentication** with role-based permissions (admin/editor/viewer)
- **Comprehensive middleware** for auth, logging, rate limiting
- **AI services** for keyword recommendation and conflict detection

### Key Backend Directories
- `src/controllers/` - 17 controllers for different modules
- `src/routes/` - RESTful API routes (60+ endpoints)
- `src/models/` - Sequelize models for 11 core data tables
- `src/middleware/` - Authentication, logging, rate limiting, error handling
- `src/services/` - AI and analytics business logic
- `src/utils/` - Database utilities and data import/export tools

### Frontend Architecture  
- **Vue 3** with Composition API and TypeScript support
- **Element Plus** UI component library with full icon set
- **Pinia** for state management with persistence
- **Vue Router** for navigation with guards
- **Vite** build tool with hot reload and optimization
- **ECharts** for data visualization
- **Axios** for API communication

### Core Modules
1. **Dashboard** - System overview and analytics
2. **Intent Categories** - 15 intent categories management
3. **Core Intents** - 44 core intents with keyword management
4. **Non-Core Intents** - 23 non-core intents with approval workflow
5. **Response Templates** - 313 response templates with multimedia support
6. **Intent Testing** - Real-time testing with history tracking
7. **Analytics** - Usage statistics and performance monitoring
8. **User Management** - Role-based access control
9. **Authentication** - JWT-based login system

## Database Information

- **Database**: SQLite (located at `intent-admin-system/backend/data/intent_admin.db`)
- **ORM**: Sequelize
- **Tables**: 11 core tables (Users, Roles, Permissions, Categories, CoreIntents, NonCoreIntents, PreResponses, TestRecords, ActivityLogs, SystemConfigs, plus additional relationship tables)
- **Relationships**: Fully defined foreign key relationships between tables
- **Data**: Includes 50,000+ training data records

## API Structure

All APIs follow RESTful conventions with consistent response format:
```json
{
  "success": true,
  "message": "操作成功", 
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Main API routes:
- `/api/auth` - Authentication and user management
- `/api/dashboard` - Dashboard data and analytics  
- `/api/categories` - Intent category management
- `/api/core-intents` - Core intent CRUD operations
- `/api/non-core-intents` - Non-core intent management
- `/api/pre-responses` - Response template management
- `/api/test` - Intent testing functionality
- `/api/analytics` - System analytics and reporting
- `/api/users` - User and permission management

## Quick Start

1. **Install dependencies**:
   ```bash
   cd intent-admin-system/backend && npm install
   cd ../frontend && npm install  
   ```

2. **Initialize database**:
   ```bash
   cd intent-admin-system/backend
   npm run init-db
   ```

3. **Start development servers**:
   ```bash
   # Backend (Terminal 1)
   cd intent-admin-system/backend && npm run dev
   
   # Frontend (Terminal 2) 
   cd intent-admin-system/frontend && npm run dev
   ```

4. **Access applications**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/health

## Default User Accounts

- **Admin**: admin / admin123
- **Editor**: editor / editor123  
- **Viewer**: viewer / viewer123

## Key File Locations

- Backend entry: `intent-admin-system/backend/app.js`
- Frontend entry: `intent-admin-system/frontend/src/main.js`
- Database config: `intent-admin-system/backend/src/config/database.js`
- API routes: `intent-admin-system/backend/src/routes/`
- Vue components: `intent-admin-system/frontend/src/components/`
- Vue views: `intent-admin-system/frontend/src/views/`

## Technology Stack

**Backend**: Node.js 16+, Express.js, Sequelize, SQLite, JWT, bcrypt, CORS, Winston, Helmet, Multer
**Frontend**: Vue 3, Element Plus, Vite, Pinia, Vue Router, Axios, ECharts, VueUse, day.js
**Testing**: Jest with Supertest (backend), Vitest with Vue Test Utils (frontend)  
**Code Quality**: ESLint with Airbnb config, Prettier
**Security**: Rate limiting, request validation, CORS, Helmet middleware