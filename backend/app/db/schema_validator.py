"""
PostgreSQL Schema Validator for Skill Mantra Academy / Skill Thinker Platform.

Rigorously verifies the database schema against SQL migrations 001-016:
1. Presence of all 14 legacy tables.
2. Critical columns, data types, and nullable settings (e.g. programs.progress_weights, assessment_submissions.answers).
3. Foreign key referential actions (e.g. batches RESTRICT on college/program, college_users CASCADE).
4. Table check constraints with exact expression verification matching migrations 001-016
   (rejects missing constraints or incorrect expressions, e.g. wrong allowed status values or wrong inequalities).
5. Unwanted constraints verification (e.g. ensuring training_sessions.trainer_id has NO foreign key constraint).

All schema rule violations are treated as MIGRATION-BLOCKING ERRORS.
"""
import re
from typing import Any, Dict, List, Optional, Set
import sqlalchemy as sa
from sqlalchemy.engine import Inspector

REQUIRED_LEGACY_TABLES: Set[str] = {
    "admin_users",
    "colleges",
    "college_users",
    "programs",
    "batches",
    "trainers",
    "training_sessions",
    "batch_trainers",
    "students",
    "batch_students",
    "resources",
    "session_attendance",
    "assessments",
    "assessment_submissions",
}

# Critical columns and expected properties: (expected_type_substring, expected_nullable)
CRITICAL_COLUMN_RULES: Dict[str, Dict[str, tuple[str, bool]]] = {
    "programs": {
        "progress_weights": ("json", True),  # Migration 003: permits NULL
        "duration_days": ("int", False),
        "status": ("varchar", False),
    },
    "batches": {
        "target_strength": ("int", False),
        "code": ("varchar", False),
        "status": ("varchar", False),
    },
    "students": {
        "roll_number": ("varchar", False),
        "password_hash": ("varchar", True),  # Migration 012: permits NULL initially
        "status": ("varchar", False),
    },
    "trainers": {
        "email": ("varchar", True),  # Migration 005: permits NULL
        "password_hash": ("varchar", True),  # Migration 014: permits NULL initially
        "status": ("varchar", False),
    },
    "training_sessions": {
        "trainer_id": ("uuid", True),  # Migration 005: UUID, permits NULL, NO FK
        "status": ("varchar", False),
    },
    "assessments": {
        "questions": ("json", False),  # Migration 015: NOT NULL
        "type": ("varchar", False),
        "status": ("varchar", False),
    },
    "assessment_submissions": {
        "answers": ("json", True),  # Migration 015: permits NULL
        "violations_count": ("int", True),  # Migration 015: permits NULL
        "shuffled_question_order": ("json", True),  # Migration 015: permits NULL
        "status": ("varchar", False),
    },
}

CRITICAL_COLUMN_CHECKS: Dict[str, List[str]] = {
    table: list(rules.keys()) for table, rules in CRITICAL_COLUMN_RULES.items()
}

# Required foreign keys: table -> list of (constrained_col, referred_table, expected_ondelete)
REQUIRED_FOREIGN_KEYS: Dict[str, List[tuple[str, str, str]]] = {
    "batches": [
        ("college_id", "colleges", "RESTRICT"),
        ("program_id", "programs", "RESTRICT"),
    ],
    "college_users": [
        ("college_id", "colleges", "CASCADE"),
    ],
    "students": [
        ("college_id", "colleges", "CASCADE"),
    ],
    "batch_students": [
        ("batch_id", "batches", "CASCADE"),
        ("student_id", "students", "CASCADE"),
    ],
    "session_attendance": [
        ("session_id", "training_sessions", "CASCADE"),
        ("student_id", "students", "CASCADE"),
    ],
    "assessments": [
        ("batch_id", "batches", "CASCADE"),
    ],
    "assessment_submissions": [
        ("assessment_id", "assessments", "CASCADE"),
        ("student_id", "students", "CASCADE"),
    ],
}

# Exact Check Constraint Rules derived from Migrations 001-016
CHECK_CONSTRAINT_RULES: Dict[str, List[Dict[str, Any]]] = {
    "colleges": [
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"active", "inactive"},
            "description": "status IN ('active', 'inactive')",
        },
    ],
    "programs": [
        {
            "column": "duration_days",
            "type": "non_negative",
            "description": "duration_days >= 0",
        },
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"active", "inactive"},
            "description": "status IN ('active', 'inactive')",
        },
    ],
    "batches": [
        {
            "column": "target_strength",
            "type": "non_negative",
            "description": "target_strength >= 0",
        },
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"planned", "active", "completed", "cancelled"},
            "description": "status IN ('planned', 'active', 'completed', 'cancelled')",
        },
        {
            "column": "end_date",
            "type": "date_range",
            "secondary_column": "start_date",
            "description": "end_date >= start_date",
        },
    ],
    "training_sessions": [
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"scheduled", "completed", "cancelled"},
            "description": "status IN ('scheduled', 'completed', 'cancelled')",
        },
    ],
    "resources": [
        {
            "column": "type",
            "type": "enum",
            "expected_values": {"google_drive", "document", "video", "link"},
            "description": "type IN ('google_drive', 'document', 'video', 'link')",
        },
    ],
    "trainers": [
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"active", "inactive"},
            "description": "status IN ('active', 'inactive')",
        },
    ],
    "college_users": [
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"active", "inactive"},
            "description": "status IN ('active', 'inactive')",
        },
    ],
    "session_attendance": [
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"present", "absent", "late", "excused"},
            "description": "status IN ('present', 'absent', 'late', 'excused')",
        },
    ],
    "assessments": [
        {
            "column": "type",
            "type": "enum",
            "expected_values": {"quiz", "assignment", "practical_test"},
            "description": "type IN ('quiz', 'assignment', 'practical_test')",
        },
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"draft", "published", "closed"},
            "description": "status IN ('draft', 'published', 'closed')",
        },
    ],
    "assessment_submissions": [
        {
            "column": "status",
            "type": "enum",
            "expected_values": {"not_started", "in_progress", "submitted", "evaluated", "overdue"},
            "description": "status IN ('not_started', 'in_progress', 'submitted', 'evaluated', 'overdue')",
        },
    ],
}

# Backward compatible mapping
REQUIRED_CHECK_CONSTRAINTS: Dict[str, List[str]] = {
    table: [rule["column"] for rule in rules]
    for table, rules in CHECK_CONSTRAINT_RULES.items()
}


def strip_matching_outer_parens(s: str) -> str:
    """
    Strips matching balanced outer parentheses from an expression.
    e.g. '(((x >= 0)))' -> 'x >= 0'
    Leaves unbalanced or compound outer parentheses untouched:
    e.g. '(x >= 0) OR (y >= 0)' -> '(x >= 0) OR (y >= 0)'
    """
    s = s.strip()
    while s.startswith("(") and s.endswith(")"):
        depth = 0
        matched = False
        for i, ch in enumerate(s):
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    matched = (i == len(s) - 1)
                    break
        if matched:
            s = s[1:-1].strip()
        else:
            break
    return s


def strip_string_literals(sql: str) -> str:
    """
    Replaces all single-quoted string literals with empty single quotes ''
    so keywords inside string literals (e.g. 'not_started') are not mistaken
    for logical operators.
    """
    return re.sub(r"'(?:[^']|'')*'", "''", sql)


def has_forbidden_logical_operators(sql: str) -> bool:
    """
    Verifies that the constraint expression does not contain weakening or
    compound logical operators (OR, NOT, AND, XOR, !) outside of string literals.
    All required check constraints from migrations 001-016 are atomic single predicates.
    """
    stripped = strip_string_literals(sql)
    if re.search(r'\b(OR|NOT|AND|XOR)\b', stripped, re.IGNORECASE):
        return True
    if '!' in stripped:
        return True
    return False


ENUM_ELEMENT_PATTERN = re.compile(
    r'^\s*\(?\s*\'([^\']+)\'\s*(?:::[\w\s]+(?:\([0-9]+\))?)?\s*\)?(?:::[\w\s]+(?:\([0-9]+\))?)?\s*$',
    re.IGNORECASE
)


def split_sql_elements(s: str) -> List[str]:
    """
    Splits a comma-separated list of SQL elements respecting single quotes.
    """
    elements = []
    current = []
    in_quote = False
    for ch in s:
        if ch == "'":
            in_quote = not in_quote
            current.append(ch)
        elif ch == "," and not in_quote:
            elements.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    if current:
        elements.append("".join(current).strip())
    return [e for e in elements if e]


def validate_enum_elements(elements_str: str, expected_values: Set[str]) -> tuple[bool, str]:
    """
    Rigorously validates every element inside an IN (...) or ARRAY[...] list:
    1. Every element must be a valid single-quoted string literal (with optional permitted PostgreSQL type cast).
    2. Strictly rejects NULL, non-string expressions, numbers, subqueries, operators, and CASE statements.
    3. Strictly rejects duplicate values.
    4. Verifies that the extracted array values exactly match the expected set.
    """
    raw_elements = split_sql_elements(elements_str)
    if not raw_elements:
        return False, "Empty array elements list"

    extracted: List[str] = []
    for elem in raw_elements:
        if elem.strip().upper() == "NULL":
            return False, f"NULL element is strictly forbidden in enum list: {elem}"
        match = ENUM_ELEMENT_PATTERN.match(elem)
        if not match:
            return False, f"Invalid element expression in enum list: {elem}"
        extracted.append(match.group(1))

    # Reject duplicate elements
    if len(extracted) != len(set(extracted)):
        return False, f"Duplicate elements detected in enum list: {extracted}"

    # Verify exact match against expected values
    if set(extracted) != expected_values:
        return False, f"Enum elements mismatch: got {set(extracted)}, expected {expected_values}"

    return True, "Valid"


def validate_check_constraint_expression(
    rule: Dict[str, Any],
    existing_checks: List[Dict[str, Any]],
) -> tuple[bool, str, Optional[str]]:
    """
    Validates that a table's existing check constraints contain a constraint
    matching the expected rule and that its expression is complete and correct.
    Rejects any weakening logic (e.g. 'OR TRUE', 'OR status IS NULL', negation).
    Validates every element in PostgreSQL ARRAY expressions (rejects NULL, CASE, numbers, extra items, duplicates).
    Supports legitimate PostgreSQL expression normalization (e.g. ARRAY casts, ANY constructs,
    and parenthesized inequalities).

    Returns: (is_valid, status, detail_message)
    where status is 'valid', 'incorrect', or 'missing'.
    """
    col = rule["column"]
    rule_type = rule["type"]
    desc = rule["description"]

    # Filter candidate checks that reference this column (in sqltext or constraint name)
    col_pattern = r'\b"?' + re.escape(col) + r'"?\b'
    candidates: List[Dict[str, Any]] = []
    for ck in existing_checks:
        sqltext = str(ck.get("sqltext") or "")
        name = str(ck.get("name") or "").lower()
        if re.search(col_pattern, sqltext, re.IGNORECASE) or (col.lower() in name):
            candidates.append(ck)

    if not candidates:
        return False, "missing", f"Missing required check constraint for '{desc}'"

    # Evaluate candidate expressions against the rule
    candidate_expressions: List[str] = []
    for ck in candidates:
        sqltext = str(ck.get("sqltext") or "").strip()
        candidate_expressions.append(sqltext)

        # 1. Reject any expression containing weakening logical operators (OR, NOT, AND, !)
        if has_forbidden_logical_operators(sqltext):
            continue

        cleaned = strip_matching_outer_parens(sqltext)

        if rule_type == "enum":
            col_esc = re.escape(col)
            # Pattern A: Standard SQL: col IN ('a', 'b')
            p_in = re.compile(
                r'^\s*\(?\s*\"?' + col_esc + r'\"?\s*\)?(?:::[\w\s]+)?\s+IN\s*\(\s*(?P<elements>[\s\S]*?)\s*\)\s*$',
                re.IGNORECASE
            )
            # Pattern B: PostgreSQL normalized: (col)::text = ANY ((ARRAY['a'::varchar, 'b'::varchar])::text[])
            p_any = re.compile(
                r'^\s*\(?\s*\"?' + col_esc + r'\"?\s*\)?(?:::[\w\s]+)?\s*=\s*ANY\s*\(\s*\(?\s*ARRAY\s*\[(?P<elements>[\s\S]*?)\]\s*\)?(?:::[\w\s\[\]]+)?\s*\)\s*$',
                re.IGNORECASE
            )

            m_in = p_in.match(cleaned)
            m_any = p_any.match(cleaned)

            if m_in:
                elements_str = m_in.group("elements")
            elif m_any:
                elements_str = m_any.group("elements")
            else:
                continue

            # Validate every individual element inside the IN / ARRAY construct
            is_valid_elems, _ = validate_enum_elements(elements_str, rule["expected_values"])
            if is_valid_elems:
                return True, "valid", sqltext

        elif rule_type == "non_negative":
            col_esc = re.escape(col)
            # Accept col >= 0 or 0 <= col (anchored to entire expression)
            p1 = re.compile(
                r'^\s*\(?\s*\"?' + col_esc + r'\"?\s*\)?(?:::[\w\s]+)?\s*>=\s*\(?\s*0\s*\)?(?:::[\w\s]+)?\s*$',
                re.IGNORECASE
            )
            p2 = re.compile(
                r'^\s*\(?\s*0\s*\)?(?:::[\w\s]+)?\s*<=\s*\(?\s*\"?' + col_esc + r'\"?\s*\)?(?:::[\w\s]+)?\s*$',
                re.IGNORECASE
            )
            if p1.match(cleaned) or p2.match(cleaned):
                return True, "valid", sqltext

        elif rule_type == "date_range":
            c1 = re.escape(rule["column"])
            c2 = re.escape(rule["secondary_column"])
            # Accept end_date >= start_date or start_date <= end_date (anchored to entire expression)
            p1 = re.compile(
                r'^\s*\(?\s*\"?' + c1 + r'\"?\s*\)?(?:::[\w\s]+)?\s*>=\s*\(?\s*\"?' + c2 + r'\"?\s*\)?(?:::[\w\s]+)?\s*$',
                re.IGNORECASE
            )
            p2 = re.compile(
                r'^\s*\(?\s*\"?' + c2 + r'\"?\s*\)?(?:::[\w\s]+)?\s*<=\s*\(?\s*\"?' + c1 + r'\"?\s*\)?(?:::[\w\s]+)?\s*$',
                re.IGNORECASE
            )
            if p1.match(cleaned) or p2.match(cleaned):
                return True, "valid", sqltext

    # Candidate check was found referencing the column, but its expression is incorrect or weakened
    actual_expr = candidate_expressions[0] if candidate_expressions else "unknown"
    return False, "incorrect", f"Incorrect check constraint expression for '{desc}': got '{actual_expr}'"


def verify_database_schema(inspector: Inspector) -> Dict[str, Any]:
    """
    Rigorously verifies that the database matches the expected legacy baseline.
    Returns a dictionary with 'valid': bool and 'errors': list[str].
    Every discrepancy is treated as a blocking error (no downgraded warnings).
    """
    errors: List[str] = []

    # 1. Table presence verification
    existing_tables = set(inspector.get_table_names())
    missing_tables = REQUIRED_LEGACY_TABLES - existing_tables
    if missing_tables:
        errors.append(f"Missing required legacy table(s): {', '.join(sorted(missing_tables))}")
        # If core tables are missing, cannot perform dependent column/FK checks
        return {"valid": False, "errors": errors}

    # 2. Critical column types and nullability verification
    for table_name, col_rules in CRITICAL_COLUMN_RULES.items():
        columns = {c["name"]: c for c in inspector.get_columns(table_name)}
        for col_name, (expected_type_sub, expected_nullable) in col_rules.items():
            if col_name not in columns:
                errors.append(f"Table '{table_name}' is missing critical column '{col_name}'")
                continue

            col_info = columns[col_name]
            col_type_str = str(col_info.get("type", "")).lower()
            col_nullable = col_info.get("nullable", True)

            # Check type substring match (e.g. json in jsonb, int in integer)
            if expected_type_sub not in col_type_str:
                errors.append(
                    f"Column '{table_name}.{col_name}' type mismatch: "
                    f"got '{col_type_str}', expected '{expected_type_sub}'"
                )

            # Check nullability
            if col_nullable != expected_nullable:
                errors.append(
                    f"Column '{table_name}.{col_name}' nullability mismatch: "
                    f"got nullable={col_nullable}, expected nullable={expected_nullable}"
                )

    # 3. Foreign key referential actions verification
    for table_name, expected_fks in REQUIRED_FOREIGN_KEYS.items():
        fks = inspector.get_foreign_keys(table_name)
        fk_by_col: Dict[str, Dict[str, Any]] = {}
        for fk in fks:
            cols = fk.get("constrained_columns", [])
            if cols:
                fk_by_col[cols[0]] = fk

        for col_name, ref_table, expected_ondelete in expected_fks:
            if col_name not in fk_by_col:
                errors.append(
                    f"Table '{table_name}' is missing required foreign key on column '{col_name}' "
                    f"referencing '{ref_table}'"
                )
                continue

            fk_data = fk_by_col[col_name]
            referred_table = fk_data.get("referred_table")
            actual_ondelete = (fk_data.get("options", {}).get("ondelete") or "").upper()

            if referred_table != ref_table:
                errors.append(
                    f"Foreign key '{table_name}.{col_name}' targets '{referred_table}', "
                    f"expected '{ref_table}'"
                )

            if actual_ondelete != expected_ondelete:
                errors.append(
                    f"Foreign key '{table_name}.{col_name}' ondelete action is '{actual_ondelete}', "
                    f"expected '{expected_ondelete}'"
                )

    # 4. Critical verification: training_sessions.trainer_id must have NO foreign key constraint
    # (Migration 005 explicitly defined trainer_id UUID without REFERENCES trainers(id))
    ts_fks = [
        fk for fk in inspector.get_foreign_keys("training_sessions")
        if "trainer_id" in fk.get("constrained_columns", [])
    ]
    if ts_fks:
        errors.append(
            "training_sessions.trainer_id has a foreign key constraint referencing trainers. "
            "This violates Migration 005 (trainer_id must be a bare UUID column without FK constraint)."
        )

    # 5. Check constraints verification: compare actual expressions against migrations 001-016
    for table_name, rules in CHECK_CONSTRAINT_RULES.items():
        existing_checks = inspector.get_check_constraints(table_name)
        for rule in rules:
            is_valid, status, detail = validate_check_constraint_expression(rule, existing_checks)
            if not is_valid:
                errors.append(f"Table '{table_name}': {detail}")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
    }


def assert_full_baseline_integrity(inspector: Inspector) -> None:
    """
    Enforces that baseline schema passes validation. Raises RuntimeError on failure.
    """
    result = verify_database_schema(inspector)
    if not result["valid"]:
        error_summary = "\n".join(f"  - {err}" for err in result["errors"])
        raise RuntimeError(
            f"Alembic Baseline Integrity Guard Failed with {len(result['errors'])} error(s):\n"
            f"{error_summary}\n\n"
            "Target database does not satisfy required 14-table legacy baseline schema. Migration aborted."
        )
