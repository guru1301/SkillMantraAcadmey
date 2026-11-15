"""
Database Safety Validator.

Enforces strict fail-closed isolation rules for mutating test and bootstrap operations:
1. Local-Only Host Policy: Strictly permits localhost, 127.0.0.1, ::1, or approved local test containers.
2. Cloud Rejection: Strictly rejects Neon, AWS, Supabase, CockroachDB, and all remote cloud hosts across
   hosts, hostaddrs, parameter keys, and parameter values.
3. Connection-Routing Protection: Strictly blocks unapproved routing parameters (service, endpoint, passfile, options),
   validates effective destination when host/hostaddr are overridden in query strings, and enforces loopback.
4. Parameter Ambiguity & Duplicate Protection: Rejects duplicate security-sensitive query parameters (port, dbname, host, hostaddr),
   rejects conflicting URL-path vs query-string destinations, and rejects unsupported parameters like 'database'.
5. Driver Synchronization: Verifies the effective connection destination interpreted by Psycopg 3 / libpq
   (psycopg.conninfo.conninfo_to_dict) matches the validated parameters exactly.
6. Anti-Collision: Compares effective target host, port, and database name against application settings.
7. Database Name Whitelist: Requires database name to contain 'test', 'temp', or 'isolated'.
8. Mandatory Confirmation: Requires explicit operator confirmation flag.
"""
import ipaddress
import os
from urllib.parse import parse_qs, unquote, urlparse
import psycopg.conninfo

from backend.app.core.config import settings

PERMITTED_LOCAL_TEST_HOSTS = {
    "localhost",
    "127.0.0.1",
    "::1",
    "test-postgres",
    "postgres-test",
    "pg-test",
}

FORBIDDEN_CLOUD_DOMAINS = {
    "neon.tech",
    "aws.",
    "amazonaws.com",
    "supabase.co",
    "cockroachlabs.cloud",
}

# Parameters that can redirect or reroute the connection to unapproved or remote destinations
UNAPPROVED_ROUTING_PARAMETERS = {
    "service",
    "endpoint",
    "target_session_attrs",
    "passfile",
    "options",
    "channel_binding",
}

# Security-sensitive query parameters where duplicates cause ambiguity or driver divergence
DISALLOWED_DUPLICATE_PARAMS = {
    "dbname",
    "host",
    "hostaddr",
    "port",
    "user",
    "password",
    "database",
}


def are_equivalent_hosts(h1: str, h2: str) -> bool:
    """
    Compares two host strings, treating canonical loopback aliases (localhost, 127.0.0.1, ::1)
    as equivalent to prevent anti-collision evasion.
    """
    h1_clean = h1.lower().strip("[]")
    h2_clean = h2.lower().strip("[]")
    if h1_clean == h2_clean:
        return True
    loopbacks = {"localhost", "127.0.0.1", "::1"}
    if h1_clean in loopbacks and h2_clean in loopbacks:
        return True
    return False


def extract_canonical_connection_target(url_str: str) -> tuple[str, int, str]:
    """
    Extracts the canonical (host, port, dbname) from a PostgreSQL connection string,
    taking into account query parameter overrides (e.g. ?dbname=, ?host=, ?port=).
    """
    clean_url = url_str.strip()
    if clean_url.startswith("postgresql+"):
        clean_url = "postgresql" + clean_url[clean_url.index("://"):]
    try:
        conn_dict = psycopg.conninfo.conninfo_to_dict(clean_url)
        c_host = (conn_dict.get("host") or "").lower().strip("[]")
        c_port = int(conn_dict["port"]) if conn_dict.get("port") else 5432
        c_db = (conn_dict.get("dbname") or "").lower()
        return c_host, c_port, c_db
    except Exception:
        parsed = urlparse(clean_url)
        q_params = parse_qs(parsed.query, keep_blank_values=True)
        c_host = (parsed.hostname or "").lower().strip("[]")
        c_port = parsed.port or 5432
        if "port" in q_params and q_params["port"]:
            try:
                c_port = int(q_params["port"][-1])
            except ValueError:
                pass
        c_db = (parsed.path.lstrip("/") or "").lower()
        if "dbname" in q_params and q_params["dbname"]:
            c_db = q_params["dbname"][-1].lower()
        return c_host, c_port, c_db


def validate_isolated_test_database_target(url: str, confirmed: bool) -> tuple[bool, str]:
    """
    Fail-closed validator for target test/bootstrap database:
    Returns (True, message) if the target is verified safe, local, and isolated.
    Returns (False, reason) if the target violates any safety rule, parameter constraint,
    or connection routing policy.
    """
    if not url or not url.strip():
        return False, "Target database URL is empty."

    if not confirmed:
        return False, (
            "Safety confirmation required: Pass --confirm-isolated-database or set "
            "CONFIRM_ISOLATED_TEST_DATABASE=1 to confirm the target database is disposable."
        )

    cleaned_url = url.strip()

    # 1. Exact string match against settings or environment DATABASE_URL
    if cleaned_url == settings.DATABASE_URL.strip():
        return False, "Target database URL matches application settings.DATABASE_URL."

    env_db = os.environ.get("DATABASE_URL")
    if env_db and cleaned_url == env_db.strip():
        return False, "Target database URL matches environment variable DATABASE_URL."

    # 2. Parse target URL
    try:
        parsed = urlparse(cleaned_url)
    except Exception as exc:
        return False, f"Malformed database URL: {exc}"

    # 3. Query Parameter Security Analysis
    query_params = parse_qs(parsed.query, keep_blank_values=True)

    # 3a. Rejection of duplicate security-sensitive query parameters
    for param in DISALLOWED_DUPLICATE_PARAMS:
        if param in query_params and len(query_params[param]) > 1:
            return False, (
                f"Duplicate '{param}' query parameters are strictly forbidden: {query_params[param]}. "
                "Parameter ambiguity in connection strings is rejected for safety."
            )

    # 3b. Scan ALL query parameter values and keys for forbidden cloud domains FIRST (Cloud Rejection Priority)
    for key, values in query_params.items():
        key_lower = unquote(key).lower()
        for cloud_domain in FORBIDDEN_CLOUD_DOMAINS:
            if cloud_domain in key_lower:
                return False, f"Forbidden cloud domain '{cloud_domain}' detected in parameter key '{key}'."
        for val in values:
            val_lower = unquote(val).lower()
            for cloud_domain in FORBIDDEN_CLOUD_DOMAINS:
                if cloud_domain in val_lower:
                    return False, (
                        f"Forbidden cloud domain '{cloud_domain}' detected in connection parameter '{key}'. "
                        "Cloud database redirection is strictly forbidden."
                    )

    # 3c. Rejection of unsupported parameters ('database') with descriptive error
    if "database" in query_params:
        return False, (
            "Unsupported connection parameter 'database' is strictly rejected. "
            "PostgreSQL libpq requires 'dbname' or specifying the database name in the URL path."
        )

    # 3d. Rejection of unapproved routing parameters (service, endpoint, target_session_attrs, passfile, options)
    for param in UNAPPROVED_ROUTING_PARAMETERS:
        if param in query_params:
            return False, (
                f"Unapproved connection-routing parameter '{param}' is strictly forbidden. "
                "Parameters that redirect, configure search paths, or alter connection destinations "
                "cannot be used for test databases."
            )

    # 4. Host & Routing Validation
    raw_hostname = (parsed.hostname or "").lower()
    clean_hostname = raw_hostname.strip("[]")
    if not clean_hostname:
        return False, "Database URL has no hostname."

    query_host = None
    if "host" in query_params:
        val = query_params["host"][0].strip().lower().strip("[]")
        if not val:
            return False, "Host specified in 'host' query parameter is empty."
        query_host = val

    query_hostaddr = None
    if "hostaddr" in query_params:
        val = query_params["hostaddr"][0].strip().strip("[]")
        if not val:
            return False, "Host address specified in 'hostaddr' query parameter is empty."
        query_hostaddr = val

    # Scan all host candidates for forbidden cloud domains
    for candidate_host in (clean_hostname, query_host, query_hostaddr):
        if not candidate_host:
            continue
        for cloud_domain in FORBIDDEN_CLOUD_DOMAINS:
            if cloud_domain in candidate_host:
                return False, (
                    f"Remote cloud database host '{candidate_host}' is strictly forbidden for mutating "
                    "test/bootstrap operations. Cloud databases (including Neon) cannot be targeted."
                )

    # Validate loopback / permitted local policy on query_hostaddr if supplied
    if query_hostaddr:
        try:
            ip_obj = ipaddress.ip_address(query_hostaddr)
            if not ip_obj.is_loopback:
                return False, (
                    f"hostaddr '{query_hostaddr}' is not a local loopback IP address. "
                    "Redirecting test connections to remote IP addresses is strictly forbidden."
                )
        except ValueError:
            return False, f"Invalid IP address specified in 'hostaddr' routing parameter: '{query_hostaddr}'."

    # Validate loopback / permitted local policy on query_host if supplied
    if query_host:
        try:
            ip_obj = ipaddress.ip_address(query_host)
            if not ip_obj.is_loopback:
                return False, (
                    f"Query parameter 'host' specifies non-loopback IP address '{query_host}'. "
                    "Only local loopback addresses (127.0.0.1, ::1) or permitted local test hosts are allowed."
                )
        except ValueError:
            if query_host not in PERMITTED_LOCAL_TEST_HOSTS:
                return False, (
                    f"Query parameter 'host' specifies '{query_host}', which is not in permitted local test hosts "
                    f"policy ({', '.join(sorted(PERMITTED_LOCAL_TEST_HOSTS))})."
                )

    # Reject conflicting host specifications
    if clean_hostname and query_host and clean_hostname != query_host and not are_equivalent_hosts(clean_hostname, query_host):
        return False, (
            f"Conflicting host definitions: URL host is '{clean_hostname}' while "
            f"query parameter 'host' specifies '{query_host}'."
        )

    effective_host = query_hostaddr or query_host or clean_hostname

    # Validate base hostname
    is_valid_loopback_ip = False
    try:
        ip_obj = ipaddress.ip_address(clean_hostname)
        if ip_obj.is_loopback:
            is_valid_loopback_ip = True
        else:
            return False, (
                f"Host IP '{clean_hostname}' is not a local loopback address. "
                "Only local loopback addresses (127.0.0.1, ::1) or permitted local test hosts are allowed."
            )
    except ValueError:
        pass

    if not is_valid_loopback_ip and clean_hostname not in PERMITTED_LOCAL_TEST_HOSTS:
        return False, (
            f"Host '{clean_hostname}' is not in permitted local test hosts policy ({', '.join(sorted(PERMITTED_LOCAL_TEST_HOSTS))}). "
            "Only dedicated local disposable PostgreSQL instances can be targeted."
        )

    # 5. Database Name Extraction & Conflict Validation
    path_dbname = parsed.path.lstrip("/").strip()
    query_dbname = None
    if "dbname" in query_params:
        raw_val = query_params["dbname"][0].strip()
        if not raw_val:
            return False, "Database name specified in 'dbname' query parameter is empty."
        query_dbname = raw_val

    if not path_dbname and not query_dbname:
        return False, "Database URL has no database name."

    # Reject conflicting database names between URL path and dbname query parameter
    if path_dbname and query_dbname and path_dbname.lower() != query_dbname.lower():
        return False, (
            f"Conflicting database names specified: URL path specifies '{path_dbname}' while "
            f"query parameter 'dbname' specifies '{query_dbname}'. Ambiguous database targets are strictly rejected."
        )

    effective_dbname = (query_dbname or path_dbname).lower()

    # Database name whitelist: must contain test, temp, or isolated
    allowed_indicators = ("test", "temp", "isolated")
    if not any(ind in effective_dbname for ind in allowed_indicators):
        return False, (
            f"Database name '{effective_dbname}' does not contain an approved test indicator ({', '.join(allowed_indicators)})."
        )

    # 6. Port Validation
    url_port = parsed.port
    query_port = None
    if "port" in query_params:
        port_str = query_params["port"][0].strip()
        try:
            query_port = int(port_str)
        except ValueError:
            return False, f"Invalid port specified in connection query parameters: '{port_str}'."
        if query_port <= 0 or query_port > 65535:
            return False, f"Port '{query_port}' specified in query parameter is out of range (1-65535)."

    if url_port is not None and (url_port <= 0 or url_port > 65535):
        return False, f"Port '{url_port}' specified in URL is out of range (1-65535)."

    # Reject conflicting ports between URL authority and port query parameter
    if url_port is not None and query_port is not None and url_port != query_port:
        return False, (
            f"Conflicting ports specified: URL authority specifies port {url_port} while "
            f"query parameter 'port' specifies {query_port}."
        )

    effective_port = query_port if query_port is not None else (url_port if url_port is not None else 5432)

    # 7. Driver Synchronization & Verification using Psycopg 3 / libpq
    # Standardize connection scheme to postgresql:// for conninfo_to_dict
    std_url = cleaned_url
    if std_url.startswith("postgresql+"):
        std_url = "postgresql" + std_url[std_url.index("://"):]

    try:
        conn_dict = psycopg.conninfo.conninfo_to_dict(std_url)
    except Exception as exc:
        return False, f"Driver connection string validation failed: {exc}"

    driver_dbname = (conn_dict.get("dbname") or "").lower()
    driver_host = (conn_dict.get("host") or "").lower().strip("[]")
    driver_port = int(conn_dict["port"]) if conn_dict.get("port") else 5432

    # Verify driver-parsed database name matches validated effective database name
    if driver_dbname != effective_dbname:
        return False, (
            f"Driver database destination mismatch: validator resolved '{effective_dbname}', "
            f"but Psycopg driver resolved '{driver_dbname}'."
        )

    if not any(ind in driver_dbname for ind in allowed_indicators):
        return False, (
            f"Driver-resolved database '{driver_dbname}' does not contain an approved test indicator ({', '.join(allowed_indicators)})."
        )

    # Verify driver-parsed port matches validated effective port
    if driver_port != effective_port:
        return False, (
            f"Driver port mismatch: validator resolved {effective_port}, "
            f"but Psycopg driver resolved {driver_port}."
        )

    # Verify driver-parsed host matches validated effective host
    if driver_host and not are_equivalent_hosts(driver_host, effective_host):
        return False, (
            f"Driver host mismatch: validator resolved '{effective_host}', "
            f"but Psycopg driver resolved '{driver_host}'."
        )

    # 8. Canonical Anti-Collision Check against settings.DATABASE_URL and env DATABASE_URL
    for ref_url in (settings.DATABASE_URL, env_db):
        if not ref_url:
            continue
        try:
            ref_host, ref_port, ref_dbname = extract_canonical_connection_target(ref_url)
            if are_equivalent_hosts(effective_host, ref_host) and effective_port == ref_port and effective_dbname == ref_dbname:
                return False, (
                    f"Target database canonical resolution ({effective_host}:{effective_port}/{effective_dbname}) "
                    "matches configured application database."
                )
        except Exception:
            pass

    return True, "Safe isolated local test database verified."
