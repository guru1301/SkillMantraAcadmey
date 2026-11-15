# Skill Mantra Academy - FastAPI Backend

Production-ready backend services for the Skill Mantra Academy / Skill Thinker platform, migrated from Next.js Server Actions and direct SQL queries to a modular Python FastAPI architecture.

---

## 1. Supported Technology Stack

- **Runtime**: Python 3.10+ (Tested on Python 3.10.0)
- **Web Framework**: FastAPI 0.135+ (pinned `0.135.1`)
- **Data Validation & Settings**: Pydantic v2 (`2.12.5`), Pydantic Settings (`2.15.0`)
- **Database Engine & ORM**: SQLAlchemy 2.0 (`2.0.49`), Psycopg 3 (`3.3.6` with binary C extensions)
- **Migrations Engine**: Alembic (`1.18.4`)
- **Security & Cryptography**: Argon2-cffi (`25.1.0`), Bcrypt (`5.0.0`)
- **Testing**: Pytest (`8.4.2`), HTTPX (`0.28.1`)

---

## 2. Directory Layout

```
backend/
├── app/
│   ├── main.py                  # FastAPI initialization, CORS, global error handlers
│   ├── api/
│   │   └── health.py            # /health/live and /health/ready diagnostic endpoints
│   ├── core/
│   │   ├── config.py            # Pydantic v2 BaseSettings with production security gates
│   │   └── logging.py           # Structured application logging
│   └── db/
│       ├── base.py              # SQLAlchemy 2.0 Base with PostgreSQL naming conventions
│       ├── session.py           # Engine & connection pool configuration (Psycopg 3)
│       └── models/              # Declarative models matching PostgreSQL schema
│           ├── __init__.py      # Re-exports all 16 database models
│           ├── admin_user.py    # admin_users table
│           ├── college.py       # colleges table
│           ├── college_user.py  # college_users table
│           ├── program.py       # programs table
│           ├── batch.py         # batches, batch_students, batch_trainers tables
│           ├── trainer.py       # trainers table
│           ├── student.py       # students table
│           ├── training_session.py # training_sessions table
│           ├── session_attendance.py # session_attendance table
│           ├── resource.py      # resources table
│           ├── assessment.py    # assessments table
│           ├── assessment_submission.py # assessment_submissions table
│           ├── user_session.py  # user_sessions table (opaque session revocation)
│           └── contact_inquiry.py # contact_inquiries table
├── alembic/                     # Alembic configuration and version scripts
│   ├── env.py                   # Migration environment linking to Base.metadata
│   ├── script.py.mako           # Revision template
│   └── versions/                # Version scripts directory
│       └── 0001_add_user_sessions_and_contact_inquiries.py
├── tests/                       # Categorized test suites
│   ├── conftest.py              # TestClient and application fixtures
│   ├── unit/                    # Metadata and configuration unit tests (No DB required)
│   │   ├── test_models_metadata.py       # Column nullability, types, and constraints
│   │   ├── test_models_ddl_compilation.py# PostgreSQL dialect DDL compilation checks
│   │   ├── test_security_config.py       # Production security gates, CORS, and cookies
│   │   └── test_db_session_unit.py       # Engine dialect and exception resilience
│   └── integration/             # Integration tests
│       ├── test_health_integration.py    # Live HTTP API diagnostics (TestClient)
│       └── test_postgres_integration.py  # Fail-closed PostgreSQL integration tests
├── .env.example                 # Sanitized environment configuration template
├── alembic.ini                  # Alembic CLI configuration
├── pyproject.toml               # Pinned project dependencies
├── requirements.lock            # Exact pinned lockfile for reproducible builds
└── README.md                    # Engineering documentation
```

---

## 3. Database Schema Reconciliations & Index Audit

Following detailed comparison against SQL migrations `001` through `016`:

1. **`programs.progress_weights`**: Corrected to `nullable=True` to match Migration 003 (`progress_weights JSONB DEFAULT '{}'::jsonb`).
2. **`training_sessions.trainer_id`**: Corrected to omit foreign key constraint to match Migration 005 (`trainer_id UUID` with no `REFERENCES trainers(id)`). Relationship is maintained via `foreign()` without emitting an invalid DDL constraint.
3. **`batches.target_strength`**: Reconciled inline unnamed check `CHECK (target_strength >= 0)` to PostgreSQL's default naming convention `batches_target_strength_check`.
4. **Inline Unnamed Check Constraints**: Reconciled to PostgreSQL default names:
   - `session_attendance.status`: `session_attendance_status_check`
   - `assessments.type`: `assessments_type_check`
   - `assessments.status`: `assessments_status_check`
   - `assessment_submissions.status`: `assessment_submissions_status_check`
5. **`assessment_submissions` Nullability**: Corrected `answers` (`nullable=True`), `violations_count` (`nullable=True`), and `shuffled_question_order` (`nullable=True`) to match Migration 015.
6. **`students` Uniqueness**: Documented that students enforce uniqueness via the expression-based unique index `idx_students_college_roll_lower ON (college_id, LOWER(TRIM(roll_number)))`, not a conventional table constraint `UNIQUE(college_id, roll_number)`.
7. **Duplicate Student Indexes Audit (`idx_students_roll_lower` vs `idx_students_lower_roll`)**:
   - Migration `012_add_student_auth.sql` (Line 14) executed:  
     `CREATE INDEX IF NOT EXISTS idx_students_roll_lower ON students (LOWER(TRIM(roll_number)));`
   - Migration `016_performance_indexes.sql` (Line 8) executed:  
     `CREATE INDEX IF NOT EXISTS idx_students_lower_roll ON students (LOWER(TRIM(roll_number)));`
   - **Verdict**: Both indexes exist concurrently on the production PostgreSQL database indexing the exact same expression. In accordance with Rule 1 ("Do not destroy or reset the existing database") and Rule 4 ("Do not execute DROP"), both indexes are intentionally preserved in `Student.__table_args__`. Omitting either index from the ORM model would cause Alembic to generate an unauthorized `DROP INDEX` statement.

---

## 4. Security Gates & Secret Provisioning

### 4.1. Runtime Security Validation Gates
1. **Strict Environment Enforcement**: `ENVIRONMENT` is strictly restricted to `development`, `staging`, or `production`. Unknown or alias environment strings (e.g., `prod`, `live`, `testing`, `qa`) are rejected fail-closed during settings initialization.
2. **Production & Staging Startup Gate**: Startup fails immediately if `SECRET_KEY` is a default placeholder, shorter than 32 characters, or exhibits low character diversity (e.g. repeated characters).
3. **CORS Security with Credentials**: Because the API uses `allow_credentials=True` for session cookies, wildcard origins (`"*"`) are strictly forbidden in all environments. In production, origins must be explicit HTTPS URLs; loopback/localhost domains are rejected.
4. **Cookie Security**: `SESSION_COOKIE_SECURE` is automatically forced to `True` when running in production mode.

### 4.2. Secret Key Provisioning & Entropy Distinction
> [!IMPORTANT]
> **Runtime Validation vs. Entropy Verification**:  
> The application's runtime validator checks syntactic requirements: minimum length ($\ge 32$ chars), absence in known default blacklists, and character diversity. It **cannot** verify true mathematical entropy or guarantee CSPRNG provenance. Operators must ensure production keys are generated using a cryptographically secure random number generator out-of-band and provisioned via secure environment variables or secret managers (e.g. AWS Secrets Manager, HashiCorp Vault).

**Recommended Production Secret Generation**:
```bash
# Option 1: OpenSSL 256-bit CSPRNG hex string (64 hex characters)
openssl rand -hex 32

# Option 2: Python secrets module
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 5. Alembic Migrations & Baseline Safety

### 5.1. Baseline Safety Guard (Preflight Check)
Revision `0001_sessions_and_inquiries` contains an active preflight check (`assert_legacy_baseline_exists()`).
- Before executing DDL, it inspects the target database connection to confirm that all 14 legacy tables (`admin_users`, `colleges`, `college_users`, `programs`, `batches`, `trainers`, `training_sessions`, `batch_trainers`, `students`, `batch_students`, `resources`, `session_attendance`, `assessments`, `assessment_submissions`) exist.
- If any table is missing (e.g. on a blank or incomplete database), the migration **aborts fail-closed** with a `RuntimeError` before creating any tables or writing to `alembic_version`.

### 5.2. Supported Migration Procedures

#### Procedure A: Existing Database (Production / Staging with Legacy 001–016 Applied)
1. Verify the current database URL:
   ```bash
   # Ensure DATABASE_URL is set in environment or backend/.env
   ```
2. Verify static SQL dry-run:
   ```bash
   python -m alembic -c backend/alembic.ini upgrade head --sql
   ```
3. Apply the incremental revision:
   ```bash
   python -m alembic -c backend/alembic.ini upgrade head
   ```
   *The preflight check verifies that all 14 tables are present, then creates `user_sessions`, `contact_inquiries`, their indexes, and sets the Alembic version.*

#### Procedure B: Fresh / Disposable Development Database Bootstrap
To initialize a completely clean, empty PostgreSQL database (e.g. in Docker or a new Neon test branch):
1. Run the automated bootstrap utility:
   ```bash
   python backend/scripts/bootstrap_dev_database.py --db-url "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test"
   ```
   *This utility applies migrations `001` through `016` sequentially in order, then runs `alembic upgrade head` to provision `user_sessions` and `contact_inquiries`.*

### 5.3. Offline SQL Verification (Non-Destructive)
To inspect the exact SQL generated by Alembic without connecting to or mutating any database:
```bash
python -m alembic -c backend/alembic.ini upgrade head --sql
```

---

## 6. Running Tests & Isolated Database Verification

### 6.1. Running the Test Suite (Default Safe Mode)
Run the full test suite from the repository root:
```bash
python -m pytest backend/tests/ -v
```
*In default mode, all 59 unit and HTTP diagnostic tests execute. All 7 live mutating database tests are automatically skipped to guarantee production safety.*

### 6.2. Exact Instructions: Running the 7 Skipped Tests Against an Isolated Database
To run all 7 live PostgreSQL integration tests (`test_postgres_integration.py`):

#### Step 1: Start a Disposable Local PostgreSQL Database (Docker)
```bash
# Start an isolated container on port 5433 with a dedicated test database
docker run -d --name skillmantra-test-db `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=skillmantra_test `
  -p 5433:5432 postgres:16-alpine
```

#### Step 2: Bootstrap the Isolated Database Schema
```bash
python backend/scripts/bootstrap_dev_database.py `
  --db-url "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test"
```

#### Step 3: Run the Integration Suite with Explicit Confirmation Flags
In PowerShell:
```powershell
$env:TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test"
$env:CONFIRM_ISOLATED_TEST_DATABASE="1"
python -m pytest backend/tests/ -v
```

In Bash:
```bash
export TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test"
export CONFIRM_ISOLATED_TEST_DATABASE="1"
python -m pytest backend/tests/ -v
```

#### Step 4: Tear Down the Disposable Container
```bash
docker stop skillmantra-test-db && docker rm skillmantra-test-db
```

### 6.3. Fail-Closed Test Database Safety Rules
The test validator (`is_safe_isolated_test_db`) enforces:
1. **Explicit Confirmation**: Requires both `TEST_DATABASE_URL` AND `CONFIRM_ISOLATED_TEST_DATABASE=1`.
2. **Production URL Matching**: Rejects any URL whose canonical host/port/database matches `settings.DATABASE_URL` or `os.environ["DATABASE_URL"]`.
3. **Database Name Whitelist**: Database name must contain `test`, `isolated`, or `temp`.
4. **Neon Production Protection**: Blocks any connection to Neon cloud hosts containing `main` or `prod` in the hostname or branch/database name.

