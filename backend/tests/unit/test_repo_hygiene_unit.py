"""Unit tests verifying repository hygiene controls (Batch A)."""

import json
from pathlib import Path
import re
import subprocess
import zipfile


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestGitignoreHygiene:
    def test_gitignore_contains_required_rules(self):
        gitignore_path = REPO_ROOT / ".gitignore"
        lines = [line.strip() for line in gitignore_path.read_text(encoding="utf-8").splitlines()]

        required_rules = [
            ".env.*",
            "!.env.example",
            "!backend/.env.example",
            "scratch/",
            "*.zip",
            "STAGE_*/",
            "audit_reports/",
            "__pycache__/",
            "*.pyc",
            ".pytest_cache/",
            ".venv/",
            "venv/",
        ]
        for rule in required_rules:
            assert rule in lines, f"Missing required .gitignore rule: {rule}"

    def test_git_check_ignore_blocks_sensitive_paths_and_keeps_examples(self):
        ignored_targets = [
            ".env",
            ".env.local",
            ".env.production",
            ".env.staging",
            "backend/.env",
            "backend/.env.production",
            "scratch/check_neon_tables.py",
            "backend.zip",
            "STAGE_D_RELEASE/LOCAL_STARTUP_GUIDE.md",
            "audit_reports/FINAL_EXECUTIVE_AUDIT_REPORT.md",
            "backend/app/__pycache__/main.cpython-310.pyc",
            "temp.pyc",
            "backend/.pytest_cache/README.md",
            ".venv/pyvenv.cfg",
            "venv/pyvenv.cfg",
        ]
        preserved_targets = [
            ".env.example",
            "backend/.env.example",
        ]

        res = subprocess.run(
            ["git", "check-ignore", "--no-index", *ignored_targets, *preserved_targets],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        assert res.returncode in (0, 1), f"git check-ignore failed: {res.stderr}"
        matched = {line.strip() for line in res.stdout.splitlines() if line.strip()}

        for path in ignored_targets:
            assert path in matched, f"Sensitive path is NOT ignored by .gitignore: {path}"
        for path in preserved_targets:
            assert path not in matched, f"Template file must NOT be ignored: {path}"


class TestPackageProjectScript:
    SCRIPT_PATH = REPO_ROOT / "scripts" / "package-project.ps1"

    def _run_ps(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(self.SCRIPT_PATH), *args],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_allowlist_package_excludes_secrets_and_legacy_dirs(self, tmp_path: Path):
        out_zip = tmp_path / "pkg.zip"
        res = self._run_ps("-OutputZipPath", str(out_zip))
        assert res.returncode == 0, f"Packaging failed: {res.stdout}\n{res.stderr}"
        assert out_zip.exists()

        with zipfile.ZipFile(out_zip, "r") as zf:
            names = [n.replace("\\", "/") for n in zf.namelist()]

        assert "package.json" in names
        assert "backend/app/main.py" in names
        assert not any(".env" in Path(n).name for n in names)
        assert not any(n.startswith("scratch/") or "/scratch/" in n for n in names)
        assert not any(n.startswith("STAGE_") or n.startswith("audit_reports/") for n in names)
        assert not any(n.endswith(".zip") or n.endswith(".pyc") for n in names)

    def test_verify_step_rejects_env_file_in_zip(self, tmp_path: Path):
        bad_zip = tmp_path / "bad_env.zip"
        with zipfile.ZipFile(bad_zip, "w") as zf:
            zf.writestr("backend/.env", "SECRET_KEY=dummy\n")

        res = self._run_ps("-VerifyZipPath", str(bad_zip))
        assert res.returncode != 0
        assert "Forbidden env file in zip" in (res.stdout + res.stderr)

    def test_verify_step_rejects_postgresql_url_with_password_in_zip(self, tmp_path: Path):
        bad_zip = tmp_path / "bad_pg.zip"
        synthetic_uri = "postgresql://admin:" + "TestPw99" + "@db.example.com/prod\n"
        with zipfile.ZipFile(bad_zip, "w") as zf:
            zf.writestr("notes.txt", f"conn = {synthetic_uri}")

        res = self._run_ps("-VerifyZipPath", str(bad_zip))
        assert res.returncode != 0
        assert "non-placeholder password" in (res.stdout + res.stderr)


class TestNoHardcodedCredentials:
    REMOVED_SCRATCH_FILES = [
        "check_all_schema_cols.py",
        "check_batches_cols.py",
        "check_colleges_cols.py",
        "check_neon_tables.py",
    ]
    BENIGN_PASSWORDS = {"password", "postgres", "pass", "****", "<password>", "[password]"}
    PG_URI_PATTERN = re.compile(
        r"(?i)postgres(?:ql)?(?:\+[a-z0-9_]+)?://[^\s:/\"'`]+:([^\s@\"'`]+)@([^\s/\"'`]+)"
    )

    def test_credential_bearing_scratch_scripts_are_removed(self):
        scratch_dir = REPO_ROOT / "scratch"
        for filename in self.REMOVED_SCRATCH_FILES:
            assert not (scratch_dir / filename).exists(), f"Credential file still present: scratch/{filename}"

    def test_scratch_has_no_postgresql_urls_with_non_placeholder_passwords(self):
        scratch_dir = REPO_ROOT / "scratch"
        if not scratch_dir.exists():
            return
        for path in scratch_dir.rglob("*"):
            if not path.is_file():
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            for match in self.PG_URI_PATTERN.finditer(text):
                pw = match.group(1)
                assert pw in self.BENIGN_PASSWORDS, (
                    f"Hardcoded DB credential password detected in scratch/{path.name}"
                )


class TestDemoAndSeedCleanup:
    def test_legacy_seed_scripts_and_npm_scripts_removed(self):
        assert not (REPO_ROOT / "src" / "db" / "seed.ts").exists()
        assert not (REPO_ROOT / "src" / "db" / "seedDemoData.ts").exists()

        pkg = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
        scripts = pkg.get("scripts", {})
        assert not any(k.startswith("db:seed") for k in scripts)

        setup_text = (REPO_ROOT / "src" / "db" / "setup.ts").read_text(encoding="utf-8")
        assert "seedDatabase" not in setup_text

    def test_login_form_has_no_demo_accounts_or_1234(self):
        login_form = (REPO_ROOT / "src" / "app" / "login" / "LoginForm.tsx").read_text(encoding="utf-8")
        forbidden_tokens = [
            "1234",
            "admin@skillmatra.com",
            "coordinator@saranathan.ac.in",
            "suresh.k@skillmatra.com",
            "21CS002",
            "Quick Demo Accounts",
            "handleDemo",
        ]
        for token in forbidden_tokens:
            assert token not in login_form, f"Forbidden demo token in LoginForm.tsx: {token}"

    def test_roster_manager_has_no_1234_default_password(self):
        roster_mgr = (REPO_ROOT / "src" / "components" / "admin" / "StudentRosterManager.tsx").read_text(
            encoding="utf-8"
        )
        assert "1234" not in roster_mgr


class TestBackendDependencyLocking:
    def test_pyproject_includes_reportlab_and_email_validator_without_python_multipart(self):
        pyproject = (REPO_ROOT / "backend" / "pyproject.toml").read_text(encoding="utf-8")
        assert "reportlab>=" in pyproject
        assert "email-validator>=" in pyproject
        assert "python-multipart" not in pyproject

    def test_requirements_lock_pins_runtime_and_transitives_without_python_multipart(self):
        lock_lines = [
            line.strip()
            for line in (REPO_ROOT / "backend" / "requirements.lock").read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
        pinned = {line.split("==", 1)[0].lower(): line for line in lock_lines if "==" in line}

        for expected in (
            "reportlab",
            "email-validator",
            "dnspython",
            "mako",
            "markupsafe",
            "annotated-types",
            "typing-inspection",
            "tzdata",
            "pillow",
            "fastapi",
            "starlette",
            "uvicorn",
        ):
            assert expected in pinned, f"Missing pinned dependency in requirements.lock: {expected}"

        assert "python-multipart" not in pinned

    def test_reportlab_and_email_str_import_work(self):
        from pydantic import BaseModel, EmailStr
        from reportlab.pdfgen import canvas  # noqa: F401

        class _Check(BaseModel):
            email: EmailStr

        assert _Check(email="auditor@skillthinker.com").email == "auditor@skillthinker.com"

