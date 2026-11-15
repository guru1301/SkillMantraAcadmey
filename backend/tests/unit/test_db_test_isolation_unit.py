import pytest
from backend.app.core.database_safety import validate_isolated_test_database_target
from backend.scripts.bootstrap_dev_database import (
    validate_legacy_migration_files,
    EXPECTED_LEGACY_MIGRATIONS,
)
from backend.app.core.config import settings


class TestDatabaseSafetyIsolationUnit:
    """
    Unit Tests: Validates fail-closed test database isolation rules.
    Verifies that dangerous, production, remote cloud (Neon, AWS, Supabase),
    or non-disposable database targets are strictly rejected.
    """

    def test_rejects_empty_url(self):
        is_safe, reason = validate_isolated_test_database_target("", confirmed=True)
        assert is_safe is False
        assert "empty" in reason

    def test_rejects_unconfirmed_execution(self):
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=False)
        assert is_safe is False
        assert "Safety confirmation required" in reason

    def test_rejects_application_database_url(self):
        is_safe, reason = validate_isolated_test_database_target(settings.DATABASE_URL, confirmed=True)
        assert is_safe is False
        assert "matches application settings.DATABASE_URL" in reason

    def test_rejects_neon_cloud_host(self):
        """Verifies that Neon cloud database hosts are strictly rejected (consistent local-only policy)."""
        url = "postgresql+psycopg://user:pass@ep-branch-test-123.us-east-2.aws.neon.tech/test_db"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Remote cloud database host" in reason and "strictly forbidden" in reason

    def test_rejects_aws_cloud_host(self):
        """Verifies that AWS RDS database hosts are strictly rejected."""
        url = "postgresql+psycopg://user:pass@test-instance.c7xyz.us-east-2.rds.amazonaws.com:5432/test_db"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Remote cloud database host" in reason

    def test_rejects_supabase_cloud_host(self):
        """Verifies that Supabase cloud hosts are strictly rejected."""
        url = "postgresql+psycopg://postgres:pass@db.xyz.supabase.co:5432/test_db"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Remote cloud database host" in reason

    def test_rejects_arbitrary_remote_ip_host(self):
        url = "postgresql+psycopg://user:pass@192.168.1.100:5432/skillmantra_test"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "not a local loopback address" in reason or "not in permitted local test hosts" in reason

    def test_rejects_database_without_test_indicator_in_name(self):
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_prod"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "does not contain an approved test indicator" in reason

    def test_accepts_valid_localhost_test_database(self):
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is True
        assert "Safe isolated local test database verified" in reason

    def test_accepts_valid_127_0_0_1_test_database(self):
        url = "postgresql+psycopg://postgres:postgres@127.0.0.1:5433/skillmantra_test"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is True
        assert "Safe isolated local test database verified" in reason

    def test_accepts_valid_ipv6_loopback_test_database(self):
        url = "postgresql+psycopg://postgres:postgres@[::1]:5433/skillmantra_test"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is True
        assert "Safe isolated local test database verified" in reason

    def test_rejects_non_loopback_ipv6_host(self):
        url = "postgresql+psycopg://postgres:postgres@[fe80::1]:5433/skillmantra_test"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "not a local loopback address" in reason

    def test_rejects_non_loopback_ipv4_host(self):
        url = "postgresql+psycopg://postgres:postgres@10.0.0.1:5433/skillmantra_test"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "not a local loopback address" in reason

    def test_rejects_host_query_routing_bypass_to_remote_cloud(self):
        """Verifies rejection when ?host= points to a remote cloud host."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?host=ep-cool-db.neon.tech"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Forbidden cloud domain" in reason or "Remote cloud database host" in reason

    def test_rejects_host_query_routing_bypass_to_remote_ip(self):
        """Verifies rejection when ?host= points to a remote IP address."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?host=198.51.100.1"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "non-loopback IP address" in reason

    def test_accepts_host_query_pointing_to_loopback(self):
        """Verifies acceptance when ?host= explicitly specifies localhost or 127.0.0.1."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?host=127.0.0.1"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is True
        assert "Safe isolated local test database verified" in reason

    def test_rejects_hostaddr_routing_bypass_to_remote_ip(self):
        """Verifies rejection when ?hostaddr= points to a non-loopback IP address."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?hostaddr=198.51.100.1"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "hostaddr '198.51.100.1' is not a local loopback IP address" in reason

    def test_rejects_invalid_hostaddr_ip_syntax(self):
        """Verifies rejection when ?hostaddr= is not a valid IP address."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?hostaddr=invalid_host_ip"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Invalid IP address specified in 'hostaddr'" in reason

    def test_accepts_valid_loopback_hostaddr(self):
        """Verifies acceptance when ?hostaddr= points to 127.0.0.1 loopback."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?hostaddr=127.0.0.1"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is True
        assert "Safe isolated local test database verified" in reason

    def test_rejects_unapproved_routing_parameter_service(self):
        """Verifies rejection when ?service= parameter is supplied."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?service=production_service"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Unapproved connection-routing parameter 'service' is strictly forbidden" in reason

    def test_rejects_unapproved_routing_parameter_endpoint(self):
        """Verifies rejection when ?endpoint= parameter is supplied."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?endpoint=ep-neon-proxy-123"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Unapproved connection-routing parameter 'endpoint' is strictly forbidden" in reason

    def test_rejects_cloud_domain_in_arbitrary_query_parameter(self):
        """Verifies rejection if a cloud domain is embedded inside options or another parameter."""
        url = "postgresql+psycopg://postgres:postgres@localhost:5433/skillmantra_test?options=project%3Dep-xyz.neon.tech"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Forbidden cloud domain 'neon.tech' detected" in reason

    def test_bootstrap_validates_all_16_expected_migration_files_exist(self):
        files = validate_legacy_migration_files()
        assert len(files) == 16
        file_names = [f.name for f in files]
        assert file_names == EXPECTED_LEGACY_MIGRATIONS

    def test_rejects_dbname_query_parameter_pointing_to_production_db(self):
        """Verifies rejection of URL where ?dbname= targets a production database."""
        url = "postgresql://localhost:5432/skillmantra_test?dbname=production_db"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Conflicting database names specified" in reason or "does not contain an approved test indicator" in reason

    def test_rejects_duplicate_port_query_parameters(self):
        """Verifies rejection of URLs with duplicate ?port= query parameters."""
        url = "postgresql://localhost:5432/skillmantra_test?port=5432&port=5433"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Duplicate 'port' query parameters are strictly forbidden" in reason

    def test_rejects_duplicate_dbname_query_parameters(self):
        """Verifies rejection of URLs with duplicate ?dbname= query parameters."""
        url = "postgresql://localhost:5432/skillmantra_test?dbname=test1&dbname=test2"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Duplicate 'dbname' query parameters are strictly forbidden" in reason

    def test_rejects_duplicate_host_query_parameters(self):
        """Verifies rejection of URLs with duplicate ?host= query parameters."""
        url = "postgresql://localhost:5432/skillmantra_test?host=127.0.0.1&host=127.0.0.2"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Duplicate 'host' query parameters are strictly forbidden" in reason

    def test_rejects_duplicate_hostaddr_query_parameters(self):
        """Verifies rejection of URLs with duplicate ?hostaddr= query parameters."""
        url = "postgresql://localhost:5432/skillmantra_test?hostaddr=127.0.0.1&hostaddr=127.0.0.2"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Duplicate 'hostaddr' query parameters are strictly forbidden" in reason

    def test_rejects_unsupported_database_parameter(self):
        """Verifies rejection of unsupported 'database' parameter with descriptive error."""
        url = "postgresql://localhost:5432/skillmantra_test?database=prod"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Unsupported connection parameter 'database' is strictly rejected" in reason

    def test_rejects_conflicting_ports_between_url_and_query(self):
        """Verifies rejection when authority port and query port conflict."""
        url = "postgresql://localhost:5432/skillmantra_test?port=5433"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Conflicting ports specified" in reason

    def test_rejects_conflicting_database_names_between_path_and_query(self):
        """Verifies rejection when URL path db and query dbname conflict."""
        url = "postgresql://localhost:5432/test_one?dbname=test_two"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Conflicting database names specified" in reason

    def test_rejects_out_of_range_port_query(self):
        """Verifies rejection of out-of-range port numbers."""
        url = "postgresql://localhost:5432/skillmantra_test?port=99999"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "out of range" in reason

    def test_rejects_zero_port_query(self):
        url = "postgresql://localhost:5432/skillmantra_test?port=0"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "out of range" in reason

    def test_rejects_empty_database_name_in_query(self):
        url = "postgresql://localhost:5432/?dbname="
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "empty" in reason or "no database name" in reason

    def test_rejects_unapproved_routing_parameter_options(self):
        """Verifies rejection of ?options= routing parameter."""
        url = "postgresql://localhost:5433/skillmantra_test?options=-c%20search_path=public"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is False
        assert "Unapproved connection-routing parameter 'options' is strictly forbidden" in reason

    def test_accepts_valid_dbname_query_parameter_matching_path(self):
        """Verifies acceptance when ?dbname= is consistent with path and points to local test db."""
        url = "postgresql://localhost:5433/skillmantra_test?dbname=skillmantra_test"
        is_safe, reason = validate_isolated_test_database_target(url, confirmed=True)
        assert is_safe is True
        assert "Safe isolated local test database verified" in reason
