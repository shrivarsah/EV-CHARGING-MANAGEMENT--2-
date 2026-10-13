# VoltMetric — EV Charging Station Management & Software Quality Metrics Platform

An enterprise-grade, dual-module software system uniting a real-time **Electric Vehicle (EV) Charging Station Network Management System** with a unified **Software Quality & Operational Performance Dashboard** powered by live integrations with **SonarQube Cloud** and **Atlassian Jira Cloud**.

Designed and structured specifically for academic rigor and university project demonstrations. **Zero synthetic or fake metrics are generated.**

---

## Table of Contents
1. [Project Overview & Demonstration Flow](#1-project-overview--demonstration-flow)
2. [Architectural Design](#2-architectural-design)
3. [Technology Stack](#3-technology-stack)
4. [Module 1 — EV Charging Application](#4-module-1--ev-charging-application)
5. [Module 2 — The 10 Software & Operational Metrics](#5-module-2--the-10-software--operational-metrics)
6. [Module 3 — Metrics Dashboard Architecture](#6-module-3--metrics-dashboard-architecture)
7. [Module 4 — SonarQube Cloud Integration](#7-module-4--sonarqube-cloud-integration)
8. [Module 5 — Atlassian Jira Cloud Integration](#8-module-5--atlassian-jira-cloud-integration)
9. [Module 6 — Database Schema Design](#9-module-6--database-schema-design)
10. [Module 7 — Automated Testing Suite](#10-module-7--automated-testing-suite)
11. [Module 8 — GitHub & SonarQube Cloud CI Setup](#11-module-8--github--sonarqube-cloud-ci-setup)
12. [Module 9 — Docker & Containerization](#12-module-9--docker--containerization)
13. [Module 10 — Installation & Quickstart Commands](#13-module-10--installation--quickstart-commands)
14. [Demo Accounts & Faculty Presentation Guide](#14-demo-accounts--faculty-presentation-guide)

---

## 1. Project Overview & Demonstration Flow

The overarching objective of this platform is to illustrate how an operational web platform links to automated engineering governance:

```
[EV Charging Application Codebase]
               │
               ▼
   [GitHub Remote Repository]
               │
               ▼
     [SonarQube Cloud Scan] ──► 8 Real Static Code Metrics
                                        │
[Atlassian Jira Cloud Project] ──► 2 Real Operational Metrics
                                        │
                                        ▼
                   [VoltMetric Quality Dashboard]
                     (Exactly 10 Real Metrics)
```

### Key Principles
- **No Synthetic Numbers:** When API credentials are absent or unreachable, the system exhibits clear unconfigured or diagnostic states. No fake figures are ever fabricated.
- **Real Database Records:** Sessions, power rates, charger statuses, reservations, and invoices operate via relational database transactions.
- **Audit Snapshots:** Every manual or automated sync persists an immutable record to the `metric_snapshots` table for historical trend charting.

---

## 2. Architectural Design

The application uses a 3-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│             React 18 + Vite + TypeScript (SPA)              │
│       Vanilla CSS Design System • Recharts Analytics        │
│          Customer Portal & Admin Operations Center          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (JWT Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI (Python 3.11+)                    │
│      Async REST Services • Pydantic v2 • SQLAlchemy 2.0     │
│ ┌──────────────────────┐ ┌───────────────┐ ┌──────────────┐ │
│ │  EV Business Logic   │ │ SonarQube API │ │   Jira API   │ │
│ └──────────────────────┘ └───────────────┘ └──────────────┘ │
└──────────────┬──────────────────────────────────────────────┘
               │ SQLAlchemy ORM (PostgreSQL 15 / SQLite Fallback)
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL 15 Alpine                     │
│   Users • Stations • Chargers • Sessions • Payments • Metric│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Component | Description |
|---|---|---|
| **Frontend** | React 18, Vite 5, TypeScript | Single Page App with fast HMR and typed domain models |
| **Frontend Styling** | Vanilla CSS Design System | Curated enterprise CSS variables, dark/light theme, zero emojis, Lucide SVG icons |
| **Analytics & Charts**| Recharts 2.x | Responsive SVG Area, Line, and Bar charts for historical metrics |
| **Backend Framework**| FastAPI 0.110+ (Python 3.11) | High-throughput asynchronous REST API |
| **Data Validation**  | Pydantic v2 & Pydantic-Settings | Strict request/response serialization |
| **Persistence / ORM**| SQLAlchemy 2.0 & PostgreSQL 15 | Relational ACID database with automated schema creation and SQLite dev-fallback |
| **Authentication**   | JWT (JSON Web Tokens) & bcrypt | Role-Based Access Control (`ADMIN` and `CUSTOMER`) |
| **External Clients** | Requests & HTTPX | Real REST clients for SonarQube Cloud and Atlassian Jira Cloud |
| **Testing**          | Pytest, Pytest-Cov, Unittest | Automated unit and integration test coverage with XML/LCOV generation |
| **Containerization** | Docker, Docker Compose, Nginx | Multi-container microservices composition |

---

## 4. Module 1 — EV Charging Application

### 1. Authentication & RBAC
- Role-separated views for **Customer** (driver) and **Admin** (station manager).
- Direct JWT token issuance with bcrypt hashing (72-byte safe truncated hashing).

### 2. Station & Connector Management
- **Search & Filtering:** Real-time filter by keyword, city, connector type (CCS2, Type 2, CHAdeMO), and live availability.
- **Multi-Charger Bays:** Stations support multiple independent charging bays with power ratings ranging from 11 kW AC to 350 kW DC Ultra-Fast.
- **Hardware States:** `AVAILABLE`, `RESERVED`, `CHARGING`, `MAINTENANCE`, `OFFLINE`.

### 3. Slot Reservation
- Customers select future or immediate time slots.
- Automatic conflict prevention and status updates.

### 4. Live Charging Telemetry
- Interactive visual battery State of Charge (SoC %) circular gauge.
- Real-time simulation ticker updates energy consumed (kWh), power rate (kW), duration, and accrued cost.
- Manual simulation boost (+2% SoC) for classroom demonstration.

### 5. Invoicing & Payment Records
- Automated invoice generation upon session termination.
- Unique transaction reference (e.g. `TXN-EVC-XXXXXXXX`).
- Multi-channel payment simulation (UPI AutoPay, Credit Card, Corporate Wallet, NetBanking).

### 6. Notifications & Admin Operations
- In-app notification center for booking confirmation, charging progress, invoices, and alerts.
- Admin dashboard displaying Station Provisioning, Bay Overrides, Utilization Rate (%), and Emergency Abort controls.

---

## 5. Module 2 — The 10 Software & Operational Metrics

The application displays **EXACTLY 10 metrics** — 8 from SonarQube Cloud and 2 from Atlassian Jira Cloud:

### SonarQube Cloud Metrics (1 to 8)
1. **Lines of Code (`ncloc`):** Total physical lines of non-comment, non-empty source code.
2. **Code Complexity (`cognitive_complexity`):** Assesses human readability by penalizing nested control logic.
3. **Cyclomatic Complexity (`complexity`):** Number of linearly independent code execution paths (McCabe metric).
4. **Code Coverage (`coverage`):** Percentage of executable code verified by automated test suites.
   $$\text{Coverage} = \left(\frac{\text{Covered Executable Lines}}{\text{Total Executable Lines}}\right) \times 100$$
5. **Code Duplication (`duplicated_lines_density`):** Density of cloned logic tokens across repository files.
   $$\text{Duplication} = \left(\frac{\text{Duplicated Lines}}{\text{Total Lines}}\right) \times 100$$
6. **Bugs (`bugs`):** Count of code defects that cause functional failure or runtime exceptions.
7. **Technical Debt (`sqale_index`):** Estimated developer time in minutes/hours required to resolve code smells and remediation debt.
8. **Security Vulnerabilities (`vulnerabilities`):** Count of identified security flaws vulnerable to exploitation.

### Jira Cloud Custom Operational Metrics (9 & 10)
9. **Charging Workflow Efficiency:**
   Measures operational execution velocity against engineering benchmarks.
   $$\text{Charging Workflow Efficiency} = \left(\frac{\text{Expected Workflow Time}}{\text{Actual Workflow Time}}\right) \times 100$$

10. **Station Availability Response Index:**
    Quantifies the responsiveness and latency of charger state transitions and reservation handoffs.
    $$\text{Station Availability Response Index} = \left(\frac{\text{Expected Response Time}}{\text{Actual Response Time}}\right) \times 100$$

---

## 6. Module 3 — Metrics Dashboard Architecture

The frontend provides 6 dedicated pages:
1. **Overview:**
   - Composite Software Quality Score (0–100%) and Grade (A to E).
   - All 10 metric cards with status pills, units, benchmarks, and source badges (`SonarQube Cloud` vs `Jira Cloud`).
   - Integration health indicators with last updated timestamp.
   - Quick "Fetch & Snapshot Now" button.
2. **Code Quality:** Architectural inspection into LOC, Cognitive Complexity vs Cyclomatic Complexity, Duplication, and Debt.
3. **Testing & Security:** Analysis of test coverage, bugs, and zero-vulnerability security policies.
4. **EV Charging Metrics:** Dedicated deep dive into Jira formulas 9 and 10 with breakdown variables and Jira source data.
5. **Trends:** Interactive Recharts graphs plotting historical snapshots from database records over time.
6. **Settings / API Configuration:** Comprehensive connection forms, credentials persistence, and instant connectivity testing.

---

## 7. Module 4 — SonarQube Cloud Integration

- **Endpoint:** `GET https://sonarcloud.io/api/measures/component`
- **Parameters:**
  ```
  component=<project_key>&metricKeys=ncloc,cognitive_complexity,complexity,coverage,duplicated_lines_density,bugs,sqale_index,vulnerabilities
  ```
- **Authentication:** HTTP Basic Auth with user token as username (`token: ""`).
- **Error Handling:** Gracefully reports 401 Unauthorized, 404 Project Not Found, or connection timeout without faking values.

---

## 8. Module 5 — Atlassian Jira Cloud Integration

- **Endpoints:**
  - `GET /rest/api/3/myself` (Authentication validation)
  - `GET /rest/api/3/field` (Custom field resolution)
  - `POST /rest/api/3/search` (Issue JQL retrieval: `project = "<project_key>"`)
- **Authentication:** HTTP Basic Auth with Atlassian Account Email and API Token.
- **Source of Truth:** Queries Jira issues to extract custom fields (e.g. `customfield_XXXXX`) or time tracking (`timeoriginalestimate` / `timespent`) and executes the exact formulas.

---

## 9. Module 6 — Database Schema Design

The PostgreSQL database manages 9 relational tables:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    users     │       │   stations   │       │ metric_snapshots │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)          │
│ email        │       │ code (Unique)│       │ timestamp        │
│ password     │       │ name, address│       │ overall_score    │
│ role         │       │ total_chargers       │ loc, complexity  │
└──────┬───────┘       └──────┬───────┘       │ coverage, bugs   │
       │                      │ 1:N           │ debt, vuln       │
       │ 1:N                  ▼               │ efficiency (Jira)│
       │               ┌──────────────┐       │ response (Jira)  │
       │               │   chargers   │       └──────────────────┘
       │               ├──────────────┤
       │               │ id (PK)      │       ┌──────────────────┐
       │               │ station_id   │       │api_configurations│
       │               │ power_kw     │       ├──────────────────┤
       │               │ status       │       │ id (PK)          │
       │               └──────┬───────┘       │ service_name     │
       ▼                      ▼               │ base_url         │
┌──────────────┐       ┌──────────────────┐   │ project_key      │
│ reservations │◄──────┤charging_sessions │   │ auth_token       │
├──────────────┤       ├──────────────────┤   └──────────────────┘
│ id (PK)      │       │ id (PK)          │
│ user_id, time│       │ user_id, charger │
└──────────────┘       │ soc, energy_kwh  │
                       │ total_amount     │
                       └──────┬───────────┘
                              │ 1:1
                              ▼
                       ┌──────────────┐
                       │   payments   │
                       ├──────────────┤
                       │ id (PK)      │
                       │ transaction  │
                       │ amount       │
                       └──────────────┘
```

---

## 10. Module 7 — Automated Testing Suite

The backend contains 21 automated unit and integration tests covering:
- Authentication & JWT token issuance (`test_auth.py`)
- Station management & filter rules (`test_stations.py`)
- Charger availability & status updates (`test_chargers.py`)
- Live charging session lifecycle & billing calculation (`test_sessions.py`)
- SonarQube & Jira formula evaluation and quality score engine (`test_metrics_service.py`)
- Mocked REST API clients and HTTP error handling (`test_jira_sonarqube_api.py`)

### Run Tests:
```bash
# In backend directory (with activated virtual environment)
pytest -v --cov=app --cov-report=xml --cov-report=term
```

---

## 11. Module 8 — GitHub & SonarQube Cloud CI Setup

### 1. Configuration File: `sonar-project.properties`
Located in the project root:
```properties
sonar.projectKey=shrivarsah_EV-Charging-Station-Management-System
sonar.organization=shrivarsah
sonar.projectName=EV Charging Station Management System
sonar.projectVersion=1.0

sonar.sources=backend/app,frontend/src
sonar.tests=backend/tests

sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/.venv/**
sonar.python.coverage.reportPaths=backend/coverage.xml
sonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info
sonar.sourceEncoding=UTF-8
```

### 2. GitHub Actions Workflow: `.github/workflows/sonar.yml`
Runs on every `push` and `pull_request`:
1. Checks out repository with full git history (`fetch-depth: 0`).
2. Runs Python pytest test suite and generates `backend/coverage.xml`.
3. Builds React frontend bundle.
4. Triggers `SonarSource/sonarqube-scan-action@v4` with secret `SONAR_TOKEN`.

### 3. Connecting Your Repository to SonarCloud:
1. Log into [SonarCloud.io](https://sonarcloud.io) using GitHub.
2. Click **+** → **Analyze new project** and select this repository.
3. In SonarCloud, go to **Project Administration** → **Analysis Method** and disable *Automatic Analysis* (so GitHub Actions handles it).
4. Go to **My Account** → **Security** → **Generate Token** (e.g. `SONAR_TOKEN`).
5. In GitHub repository: **Settings** → **Secrets and variables** → **Actions** → Add `SONAR_TOKEN`.

---

## 12. Module 9 — Docker & Containerization

The system runs completely through Docker Compose with zero host machine package requirements.

### Start Entire System:
```bash
docker compose up --build -d
```

### Containers Created:
- **`ev_postgres_db`** (Port 5432): PostgreSQL 15 database with persistent volume.
- **`ev_fastapi_backend`** (Port 8000): FastAPI REST service with database health check dependency.
- **`ev_react_frontend`** (Port 3000): Nginx web server serving production Vite bundle and proxying API calls.

### Stop System:
```bash
docker compose down
```

---

## 13. Module 10 — Installation & Quickstart Commands

### Option A: Run via Docker Compose (Recommended single-command run)
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Launch all services
docker compose up --build -d

# 3. Access in browser
# Frontend: http://localhost:3000
# Backend Docs: http://localhost:8000/docs
```

---

### Option B: Run Locally on Host Machine (Without Docker)

#### 1. Start Backend:
```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server (automatic SQLite fallback if local PostgreSQL is not running)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start Frontend:
```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 14. Demo Accounts & Faculty Presentation Guide

For demonstration to faculty and reviewers, pre-seeded accounts and hardware bays are immediately available:

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **System Administrator** | `admin@evcharging.com` | `Admin@12345` | Provision stations, toggle bays, emergency stop sessions, manage API credentials |
| **EV Customer** | `customer@evcharging.com` | `Customer@12345` | Search stations, reserve bays, execute live charging sessions, view invoices |

### Faculty Demonstration Script:
1. **Login:** Log in using one-click buttons on the login screen (`Fill Admin` or `Fill Customer`).
2. **Station Search & Booking:**
   - Browse 5 realistic stations (e.g., Chennai Central Hub, Airport Terminal 2 Express Hub).
   - Filter by `CCS2 (DC Fast)` or `Available Only`.
   - Click **Reserve** to schedule an upcoming slot, or click **Charge** to start an immediate session.
3. **Live Charging Telemetry:**
   - Watch the animated battery SoC gauge update in real-time.
   - Click **Simulate +2% Boost** to demonstrate instantaneous meter reading synchronization.
   - Click **Stop & Settle** to generate a real tax invoice with transaction reference.
4. **Admin Operations Center:**
   - Switch to Administrator account.
   - View real-time KPI metrics: Total Bays, Total Energy Dispensed (kWh), Total Revenue (₹), Bay Utilization Rate.
   - Provision a new station or trigger an emergency session stop.
5. **Software Quality Dashboard (10 Metrics):**
   - Navigate to **Overview (10 Metrics)**.
   - Inspect the composite quality score and the 10 distinct metric cards.
   - Note the **SonarQube Cloud** labels on metrics 1–8 and **Jira Cloud** labels on metrics 9 & 10.
   - Go to **Settings & Credentials** to enter SonarQube Cloud and Jira Cloud tokens and click **Test Connection** to demonstrate live cloud API verification.
   - Go to **Historical Trends** to view the Recharts plots displaying historical quality improvements over time.
