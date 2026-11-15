"""
Authentication & Cryptographic Security Utilities.

Provides password hashing/verification (compatible with existing bcrypt and argon2id hashes),
secure random session token generation with SHA-256 hashing, and CSRF token management.
"""
import hashlib
import hmac
import secrets
from typing import Optional
import bcrypt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from backend.app.core.config import settings

argon2_hasher = PasswordHasher()

# Fixed dummy bcrypt hash (10 salt rounds) and dummy token hash used to mitigate
# timing side-channel attacks during user enumeration attempts.
DUMMY_PASSWORD_HASH = "$2b$10$X.FxeiG0R69Nz.8yYzXQ1OMFAXe1l97Kd9Av9ElFMitBGim/frq.G"
DUMMY_ACTIVATION_TOKEN_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


def hash_password(plain_password: str) -> str:
    """
    Hashes a plaintext password using bcrypt with 10 salt rounds
    (identical to existing Next.js bcryptjs implementation).
    """
    if not plain_password:
        raise ValueError("Password cannot be empty.")
    # Truncate to 72 bytes as required by standard bcrypt
    password_bytes = plain_password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored hash.
    Supports both standard bcrypt hashes ($2a$, $2b$, $2y$) and Argon2id ($argon2id$).
    """
    if not plain_password or not hashed_password:
        return False

    # Check for Argon2
    if hashed_password.startswith("$argon2"):
        try:
            return argon2_hasher.verify(hashed_password, plain_password)
        except (VerifyMismatchError, Exception):
            return False

    # Check for bcrypt
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def generate_session_token() -> str:
    """
    Generates a cryptographically secure 256-bit (32-byte) random session token.
    """
    return secrets.token_hex(32)


def hash_session_token(token: str) -> str:
    """
    Computes the SHA-256 hexadecimal digest of the session token
    for safe storage in the 'user_sessions' table.
    """
    if not token:
        raise ValueError("Session token cannot be empty.")
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_csrf_token(session_token: Optional[str] = None) -> str:
    """
    Generates a cryptographically random or session-bound CSRF token.
    If session_token is provided, produces a signed token bound to the session.
    """
    if session_token:
        return generate_session_csrf_token(session_token)
    return secrets.token_urlsafe(32)


def generate_session_csrf_token(session_token: str, secret_key: Optional[str] = None) -> str:
    """
    Generates a cryptographically signed, session-bound CSRF token.
    Combines a random nonce with an HMAC-SHA256 signature bound to the SHA-256
    digest of the session token.
    Protects against cookie injection, subdomain tossing, and cross-session replay.
    """
    if not session_token:
        raise ValueError("session_token must be provided to bind CSRF token.")
    from backend.app.core.config import settings
    key = (secret_key or settings.SECRET_KEY).encode("utf-8")
    token_binding = hash_session_token(session_token)
    nonce = secrets.token_hex(16)
    message = f"{nonce}:{token_binding}".encode("utf-8")
    signature = hmac.new(key, message, hashlib.sha256).hexdigest()
    return f"{nonce}.{signature}"


def verify_csrf_token(
    header_token: Optional[str],
    cookie_token: Optional[str],
    session_token: Optional[str] = None,
    secret_key: Optional[str] = None,
) -> bool:
    """
    Performs verification of CSRF tokens.
    If session_token is provided, validates the HMAC-SHA256 signature bound to that session.
    Otherwise, performs constant-time equality check (Double Submit Cookie).
    """
    if not header_token or not cookie_token:
        return False
    if not hmac.compare_digest(header_token.strip(), cookie_token.strip()):
        return False
    if session_token:
        return verify_session_csrf_token(header_token, cookie_token, session_token, secret_key)
    return True


def verify_session_csrf_token(
    header_token: Optional[str],
    cookie_token: Optional[str],
    session_token: Optional[str],
    secret_key: Optional[str] = None,
) -> bool:
    """
    Verifies that:
    1. Both header and cookie tokens are provided and identical (Double Submit).
    2. The token has valid structure (<nonce>.<signature>).
    3. The HMAC signature correctly authenticates against the server's SECRET_KEY
       and is cryptographically bound to the current session token.
    """
    if not header_token or not cookie_token or not session_token:
        return False

    if not hmac.compare_digest(header_token.strip(), cookie_token.strip()):
        return False

    token = cookie_token.strip()
    if "." not in token:
        return False

    parts = token.split(".", 1)
    if len(parts) != 2:
        return False
    nonce, signature = parts
    if not nonce or not signature:
        return False

    from backend.app.core.config import settings
    key = (secret_key or settings.SECRET_KEY).encode("utf-8")
    token_binding = hash_session_token(session_token)
    message = f"{nonce}:{token_binding}".encode("utf-8")
    expected_sig = hmac.new(key, message, hashlib.sha256).hexdigest()

    return hmac.compare_digest(signature, expected_sig)


def get_trusted_client_ip(request: object) -> str:
    """
    Resolves the client IP address securely.
    Only trusts X-Forwarded-For if the immediate peer (request.client.host)
    is in settings.trusted_proxies_list.
    If untrusted or direct, uses request.client.host, preventing spoofed forwarded headers.
    When X-Forwarded-For is trusted, parses from RIGHT to LEFT, skipping hops in
    TRUSTED_PROXIES, and selects the first untrusted hop.
    """
    peer_ip = "127.0.0.1"
    if hasattr(request, "client") and getattr(request, "client", None) and getattr(request.client, "host", None):
        peer_ip = str(request.client.host).strip()

    from backend.app.core.config import settings
    trusted_proxies = {p.strip().lower() for p in settings.trusted_proxies_list if p.strip()}

    # If peer is NOT in trusted proxies, do NOT trust X-Forwarded-For!
    if peer_ip.lower() not in trusted_proxies:
        return peer_ip

    # Peer is a trusted proxy (e.g. Next.js server action runner, reverse proxy)
    headers = getattr(request, "headers", {})
    forwarded_for = headers.get("x-forwarded-for")
    if forwarded_for and forwarded_for.strip():
        # Traverse hops from RIGHT to LEFT, skipping trusted proxies
        hops = [ip.strip() for ip in forwarded_for.split(",") if ip.strip()]
        for hop in reversed(hops):
            if hop.lower() not in trusted_proxies:
                return hop
        return peer_ip

    real_ip = headers.get("x-real-ip")
    if real_ip and real_ip.strip():
        clean_real = real_ip.strip()
        if clean_real.lower() not in trusted_proxies:
            return clean_real

    return peer_ip


def generate_temporary_password(length: int = 16) -> str:
    """
    Generates a cryptographically strong, high-entropy temporary password
    containing uppercase, lowercase, digits, and special characters.
    Delegates to central password policy generator.
    """
    from backend.app.core.password_policy import generate_temp_password
    return generate_temp_password(max(length, 14))


def generate_activation_code() -> str:
    """
    Generates a cryptographically secure, human-readable activation code
    using unambiguous alphanumeric characters with >= 128 bits of entropy
    (26 characters * 5 bits = 130 bits of cryptographic randomness).
    Format e.g.: ACT-X7K9-W2M4-P8Q3-R5T6-Y7U8-V9W2-AB
    """
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    chunks = ["".join(secrets.choice(alphabet) for _ in range(4)) for _ in range(6)]
    suffix = "".join(secrets.choice(alphabet) for _ in range(2))
    return f"ACT-{'-'.join(chunks)}-{suffix}"


def hash_activation_token(token: str) -> str:
    """
    Computes HMAC-SHA256 hash of normalized activation code keyed with settings.SECRET_KEY
    for secure database storage.
    """
    if not token:
        raise ValueError("Activation token cannot be empty.")
    normalized = token.strip().upper().replace(" ", "").replace("-", "")
    key = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(key, normalized.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_activation_token(plain_token: str, stored_hash: str) -> bool:
    """
    Verifies an activation code against its stored hash in constant time.
    Checks HMAC-SHA256 first, with fallback to legacy unkeyed SHA-256 for backward compatibility.
    """
    if not plain_token or not stored_hash:
        return False
    computed = hash_activation_token(plain_token)
    if hmac.compare_digest(computed, stored_hash):
        return True
    # Legacy SHA-256 fallback
    normalized = plain_token.strip().upper().replace(" ", "").replace("-", "")
    legacy_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return hmac.compare_digest(legacy_hash, stored_hash)


def normalize_dob(dob_str: Optional[str]) -> Optional[str]:
    """
    Normalizes diverse date of birth formats (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, etc.)
    into standard ISO YYYY-MM-DD.
    """
    if not dob_str or not str(dob_str).strip():
        return None
    s = str(dob_str).strip()
    import re
    # YYYY-MM-DD or YYYY/MM/DD
    m1 = re.match(r"^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$", s)
    if m1:
        y, m, d = m1.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    # DD-MM-YYYY or DD/MM/YYYY
    m2 = re.match(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$", s)
    if m2:
        d, m, y = m2.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    return s




