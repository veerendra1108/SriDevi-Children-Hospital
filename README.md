# Doctormate SaaS — Smart OPD Platform (Phase 1)

Doctormate is a multi-tenant cloud-native Smart Outpatient Department (OPD) platform designed to eliminate waiting-room congestion, streamline receptionist phone booking, and give patients real-time arrival intelligence.

---

## 🌟 Phase 1 Objectives & Release Scope

The first release succeeds when:
1. **A hospital can register itself** through an intuitive self-service portal.
2. **Doctors can customize their consultation slot durations** during registration (e.g. 5 minutes for rapid pediatric/follow-up OPD, 10 or 15 minutes for general consultations, 20 to 30 minutes for complex specialties).
3. **A receptionist can book appointments by telephone** in under 15 seconds with duplicate prevention and instant token generation (`DM-<HOSP>-<DATE>-<TIME>`).
4. **The patient can securely track their live appointment queue** through Doctormate using a two-factor verification barrier (Token + Mobile) with real-time arrival buffer guidance.
5. **Multi-tenant data isolation** ensures complete segregation of queues, doctors, branches, and appointments between hospitals.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies & Design Patterns |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion |
| **Color System** | White, Teal, Mint, and Slate with high-contrast status accents |
| **Backend API** | Node.js, Express, TypeScript (`tsx`) |
| **Queue Engine** | Rolling Train-ETA model with buffer absorption and real-time delay propagation |
| **Current Database** | SQLite (`better-sqlite3`) in Write-Ahead Logging (WAL) mode |
| **Production Target Database** | PostgreSQL (schema-compatible, standard SQL data types) |

---

## ⏱️ Doctor Customizable Time Slots

During hospital registration and doctor onboarding, doctors define their appointment cadence:
- **Available intervals**: `5`, `10`, `15`, `20`, `30` minutes.
- The `schedulingService` automatically calculates slot steps and capacity based on the doctor's specific slot length:
  ```ts
  const slotDuration = schedule.slotDurationMinutes || doctor.slotDurationMinutes || 15;
  ```
- **Live Train-ETA recalculation**: Slot intervals seamlessly integrate with the rolling queue model, absorbing delays through configured hourly buffer slots.

---

## 🔒 Two-Factor Secure Appointment Tracking

Public tracking prevents enumeration attacks while maintaining zero-friction patient access:
1. **Identifier**: `Token` or `Appointment ID` (e.g. `DM-SRID-261017-1030`).
2. **Verification Barrier**: Requires matching the patient's registered mobile number (full 10 digits or last 4 digits) or unique tracking secret.
3. **Live Queue Radar**: Displays patients ahead, doctor delay in minutes, expected consultation time, and recommended arrival buffer (e.g., arrive 15 minutes ahead of expected time).

---

## 🔄 Database Migration Path: SQLite to PostgreSQL

During Phase 1 development, Doctormate uses **SQLite with WAL mode** for instant zero-dependency local execution. The schema is strictly designed for straightforward migration to PostgreSQL.

### Schema Equivalence Table

| SQLite Column Definition | PostgreSQL Equivalent | Description |
|---|---|---|
| `id TEXT PRIMARY KEY` | `id VARCHAR(64) PRIMARY KEY` | Standard UUID / prefixed ID |
| `name TEXT NOT NULL` | `name VARCHAR(255) NOT NULL` | Entity name |
| `slot_duration_minutes INTEGER` | `slot_duration_minutes INTEGER DEFAULT 15` | Doctor consultation duration |
| `booking_source TEXT` | `booking_source VARCHAR(32)` | `'PHONE'`, `'ONLINE'`, `'WALK_IN'` |
| `status TEXT` | `status VARCHAR(32)` | Queue and appointment state |
| `history_json TEXT` | `history_json JSONB` | Audit trail events |
| `created_at TEXT` | `created_at TIMESTAMPTZ DEFAULT NOW()` | ISO timestamp |

### Steps to Switch to PostgreSQL in Production:
1. Set `DATABASE_URL=postgresql://user:password@host:5432/doctormate` in `.env`.
2. Replace `better-sqlite3` driver calls in `server/db.ts` with `pg` (node-postgres) connection pool.
3. Run table DDL script (`server/postgres-schema.sql`).
4. Execute `npm run migrate:pg` to copy initial records from SQLite to PostgreSQL.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Installation
```bash
git clone https://github.com/veerendra1108/doctormate-saas.git
cd doctormate-saas
npm install
```

### 3. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running the Phase 1 Automated Test Suite
```bash
npm test
```
The test suite validates all 7 core Phase 1 flows:
- Hospital self-registration
- 5-minute and 10-minute slot interval generation
- Receptionist telephone booking & double-booking prevention
- Online booking
- Cross-hospital multi-tenant queue isolation
- Doctor delay propagation
- Two-factor secure tracker authentication

---

## 👥 Demo Logins

| Role | Hospital | Credentials |
|---|---|---|
| **Hospital Admin** | Sri Devi Children Hospital | `admin@sridevi.com` / `Admin@123` |
| **Hospital Admin** | City Care Clinic | `admin@citycare.com` / `Admin@123` |
| **Reception Desk** | Sri Devi Children Hospital | `reception.kakinada` / `Reception@123` |
| **Reception Desk** | City Care Clinic | `reception.citycare` / `Reception@123` |

---

## 📋 Git Workflow & Branches

- `main`: Production-stable releases.
- `develop`: Integration branch for upcoming features.
- `feature/saas-smart-opd-phase1`: Complete Smart OPD Phase 1 implementation.
- Remote: `doctormate-saas` (`https://github.com/veerendra1108/doctormate-saas.git`).
