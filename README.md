# MRKOON OKR & Evaluation System

A comprehensive OKR (Objectives and Key Results) and Performance Evaluation System designed to streamline employee assessments, team management, and KPI tracking.

## 🚀 Technology Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **ORM**: Prisma
- **Authentication**: JWT & Passport
- **Language**: TypeScript

### Frontend
- **Framework**: [React](https://react.dev/)
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Language**: TypeScript

---

## 🛠️ How to Run

### Prerequisites
- Node.js (v18+)
- NPM or Yarn

### 1. Setup Backend
```bash
cd apps/backend
npm install
npx prisma migrate dev  # Initialize Database
npm run start:dev       # Start Server on http://localhost:3000
```
*Note: Default Admin Account may need seeding or created via `npx prisma studio`.*

### 2. Setup Frontend
```bash
cd apps/frontend
npm install
npm run dev             # Start Client on http://localhost:5173
```

---

## 🏢 Business Logic & Rules

The system is built around a hierarchical evaluation model involving **Admins**, **Managers**, and **Employees**.

### Core Concepts
1.  **Evaluations**:
    - Conducted **Quarterly** (Q1, Q2, Q3, Q4).
    - Consist of **KPI Groups** (e.g., "Technical Skills", "Soft Skills") and specific **KPI Items**.
    - Each KPI Item has a **Weight** and a **Score** (0-100).
    - Calculated Score = `(Sum(Item Score * Item Weight) / Total Weight)`.
    
2.  **Teams**:
    - Users are organized into Teams.
    - Each Team has one **Manager**.
    - Managers evaluate their team members.

### 🔒 Roles & Permissions

#### 1. ADMIN (`Role.ADMIN`)
*   **Access**: Full System Access.
*   **Capabilities**:
    *   **User Management**: Create, Edit, Delete Users. Assign Roles and Teams.
    *   **Team Management**: Create Teams, Assign Managers.
    *   **KPI Management**: Define Global KPIs and Group Weights.
    *   **Evaluations**: Can view ALL evaluations. Can evaluate **Managers**.
    *   **Analytics**: View organization-wide dashboards.
*   *Security Rule*: Admins are redirected to a secure `/admin/users` view after submitting evaluations.

#### 2. MANAGER (`Role.MANAGER`)
*   **Access**: Team-Level Access.
*   **Capabilities**:
    *   **Team View**: View list of assigned team members.
    *   **Evaluation**: Conduct quarterly evaluations for their **direct reports** (Employees).
    *   **Restrictions**:
        *   Cannot evaluate themselves.
        *   Cannot see evaluations of employees in other teams.
        *   Cannot see evaluations of other Managers.
    *   **Dashboard**: View team performance stats and personal performance.

#### 3. EMPLOYEE (`Role.EMPLOYEE`)
*   **Access**: Personal Access.
*   **Capabilities**:
    *   **Dashboard**: View own profile.
    *   **History**: View past evaluation results and feedback.
    *   **Restrictions**: Read-only access to their own data.

---

## ✨ Features

- **Role-Based Access Control (RBAC)**: Secure routing and API endpoints protected by JWT and Role Guards.
- **Dynamic KPI System**: Flexible weight distribution for different performance metrics.
- **Interactive Dashboards**: 
    - **Admin**: System overview.
    - **Manager**: Team health and pending actions.
    - **Employee**: Personal progress.
- **Data Privacy**:
    - Managers are strictly scoped to their own team's data.
    - Self-evaluation is disabled for Managers in the team view.
- **Responsive UI**: Modern, dark-themed interface built with TailwindCSS.

---

## 📂 Project Structure

```
├── apps
│   ├── backend          # NestJS API
│   │   ├── src
│   │   │   ├── auth     # Authentication Logic
│   │   │   ├── evaluations # Evaluation Computing & Storage
│   │   │   ├── users    # User Management
│   │   │   └── ...
│   │   └── prisma       # Database Schema
│   │
│   └── frontend         # React Client
│       ├── src
│       │   ├── pages    # Route Components (Admin/Manager/Employee)
│       │   ├── layouts  # Role-based Layout Wrappers
│       │   └── ...
```

## 🔐 Security measures
- **Password Hashing**: Bcrypt for secure storage.
- **API Guards**: Endpoints verify `req.user` role before returning sensitive data.
- **Data Scoping**: Services explicitly filter queries based on the requesting user's ID and Role.

## 🚢 Deployment Guide

### Using Docker (Self-Hosted / VPS)

1.  **Build Images**:
    ```bash
    docker-compose build
    ```
    
2.  **Run Containers**:
    ```bash
    docker-compose up -d
    ```

3.  **Access**:
    - Frontend: `http://localhost:8080`
    - Backend: `http://localhost:3000`

### ☁️ Recommended Free Hosting

#### 1. Database (PostgreSQL)
*   **[Neon.tech](https://neon.tech)** (Recommended): Offers a generous free tier for Serverless PostgreSQL.
*   **Supabase**: Excellent alternative.

#### 2. Backend (API)
*   **[Render](https://render.com)**:
    *   Create a **Web Service**.
    *   Connect GitHub Repo.
    *   Runtime: **Docker**.
    *   Root Directory: `.` (Current directory)
    *   Docker Context: `.`
    *   Dockerfile Path: `apps/backend/Dockerfile`
    *   **Environment Variables**: Add `DATABASE_URL`, `JWT_SECRET`, etc.

#### 3. Frontend (UI)
*   **[Vercel](https://vercel.com)** (Best for React):
    *   Import GitHub Repo.
    *   Root Directory: `apps/frontend`.
    *   Build Command: `bun run build`.
    *   Output Directory: `dist`.
    *   **Environment Variables**: Add `VITE_API_URL` pointing to your Render Backend URL.

---

