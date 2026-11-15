"""
Bootstrap Script for Fresh/Isolated Development & Test Databases.

SAFETY NOTICE:
This script applies legacy migrations 001 through 016 sequentially, followed by
Alembic migration '0001_sessions_and_inquiries' using a SINGLE EXPLICIT CONNECTION.
It employs strict fail-closed safety checks:
1. Restricts target host strictly to approved local test hosts (localhost, 127.0.0.1, ::1).
2. Rejects any remote cloud hosts (including Neon, AWS, Supabase, CockroachDB).
3. Rejects matches against application settings or environment DATABASE_URL.
4. Requires explicit operator confirmation.
DO NOT RUN AGAINST PRODUCTION.
"""
import argparse
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command

# Add workspace root to sys.path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT))

from backend.app.core.config import settings
from backend.app.core.database_safety import validate_isolated_test_database_target

MIGRATIONS_DIR = WORKSPACE_ROOT / "src" / "db" / "migrations"

# Expected 16 legacy migrations in strictly verified execution order
EXPECTED_LEGACY_MIGRATIONS = [
    "001_create_admin_users.sql",
    "002_create_colleges.sql",
    "003_create_programs.sql",
    "004_create_batches.sql",
    "005_create_training_sessions.sql",
    "006_create_resources.sql",
    "007_create_students.sql",
    "008_create_trainers.sql",
    "009_performance_indexes.sql",
    "010_create_college_users.sql",
    "011_create_attendance.sql",
    "012_add_student_auth.sql",
    "013_create_assessments.sql",
    "014_add_trainer_auth.sql",
    "015_add_quiz_questions_and_schedule.sql",
    "016_performance_indexes.sql",
]


def validate_legacy_migration_files() -> list[Path]:
    """
    Verifies that all 16 expected SQL migration files exist in src/db/migrations/
    and are organized in exact chronological sequence.
    """
    if not MIGRATIONS_DIR.exists() or not MIGRATIONS_DIR.is_dir():
        raise FileNotFoundError(f"Migrations directory does not exist: {MIGRATIONS_DIR}")

    resolved_files: list[Path] = []
    for expected_name in EXPECTED_LEGACY_MIGRATIONS:
        file_path = MIGRATIONS_DIR / expected_name
        if not file_path.exists():
            raise FileNotFoundError(
                f"Missing required migration file: {expected_name} in {MIGRATIONS_DIR}. "
                "All 16 legacy migrations must be present to bootstrap a baseline."
            )
        resolved_files.append(file_path)

    return resolved_files


def bootstrap_database(db_url: str, confirmed: bool) -> None:
    is_safe, reason = validate_isolated_test_database_target(db_url, confirmed)
    if not is_safe:
        print(f"BOOTSTRAP ABORTED (Fail-Closed Safety): {reason}", file=sys.stderr)
        sys.exit(1)

    # 1. Validate migration files
    try:
        sql_files = validate_legacy_migration_files()
    except Exception as exc:
        print(f"BOOTSTRAP ABORTED (File Validation): {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"[*] Verified all {len(sql_files)} legacy SQL migrations.")
    print(f"[*] Bootstrapping isolated database: {db_url}")
    engine = create_engine(db_url, pool_pre_ping=True)

    # 2. Open ONE explicit connection and execute legacy migrations + Alembic on it
    with engine.connect() as conn:
        with conn.begin():
            print("[*] Applying 16 legacy migrations sequentially using explicit connection...")
            for sql_file in sql_files:
                print(f"    -> Applying {sql_file.name}...")
                content = sql_file.read_text(encoding="utf-8")
                conn.execute(text(content))
            print("[+] All 16 legacy SQL migrations applied successfully.")

            # 3. Pass the EXACT SAME connection into Alembic
            print("[*] Passing explicit connection to Alembic for user_sessions and contact_inquiries...")
            alembic_ini_path = WORKSPACE_ROOT / "backend" / "alembic.ini"
            alembic_cfg = Config(str(alembic_ini_path))
            alembic_cfg.attributes["connection"] = conn
            alembic_cfg.set_main_option("sqlalchemy.url", db_url)

            # Upgrade to head using the explicit connection
            command.upgrade(alembic_cfg, "head")
            print("[+] Alembic upgrade completed on explicit connection.")

    engine.dispose()
    print("[+] Database bootstrap complete! All 16 tables and Alembic versioning are initialized.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap an isolated dev/test PostgreSQL database.")
    parser.add_argument(
        "--db-url",
        default=os.environ.get("TEST_DATABASE_URL"),
        help="PostgreSQL connection string for the isolated target database.",
    )
    parser.add_argument(
        "--confirm-isolated-database",
        action="store_true",
        default=os.environ.get("CONFIRM_ISOLATED_TEST_DATABASE") == "1",
        help="Explicit confirmation that target database is disposable.",
    )
    args = parser.parse_args()

    if not args.db_url:
        print("Error: Target database URL must be provided via --db-url or TEST_DATABASE_URL env var.", file=sys.stderr)
        sys.exit(1)

    bootstrap_database(args.db_url, args.confirm_isolated_database)
