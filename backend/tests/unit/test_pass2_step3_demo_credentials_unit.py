"""
Pass 2 — Step 3: Zero Demo Credentials in src/ Unit Tests (P2-02)
"""
from pathlib import Path
import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
FORBIDDEN_PATTERNS = [
    "1234",
    "Admin@1234",
    "College@1234",
    "Trainer@1234",
    "Student@1234",
]


def test_zero_demo_credentials_in_src():
    """src/ directory must contain zero occurrences of 1234 or role demo passwords."""
    src_dir = REPO_ROOT / "src"
    assert src_dir.exists(), "src/ directory must exist"

    violations = []
    for path in src_dir.rglob("*"):
        if not path.is_file():
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        for line_no, line in enumerate(content.splitlines(), start=1):
            for pattern in FORBIDDEN_PATTERNS:
                if pattern in line:
                    rel_path = path.relative_to(REPO_ROOT)
                    violations.append(f"{rel_path}:{line_no} matches '{pattern}'")

    assert not violations, "Forbidden demo credential strings detected in src/:\n" + "\n".join(violations)

