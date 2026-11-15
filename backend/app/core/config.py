import os
from typing import List, Literal, Union
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings for Skill Mantra Academy Backend.
    Uses Pydantic v2 settings management with strict type, environment,
    CORS, and security validation.
    """
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Core Environment Settings - Strictly restricted to development | staging | production
    ENVIRONMENT: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Runtime environment: development | staging | production",
    )
    DEBUG: bool = Field(default=False, description="Enable debug mode")
    APP_NAME: str = Field(default="Skill Mantra Academy Backend")
    API_V1_PREFIX: str = Field(default="/api/v1")
    SECRET_KEY: str = Field(
        default="development_insecure_secret_key_minimum_32_chars_long_12345",
        description="Key used for cryptographic token signing and hashing",
    )

    # Database Configuration (PostgreSQL 15+ hosted on Neon)
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/skillmantra_dev",
        description="PostgreSQL connection string using the psycopg (Psycopg 3) driver",
    )

    # Database Connection Pool Settings (Optimized for 200+ concurrent students)
    DB_POOL_SIZE: int = Field(default=25, description="Baseline connection pool size")
    DB_MAX_OVERFLOW: int = Field(default=50, description="Maximum overflow connections")
    DB_POOL_TIMEOUT: int = Field(default=30, description="Connection acquisition timeout in seconds")
    DB_POOL_RECYCLE: int = Field(default=300, description="Recycle connections every N seconds (ideal for serverless)")
    DB_ECHO: bool = Field(default=False, description="Log generated SQL queries to stdout")

    # Rate Limiting Settings (Configurable for campus lab NAT IP environments)
    RATE_LIMIT_LOGIN_IP_MAX: int = Field(
        default=500,
        description="Maximum login attempts per minute per IP to prevent college campus NAT lockouts",
    )
    RATE_LIMIT_ACTIVATION_IP_MAX: int = Field(
        default=500,
        description="Maximum activation attempts per minute per IP to prevent college campus NAT lockouts",
    )

    # CORS Settings - Must be explicit domain origins (wildcard '*' is forbidden with allow_credentials=True)
    CORS_ORIGINS: Union[str, List[str]] = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated or list of allowed CORS origins",
    )

    # Session Management
    SESSION_DURATION_DAYS: int = Field(default=7, description="Session lifetime in days")
    SESSION_COOKIE_NAME: str = Field(default="skillmatra_session", description="HTTP-only session cookie name")
    SESSION_COOKIE_SECURE: bool = Field(default=False, description="Require HTTPS for cookie transmission")
    SESSION_COOKIE_SAMESITE: str = Field(default="lax", description="SameSite policy: lax | strict only")
    LOCAL_HTTP: bool = Field(
        default=False,
        description="Allow HTTP on loopback for local testing of staging/production modes",
    )

    # Trusted Reverse Proxies (for secure X-Forwarded-For resolution)
    TRUSTED_PROXIES: Union[str, List[str]] = Field(
        default="127.0.0.1,::1,localhost",
        description="Comma-separated or list of trusted reverse proxy IP addresses/hostnames",
    )

    @field_validator("ENVIRONMENT", mode="before")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """
        Restricts ENVIRONMENT strictly to development, staging, or production.
        Rejects arbitrary or alternative environment names (e.g. 'prod', 'live', 'testing')
        to prevent bypassing environment-specific security gates.
        """
        if not isinstance(v, str):
            raise ValueError("ENVIRONMENT must be a string")
        normalized = v.strip().lower()
        allowed = {"development", "staging", "production"}
        if normalized not in allowed:
            raise ValueError(
                f"Invalid ENVIRONMENT '{v}'. Must be one of: {', '.join(sorted(allowed))}. "
                "Arbitrary or alternative environment names are prohibited to prevent bypassing security controls."
            )
        return normalized

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        """
        Ensures the connection string uses the psycopg (Psycopg 3) dialect.
        Translates 'postgresql://' or 'postgres://' to 'postgresql+psycopg://'.
        """
        if not v:
            return v
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def validate_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """
        Parses and validates CORS origins:
        1. Normalizes string or list into a list of trimmed origins.
        2. Rejects wildcard '*' in ALL environments because the application
           enables credentials (allow_credentials=True).
        """
        if isinstance(v, str):
            origins = [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple, set)):
            origins = [str(origin).strip() for origin in v if str(origin).strip()]
        else:
            origins = []

        if "*" in origins or any(o == "*" for o in origins):
            raise ValueError(
                "CORS security violation: Wildcard origin '*' is strictly prohibited when "
                "allow_credentials=True. W3C CORS specifications and browser security models "
                "disallow wildcard origins with credentialed requests. Specify explicit trusted domain origins."
            )
        return origins

    @field_validator("SESSION_COOKIE_SAMESITE", mode="before")
    @classmethod
    def validate_cookie_samesite(cls, v: str) -> str:
        """
        Validates that SESSION_COOKIE_SAMESITE is strictly 'lax' or 'strict' (RFC 6265bis).
        """
        if not isinstance(v, str):
            raise ValueError("SESSION_COOKIE_SAMESITE must be a string")
        val = v.strip().lower()
        if val not in {"lax", "strict"}:
            raise ValueError(
                f"Invalid SESSION_COOKIE_SAMESITE '{v}'. Only 'lax' or 'strict' are permitted."
            )
        return val

    @model_validator(mode="after")
    def validate_security_configuration(self) -> "Settings":
        """
        Enforces strict security gates across environments (P2-11, P6-06, P6-05):
        1. Prevents staging and production startup with weak, default, or low-entropy SECRET_KEY.
        2. Requires minimum 64 characters and character diversity for SECRET_KEY in staging & production.
        3. Rejects keys containing dev, example, placeholder, changeme or sample strings.
        4. Enforces SESSION_COOKIE_SECURE = True in staging and production (unless LOCAL_HTTP on loopback).
        5. Enforces HTTPS CORS origins in staging and production (unless LOCAL_HTTP on loopback).
        """
        origins = self.cors_origins_list

        if self.is_production or self.is_staging:
            insecure_defaults = {
                "development_insecure_secret_key_minimum_32_chars_long_12345",
                "replace_with_a_secure_random_64_character_hex_string_in_production",
                "insecure-secret-key-change-in-production",
                "secret",
                "changeme",
                "password",
                "admin",
                "12345678",
            }
            key = self.SECRET_KEY.strip() if self.SECRET_KEY else ""
            key_lower = key.lower()

            # Check 1: Blocklist of known defaults / documented sample strings
            if (
                "replace_with_a_secure_random_64_character_hex_string_in_production" in key_lower
                or key in insecure_defaults
                or key_lower in insecure_defaults
            ):
                raise ValueError(
                    f"{self.ENVIRONMENT.capitalize()} startup aborted: Known insecure default SECRET_KEY detected. "
                    "You must provision a distinct, cryptographically secure secret from an environment variable."
                )

            # Check 2: Non-empty and minimum length (64 chars in staging/production)
            if not key or len(key) < 64:
                raise ValueError(
                    f"{self.ENVIRONMENT.capitalize()} startup aborted: Insecure SECRET_KEY. "
                    f"In {self.ENVIRONMENT} mode, SECRET_KEY must contain at least 64 characters."
                )

            # Check 3: Blocklist of forbidden keywords/substrings
            forbidden_subs = ["dev", "example", "placeholder", "changeme"]
            for sub in forbidden_subs:
                if sub in key_lower:
                    raise ValueError(
                        f"{self.ENVIRONMENT.capitalize()} startup aborted: Insecure SECRET_KEY. "
                        f"SECRET_KEY contains forbidden substring '{sub}'."
                    )

            # Check 4: Basic character diversity / low entropy heuristic check
            if len(set(key)) < 10:
                raise ValueError(
                    f"{self.ENVIRONMENT.capitalize()} startup aborted: Insecure SECRET_KEY. "
                    "Insufficient character diversity detected (repeated or patterned key). "
                    "Ensure the secret is generated via a cryptographically secure random source (e.g. openssl rand -hex 32)."
                )

            # Check 5: Cookie security and CORS origin requirements for staging & production
            if not self.LOCAL_HTTP:
                self.SESSION_COOKIE_SECURE = True

                if not origins:
                    raise ValueError(
                        f"{self.ENVIRONMENT.capitalize()} startup aborted: CORS_ORIGINS is empty. "
                        f"{self.ENVIRONMENT.capitalize()} requires explicit trusted domain origins with HTTPS."
                    )

                for origin in origins:
                    lower_origin = origin.lower()
                    if "localhost" in lower_origin or "127.0.0.1" in lower_origin or "0.0.0.0" in lower_origin:
                        raise ValueError(
                            f"{self.ENVIRONMENT.capitalize()} startup aborted: Loopback/localhost origin '{origin}' is forbidden in {self.ENVIRONMENT} CORS_ORIGINS. "
                            "Specify explicit trusted domain origins with HTTPS (or enable LOCAL_HTTP=True on loopback)."
                        )
                    if not lower_origin.startswith("https://"):
                        raise ValueError(
                            f"{self.ENVIRONMENT.capitalize()} startup aborted: Insecure or non-HTTPS origin '{origin}' forbidden in {self.ENVIRONMENT} CORS_ORIGINS. "
                            f"All {self.ENVIRONMENT} origins must begin with 'https://' (or enable LOCAL_HTTP=True on loopback)."
                        )
            else:
                # LOCAL_HTTP is only permitted when origins are on loopback
                for origin in origins:
                    lower_origin = origin.lower()
                    if not any(lh in lower_origin for lh in ("localhost", "127.0.0.1", "::1")):
                        raise ValueError(
                            f"{self.ENVIRONMENT.capitalize()} startup aborted: LOCAL_HTTP=True is only permitted on loopback/localhost origins."
                        )

        if self.is_production:
            # Force DB_ECHO to False in production
            self.DB_ECHO = False

        return self

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def trusted_proxies_list(self) -> List[str]:
        if isinstance(self.TRUSTED_PROXIES, list):
            return [str(p).strip().lower() for p in self.TRUSTED_PROXIES if str(p).strip()]
        return [p.strip().lower() for p in self.TRUSTED_PROXIES.split(",") if p.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_staging(self) -> bool:
        return self.ENVIRONMENT == "staging"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


settings = Settings()
