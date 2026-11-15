import secrets
import pytest
from backend.app.core.config import Settings


class TestSecurityConfiguration:
    """
    Unit Tests: Validates production and staging security gates, environment validation,
    CORS origin restrictions, and cookie enforcement.
    """

    # ==========================================
    # 1. ENVIRONMENT VALIDATION
    # ==========================================

    def test_environment_accepts_valid_names(self):
        """Validates that 'development', 'staging', and 'production' are accepted."""
        for env in ("development", "staging", "production"):
            strong_key = secrets.token_hex(32)
            s = Settings(
                ENVIRONMENT=env,
                SECRET_KEY=strong_key,
                CORS_ORIGINS="https://app.skillmantra.edu.in" if env in ("production", "staging") else "http://localhost:3000",
            )
            assert s.ENVIRONMENT == env

    def test_environment_normalizes_case(self):
        """Validates case-insensitivity of ENVIRONMENT value."""
        strong_key = secrets.token_hex(32)
        s = Settings(
            ENVIRONMENT="PRODUCTION",
            SECRET_KEY=strong_key,
            CORS_ORIGINS="https://app.skillmantra.edu.in",
        )
        assert s.ENVIRONMENT == "production"
        assert s.is_production is True

    @pytest.mark.parametrize("invalid_env", ["prod", "live", "testing", "local", "qa", "dev", ""])
    def test_environment_rejects_unknown_values(self, invalid_env):
        """
        Validates that unknown or alternative environment names are rejected fail-closed
        to prevent bypassing environment-specific security controls.
        """
        with pytest.raises(ValueError, match="Invalid ENVIRONMENT"):
            Settings(
                ENVIRONMENT=invalid_env,
                SECRET_KEY=secrets.token_hex(32),
            )

    # ==========================================
    # 2. SECRET KEY VALIDATION & DIVERSITY
    # ==========================================

    def test_production_rejects_default_insecure_secret_key(self):
        """Verifies that running with ENVIRONMENT=production and the default insecure key raises a ValueError."""
        with pytest.raises(ValueError, match="Known insecure default SECRET_KEY detected"):
            Settings(
                ENVIRONMENT="production",
                SECRET_KEY="development_insecure_secret_key_minimum_32_chars_long_12345",
                CORS_ORIGINS="https://app.skillmantra.edu.in",
            )

    def test_staging_rejects_default_insecure_secret_key(self):
        """Verifies that running with ENVIRONMENT=staging also rejects the default insecure key."""
        with pytest.raises(ValueError, match="Known insecure default SECRET_KEY detected"):
            Settings(
                ENVIRONMENT="staging",
                SECRET_KEY="development_insecure_secret_key_minimum_32_chars_long_12345",
            )

    def test_production_rejects_short_secret_key(self):
        """Verifies that running with ENVIRONMENT=production and a key shorter than 64 characters raises a ValueError."""
        with pytest.raises(ValueError, match="at least 64 characters"):
            Settings(
                ENVIRONMENT="production",
                SECRET_KEY="short_key_under_64_chars",
                CORS_ORIGINS="https://app.skillmantra.edu.in",
            )

    def test_production_rejects_low_diversity_repeated_secret_key(self):
        """
        Verifies that predictable keys with insufficient character diversity (e.g. repeated chars)
        are rejected at startup.
        """
        repeated_key = "a" * 64
        with pytest.raises(ValueError, match="Insufficient character diversity detected"):
            Settings(
                ENVIRONMENT="production",
                SECRET_KEY=repeated_key,
                CORS_ORIGINS="https://app.skillmantra.edu.in",
            )

    def test_production_accepts_strong_random_secret_key(self):
        """
        Verifies that a securely generated random 32-byte (64-hex char) CSPRNG token
        is accepted in production.
        """
        strong_random_key = secrets.token_hex(32)
        s = Settings(
            ENVIRONMENT="production",
            SECRET_KEY=strong_random_key,
            CORS_ORIGINS="https://app.skillmantra.edu.in",
        )
        assert s.is_production is True
        assert s.SECRET_KEY == strong_random_key

    def test_development_mode_allows_dev_key(self):
        """Verifies that non-production (development) allows local test defaults."""
        s = Settings(
            ENVIRONMENT="development",
            SECRET_KEY="development_insecure_secret_key_minimum_32_chars_long_12345",
        )
        assert s.is_production is False
        assert s.SESSION_COOKIE_SECURE is False

    # ==========================================
    # 3. CORS SECURITY & CREDENTIAL HANDLING
    # ==========================================

    @pytest.mark.parametrize("wildcard_cors", ["*", ["*"], "https://app.skillmantra.edu.in,*"])
    def test_cors_rejects_wildcard_origins_when_credentials_enabled(self, wildcard_cors):
        """
        Verifies that wildcard origin '*' is strictly rejected in all environments
        because allow_credentials=True is enabled for session cookies.
        """
        with pytest.raises(ValueError, match="Wildcard origin '\\*' is strictly prohibited when allow_credentials=True"):
            Settings(
                ENVIRONMENT="development",
                CORS_ORIGINS=wildcard_cors,
            )

    def test_production_rejects_localhost_cors_origin(self):
        """Verifies that production forbids localhost or 127.0.0.1 in CORS_ORIGINS."""
        with pytest.raises(ValueError, match="Loopback/localhost origin.*is forbidden in production"):
            Settings(
                ENVIRONMENT="production",
                SECRET_KEY=secrets.token_hex(32),
                CORS_ORIGINS="http://localhost:3000",
            )

    def test_production_rejects_insecure_http_cors_origin(self):
        """Verifies that production requires HTTPS origins and rejects plain HTTP."""
        with pytest.raises(ValueError, match="Insecure or non-HTTPS origin.*forbidden in production"):
            Settings(
                ENVIRONMENT="production",
                SECRET_KEY=secrets.token_hex(32),
                CORS_ORIGINS="http://app.skillmantra.edu.in",
            )

    def test_production_accepts_valid_https_origins(self):
        """Verifies that production accepts valid HTTPS domains."""
        s = Settings(
            ENVIRONMENT="production",
            SECRET_KEY=secrets.token_hex(32),
            CORS_ORIGINS="https://app.skillmantra.edu.in,https://admin.skillmantra.edu.in",
        )
        assert s.cors_origins_list == [
            "https://app.skillmantra.edu.in",
            "https://admin.skillmantra.edu.in",
        ]

    def test_development_accepts_localhost_origins(self):
        """Verifies that development accepts standard localhost origins."""
        s = Settings(
            ENVIRONMENT="development",
            CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000",
        )
        assert "http://localhost:3000" in s.cors_origins_list

    # ==========================================
    # 4. COOKIE SECURITY GATES
    # ==========================================

    def test_production_enforces_secure_cookie(self):
        """
        Verifies that in production mode, SESSION_COOKIE_SECURE is
        automatically enforced to True regardless of incoming flag.
        """
        s = Settings(
            ENVIRONMENT="production",
            SECRET_KEY=secrets.token_hex(32),
            SESSION_COOKIE_SECURE=False,  # Explicitly attempt False
            CORS_ORIGINS="https://app.skillmantra.edu.in",
        )
        assert s.SESSION_COOKIE_SECURE is True, "SESSION_COOKIE_SECURE must be True in production"
