"""
Centralized Password Security Policy and Generation Utility.
Fulfills P2-08:
- Minimum length 10
- Rejects common/breached passwords (loaded from common_passwords.txt)
- Rejects passwords containing user context (email local part, roll number, name)
- Rejects all-same or sequential characters
- CSPRNG temporary password generator (14+ characters, mixed character classes)
"""
import os
import re
import secrets
import string
from typing import Any, Dict, Optional, Set

# Exception for policy violations
class PasswordPolicyViolation(ValueError):
    """Raised when a password fails central security policy."""
    pass


# Load common passwords blocklist
_COMMON_PASSWORDS_FILE = os.path.join(os.path.dirname(__file__), "common_passwords.txt")

def _load_common_passwords() -> Set[str]:
    common = set()
    if os.path.exists(_COMMON_PASSWORDS_FILE):
        with open(_COMMON_PASSWORDS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                val = line.strip().lower()
                if val:
                    common.add(val)
    # Ensure baseline required values are unconditionally present
    baseline = {
        "1234",
        "12345",
        "123456",
        "1234567",
        "12345678",
        "123456789",
        "1234567890",
        "qwerty12",
        "skillthinker",
        "skillmantra",
        "password",
        "admin123",
    }
    common.update(baseline)
    return frozenset(common)

COMMON_PASSWORDS: Set[str] = _load_common_passwords()


_KEYBOARD_PATTERNS = [
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
    "0123456789",
    "9876543210",
]


def _has_sequential_chars(pw: str, length: int = 4) -> bool:
    """Checks if password contains consecutive sequential or keyboard-adjacent characters."""
    lower_pw = pw.lower()
    n = len(lower_pw)
    if n < length:
        return False

    # Check keyboard rows
    for row in _KEYBOARD_PATTERNS:
        rev_row = row[::-1]
        for i in range(len(row) - length + 1):
            chunk = row[i : i + length]
            rev_chunk = rev_row[i : i + length]
            if chunk in lower_pw or rev_chunk in lower_pw:
                return True

    # Check alphabetical/numerical ASCII sequences
    for i in range(n - length + 1):
        chunk = lower_pw[i : i + length]
        if all(chunk[j].isalnum() for j in range(length)):
            # Ascending
            if all(ord(chunk[j + 1]) - ord(chunk[j]) == 1 for j in range(length - 1)):
                return True
            # Descending
            if all(ord(chunk[j]) - ord(chunk[j + 1]) == 1 for j in range(length - 1)):
                return True

    return False


def _has_repeated_chars(pw: str, length: int = 4) -> bool:
    """Checks if password contains runs of identical characters (e.g. 'aaaa' or '1111')."""
    if len(set(pw)) <= 1:
        return True
    for i in range(len(pw) - length + 1):
        if len(set(pw[i : i + length])) == 1:
            return True
    return False


def validate_password(pw: str, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Validates password against platform security requirements:
    1. Minimum length >= 10 characters.
    2. Not in common/breached passwords blocklist.
    3. Does not contain personal identity info (email local part, roll number, names).
    4. Does not contain repeated all-same or sequential characters.
    """
    if not pw:
        raise PasswordPolicyViolation("Password cannot be empty.")

    if len(pw) < 10:
        raise PasswordPolicyViolation("Password must be at least 10 characters long.")

    lower_pw = pw.lower()

    # Common passwords check (exact match or stripped match)
    if lower_pw in COMMON_PASSWORDS:
        raise PasswordPolicyViolation("Password is too common or predictable. Please choose a stronger password.")

    # Strip simple trailing numbers or symbols and re-check against common list
    core_word = re.sub(r"[0-9!@#$%^&*_\-+=\.]+$", "", lower_pw)
    if core_word and len(core_word) >= 4 and core_word in COMMON_PASSWORDS:
        raise PasswordPolicyViolation("Password is based on a common or breached term. Please choose a stronger password.")

    # Check for all-same or repeated characters
    if _has_repeated_chars(pw):
        raise PasswordPolicyViolation("Password cannot consist of repeated or identical characters.")

    # Check for sequential patterns
    if _has_sequential_chars(pw):
        raise PasswordPolicyViolation("Password cannot contain sequential characters (e.g. '1234', 'abcd', 'qwerty').")

    # Context checks (email, roll number, name)
    if context:
        email = context.get("email")
        if email and isinstance(email, str) and "@" in email:
            local_part = email.split("@")[0].strip().lower()
            if len(local_part) >= 3 and local_part in lower_pw:
                raise PasswordPolicyViolation("Password cannot contain your email username.")

        roll_number = context.get("roll_number")
        if roll_number and isinstance(roll_number, str):
            clean_roll = roll_number.strip().lower()
            if len(clean_roll) >= 3 and clean_roll in lower_pw:
                raise PasswordPolicyViolation("Password cannot contain your roll number.")

        name = context.get("name") or context.get("full_name")
        if name and isinstance(name, str):
            clean_name = name.strip().lower()
            # Check full name
            if len(clean_name) >= 3 and clean_name in lower_pw:
                raise PasswordPolicyViolation("Password cannot contain your name.")
            # Check individual name parts (e.g. first, last)
            for part in clean_name.split():
                if len(part) >= 3 and part in lower_pw:
                    raise PasswordPolicyViolation("Password cannot contain parts of your name.")

        dob = context.get("dob")
        if dob and isinstance(dob, str):
            clean_dob = dob.strip().replace("-", "").replace("/", "")
            if len(clean_dob) >= 4 and clean_dob in lower_pw:
                raise PasswordPolicyViolation("Password cannot contain your date of birth.")


def generate_temp_password(length: int = 16) -> str:
    """
    Generates a cryptographically secure temporary password (CSPRNG).
    Guarantees:
    - Length >= 14 (defaults to 16)
    - Mixed character classes: uppercase, lowercase, digits, symbols
    - Guaranteed to pass central validate_password policy
    """
    if length < 14:
        length = 14

    symbols = "!@#$%*-_+"
    alphabet = string.ascii_letters + string.digits + symbols

    for _ in range(1000):  # Bound loop to prevent infinite retry
        chars = [
            secrets.choice(string.ascii_uppercase),
            secrets.choice(string.ascii_lowercase),
            secrets.choice(string.digits),
            secrets.choice(symbols),
        ]
        chars += [secrets.choice(alphabet) for _ in range(length - 4)]
        secrets.SystemRandom().shuffle(chars)
        candidate = "".join(chars)

        try:
            validate_password(candidate)
            return candidate
        except PasswordPolicyViolation:
            continue

    # Fallback high-entropy hex-delimited token
    return f"SM!{secrets.token_urlsafe(12)}8A"
