from unittest.mock import MagicMock
import pytest
from backend.app.db.schema_validator import (
    verify_database_schema,
    assert_full_baseline_integrity,
    validate_check_constraint_expression,
    REQUIRED_LEGACY_TABLES,
    CRITICAL_COLUMN_RULES,
    REQUIRED_FOREIGN_KEYS,
    CHECK_CONSTRAINT_RULES,
)


def build_mock_valid_inspector():
    """
    Builds a mock SQLAlchemy Inspector representing a 100% valid schema matching
    all specifications from SQL migrations 001-016.
    """
    inspector = MagicMock()
    inspector.get_table_names.return_value = list(REQUIRED_LEGACY_TABLES)

    def mock_get_columns(table_name):
        rules = CRITICAL_COLUMN_RULES.get(table_name, {})
        cols = []
        for col_name, (expected_type, expected_nullable) in rules.items():
            cols.append({
                "name": col_name,
                "type": f"{expected_type}b" if expected_type == "json" else expected_type,
                "nullable": expected_nullable,
            })
        # Add primary key id column
        if not any(c["name"] == "id" for c in cols):
            cols.append({"name": "id", "type": "uuid", "nullable": False})
        return cols

    inspector.get_columns.side_effect = mock_get_columns

    def mock_get_foreign_keys(table_name):
        fks = []
        if table_name in REQUIRED_FOREIGN_KEYS:
            for col_name, ref_table, ondelete in REQUIRED_FOREIGN_KEYS[table_name]:
                fks.append({
                    "constrained_columns": [col_name],
                    "referred_table": ref_table,
                    "referred_columns": ["id"],
                    "options": {"ondelete": ondelete},
                })
        return fks

    inspector.get_foreign_keys.side_effect = mock_get_foreign_keys

    def mock_get_check_constraints(table_name):
        # Definitions exactly matching legacy migrations 001-016
        if table_name == "colleges":
            return [{"name": "chk_college_status", "sqltext": "status IN ('active', 'inactive')"}]
        if table_name == "programs":
            return [
                {"name": "programs_duration_days_check", "sqltext": "duration_days >= 0"},
                {"name": "chk_program_status", "sqltext": "status IN ('active', 'inactive')"},
            ]
        if table_name == "batches":
            return [
                {"name": "batches_target_strength_check", "sqltext": "target_strength >= 0"},
                {"name": "chk_batch_status", "sqltext": "status IN ('planned', 'active', 'completed', 'cancelled')"},
                {"name": "chk_batch_dates", "sqltext": "end_date >= start_date"},
            ]
        if table_name == "training_sessions":
            return [{"name": "chk_session_status", "sqltext": "status IN ('scheduled', 'completed', 'cancelled')"}]
        if table_name == "resources":
            return [{"name": "chk_resource_type", "sqltext": "type IN ('google_drive', 'document', 'video', 'link')"}]
        if table_name == "trainers":
            return [{"name": "chk_trainer_status", "sqltext": "status IN ('active', 'inactive')"}]
        if table_name == "college_users":
            return [{"name": "chk_college_user_status", "sqltext": "status IN ('active', 'inactive')"}]
        if table_name == "session_attendance":
            return [{"name": "session_attendance_status_check", "sqltext": "status IN ('present', 'absent', 'late', 'excused')"}]
        if table_name == "assessments":
            return [
                {"name": "assessments_type_check", "sqltext": "type IN ('quiz', 'assignment', 'practical_test')"},
                {"name": "assessments_status_check", "sqltext": "status IN ('draft', 'published', 'closed')"},
            ]
        if table_name == "assessment_submissions":
            return [{"name": "assessment_submissions_status_check", "sqltext": "status IN ('not_started', 'in_progress', 'submitted', 'evaluated', 'overdue')"}]
        return []

    inspector.get_check_constraints.side_effect = mock_get_check_constraints
    return inspector


class TestSchemaValidatorUnit:
    """
    Unit Tests: Validates rigorous schema validation against migrations 001-016.
    Ensures that any discrepancy in tables, critical columns, nullability,
    foreign key actions, or check constraints is treated as a blocking error.
    """

    def test_schema_validator_passes_on_valid_schema(self):
        inspector = build_mock_valid_inspector()
        result = verify_database_schema(inspector)
        assert result["valid"] is True
        assert len(result["errors"]) == 0
        assert_full_baseline_integrity(inspector)

    def test_schema_validator_passes_on_postgresql_normalized_expressions(self):
        """Verifies that schema validator accepts PostgreSQL's internally normalized check expressions."""
        inspector = build_mock_valid_inspector()

        def normalized_checks(table_name):
            if table_name == "colleges":
                return [{
                    "name": "chk_college_status",
                    "sqltext": "((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[]))"
                }]
            if table_name == "batches":
                return [
                    {"name": "batches_target_strength_check", "sqltext": "(0 <= target_strength)"},
                    {
                        "name": "chk_batch_status",
                        "sqltext": "((status)::text = ANY (ARRAY['planned'::text, 'active'::text, 'completed'::text, 'cancelled'::text]))"
                    },
                    {"name": "chk_batch_dates", "sqltext": "(start_date <= end_date)"},
                ]
            return build_mock_valid_inspector().get_check_constraints(table_name)

        inspector.get_check_constraints.side_effect = normalized_checks
        result = verify_database_schema(inspector)
        assert result["valid"] is True
        assert len(result["errors"]) == 0

    def test_schema_validator_blocks_missing_legacy_table(self):
        inspector = build_mock_valid_inspector()
        tables = list(REQUIRED_LEGACY_TABLES - {"assessments"})
        inspector.get_table_names.return_value = tables

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Missing required legacy table(s): assessments" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Missing required legacy table"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_missing_foreign_key(self):
        inspector = build_mock_valid_inspector()
        inspector.get_foreign_keys.side_effect = lambda t: [] if t == "batches" else build_mock_valid_inspector().get_foreign_keys(t)

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("missing required foreign key on column 'college_id'" in err for err in result["errors"])
        assert any("missing required foreign key on column 'program_id'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="missing required foreign key"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_incorrect_foreign_key_action(self):
        inspector = build_mock_valid_inspector()
        def mock_fks(t):
            if t == "batches":
                return [
                    {"constrained_columns": ["college_id"], "referred_table": "colleges", "options": {"ondelete": "CASCADE"}},
                    {"constrained_columns": ["program_id"], "referred_table": "programs", "options": {"ondelete": "RESTRICT"}},
                ]
            return build_mock_valid_inspector().get_foreign_keys(t)

        inspector.get_foreign_keys.side_effect = mock_fks

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("ondelete action is 'CASCADE', expected 'RESTRICT'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="expected 'RESTRICT'"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_unexpected_fk_on_trainer_id(self):
        inspector = build_mock_valid_inspector()
        def mock_fks(t):
            if t == "training_sessions":
                return [{"constrained_columns": ["trainer_id"], "referred_table": "trainers", "options": {"ondelete": "CASCADE"}}]
            return build_mock_valid_inspector().get_foreign_keys(t)

        inspector.get_foreign_keys.side_effect = mock_fks

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("training_sessions.trainer_id has a foreign key constraint referencing trainers" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="violates Migration 005"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_missing_critical_column(self):
        inspector = build_mock_valid_inspector()
        original_cols = inspector.get_columns("programs")
        inspector.get_columns.side_effect = lambda t: [c for c in original_cols if c["name"] != "progress_weights"] if t == "programs" else build_mock_valid_inspector().get_columns(t)

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("missing critical column 'progress_weights'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="missing critical column 'progress_weights'"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_column_nullability_mismatch(self):
        inspector = build_mock_valid_inspector()
        def mock_cols(t):
            cols = build_mock_valid_inspector().get_columns(t)
            if t == "programs":
                for c in cols:
                    if c["name"] == "progress_weights":
                        c["nullable"] = False
            return cols

        inspector.get_columns.side_effect = mock_cols

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("nullability mismatch" in err and "progress_weights" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="nullability mismatch"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_column_type_mismatch(self):
        inspector = build_mock_valid_inspector()
        def mock_cols(t):
            cols = build_mock_valid_inspector().get_columns(t)
            if t == "assessment_submissions":
                for c in cols:
                    if c["name"] == "violations_count":
                        c["type"] = "varchar(50)"
            return cols

        inspector.get_columns.side_effect = mock_cols

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("type mismatch" in err and "violations_count" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="type mismatch"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_missing_check_constraint(self):
        inspector = build_mock_valid_inspector()
        # Remove target_strength check from batches
        def mock_checks_missing(t):
            if t == "batches":
                return [
                    {"name": "chk_batch_status", "sqltext": "status IN ('planned', 'active', 'completed', 'cancelled')"},
                    {"name": "chk_batch_dates", "sqltext": "end_date >= start_date"},
                ]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks_missing

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Missing required check constraint for 'target_strength >= 0'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Missing required check constraint"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_incorrect_enum_check_constraint_expression(self):
        """Verifies rejection when a check constraint exists but has wrong allowed values."""
        inspector = build_mock_valid_inspector()
        def mock_checks_wrong_enum(t):
            if t == "colleges":
                # 'pending' is NOT in migration 002 definition (only 'active', 'inactive')
                return [{"name": "chk_college_status", "sqltext": "status IN ('active', 'pending')"}]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks_wrong_enum

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Incorrect check constraint expression for 'status IN ('active', 'inactive')'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_incorrect_inequality_check_constraint_expression(self):
        """Verifies rejection when non-negative inequality direction or threshold is incorrect."""
        inspector = build_mock_valid_inspector()
        def mock_checks_wrong_inequality(t):
            if t == "batches":
                return [
                    # Migration 004 requires target_strength >= 0 (permits 0); strictly > 0 is incorrect!
                    {"name": "batches_target_strength_check", "sqltext": "target_strength > 0"},
                    {"name": "chk_batch_status", "sqltext": "status IN ('planned', 'active', 'completed', 'cancelled')"},
                    {"name": "chk_batch_dates", "sqltext": "end_date >= start_date"},
                ]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks_wrong_inequality

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Incorrect check constraint expression for 'target_strength >= 0'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    def test_schema_validator_blocks_inverted_date_check_constraint_expression(self):
        """Verifies rejection when date order constraint is inverted."""
        inspector = build_mock_valid_inspector()
        def mock_checks_wrong_dates(t):
            if t == "batches":
                return [
                    {"name": "batches_target_strength_check", "sqltext": "target_strength >= 0"},
                    {"name": "chk_batch_status", "sqltext": "status IN ('planned', 'active', 'completed', 'cancelled')"},
                    # Inverted date logic: end_date <= start_date violates migration 004!
                    {"name": "chk_batch_dates", "sqltext": "end_date <= start_date"},
                ]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks_wrong_dates

        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Incorrect check constraint expression for 'end_date >= start_date'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    @pytest.mark.parametrize("weakened_expr", [
        "duration_days >= 0 OR TRUE",
        "(duration_days >= 0) OR TRUE",
        "duration_days >= 0 OR 1=1",
        "duration_days >= 0 OR duration_days IS NULL",
    ])
    def test_schema_validator_blocks_weakened_non_negative_check_expressions(self, weakened_expr):
        """Verifies rejection of non-negative check expressions weakened with OR logic."""
        inspector = build_mock_valid_inspector()
        def mock_checks(t):
            if t == "programs":
                return [
                    {"name": "programs_duration_days_check", "sqltext": weakened_expr},
                    {"name": "chk_program_status", "sqltext": "status IN ('active', 'inactive')"},
                ]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks
        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Incorrect check constraint expression for 'duration_days >= 0'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    @pytest.mark.parametrize("weakened_expr", [
        "status IN ('active', 'inactive') OR TRUE",
        "(status IN ('active', 'inactive')) OR TRUE",
        "status IN ('active', 'inactive') OR status IS NULL",
        "status IN ('active', 'inactive') OR 1=1",
        "status IN ('active', 'inactive') OR FALSE",
    ])
    def test_schema_validator_blocks_weakened_enum_check_expressions(self, weakened_expr):
        """Verifies rejection of enum check expressions weakened with OR logic."""
        inspector = build_mock_valid_inspector()
        def mock_checks(t):
            if t == "colleges":
                return [{"name": "chk_college_status", "sqltext": weakened_expr}]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks
        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Incorrect check constraint expression for 'status IN ('active', 'inactive')'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    @pytest.mark.parametrize("weakened_expr", [
        "end_date >= start_date OR TRUE",
        "(end_date >= start_date) OR TRUE",
        "end_date >= start_date OR end_date IS NULL",
        "end_date >= start_date OR 1=1",
    ])
    def test_schema_validator_blocks_weakened_date_range_check_expressions(self, weakened_expr):
        """Verifies rejection of date range check expressions weakened with OR logic."""
        inspector = build_mock_valid_inspector()
        def mock_checks(t):
            if t == "batches":
                return [
                    {"name": "batches_target_strength_check", "sqltext": "target_strength >= 0"},
                    {"name": "chk_batch_status", "sqltext": "status IN ('planned', 'active', 'completed', 'cancelled')"},
                    {"name": "chk_batch_dates", "sqltext": weakened_expr},
                ]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks
        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Incorrect check constraint expression for 'end_date >= start_date'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    @pytest.mark.parametrize("altered_expr,table,rule_desc", [
        ("duration_days >= 0 AND TRUE", "programs", "duration_days >= 0"),
        ("NOT (duration_days < 0)", "programs", "duration_days >= 0"),
        ("status IN ('active', 'inactive') AND TRUE", "colleges", "status IN ('active', 'inactive')"),
        ("NOT (status NOT IN ('active', 'inactive'))", "colleges", "status IN ('active', 'inactive')"),
        ("end_date >= start_date AND TRUE", "batches", "end_date >= start_date"),
    ])
    def test_schema_validator_blocks_altered_logic_and_negations(self, altered_expr, table, rule_desc):
        """Verifies rejection of constraints using compound AND or NOT negations."""
        inspector = build_mock_valid_inspector()
        def mock_checks(t):
            if t == table:
                checks = [ck for ck in build_mock_valid_inspector().get_check_constraints(t)]
                for ck in checks:
                    # Update target check
                    if rule_desc.split()[0] in ck["sqltext"] or rule_desc.split()[0] in ck["name"]:
                        ck["sqltext"] = altered_expr
                return checks
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks
        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any(f"Incorrect check constraint expression for '{rule_desc}'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    @pytest.mark.parametrize("invalid_array_expr", [
        # 1. NULL element in array
        "(status)::text = ANY (ARRAY['active', 'inactive', NULL])",
        "(status)::text = ANY (ARRAY['active'::text, 'inactive'::text, NULL]::text[])",
        """(status)::text = ANY (
            ARRAY['active'::text, 'inactive'::text, NULL]::text[]
        )""",
        # 2. Extra string literal in array
        "(status)::text = ANY (ARRAY['active', 'inactive', 'extra'])",
        "(status)::text = ANY (ARRAY['active'::text, 'inactive'::text, 'extra'::text])",
        # 3. Numeric element in array
        "(status)::text = ANY (ARRAY['active', 'inactive', 123])",
        "(status)::text = ANY (ARRAY['active'::text, 'inactive'::text, 123])",
        # 4. CASE statement in array
        "(status)::text = ANY (ARRAY['active', 'inactive', CASE WHEN TRUE THEN 'active' ELSE 'inactive' END])",
        # 5. Duplicate elements in array
        "(status)::text = ANY (ARRAY['active', 'inactive', 'active'])",
        "(status)::text = ANY (ARRAY['active'::text, 'inactive'::text, 'active'::text])",
    ])
    def test_schema_validator_blocks_invalid_postgresql_array_elements(self, invalid_array_expr):
        """
        Verifies rejection of PostgreSQL ANY (ARRAY[...]) enum checks that contain
        NULL, extra elements, numbers, CASE expressions, or duplicate values.
        """
        inspector = build_mock_valid_inspector()
        def mock_checks(t):
            if t == "colleges":
                return [{"name": "chk_college_status", "sqltext": invalid_array_expr}]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks
        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Incorrect check constraint expression for 'status IN ('active', 'inactive')'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    @pytest.mark.parametrize("reversed_date_expr", [
        "start_date >= end_date",
        "(start_date >= end_date)",
        "end_date <= start_date",
        "(end_date <= start_date)",
        "end_date >= (SELECT now())",
    ])
    def test_schema_validator_blocks_reversed_or_subquery_date_ranges(self, reversed_date_expr):
        """Verifies rejection of reversed date ranges and subqueries."""
        inspector = build_mock_valid_inspector()
        def mock_checks(t):
            if t == "batches":
                return [
                    {"name": "batches_target_strength_check", "sqltext": "target_strength >= 0"},
                    {"name": "chk_batch_status", "sqltext": "status IN ('planned', 'active', 'completed', 'cancelled')"},
                    {"name": "chk_batch_dates", "sqltext": reversed_date_expr},
                ]
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks
        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any("Incorrect check constraint expression for 'end_date >= start_date'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)

    @pytest.mark.parametrize("invalid_direction_expr,table,desc", [
        ("duration_days <= 0", "programs", "duration_days >= 0"),
        ("0 >= duration_days", "programs", "duration_days >= 0"),
        ("duration_days < 0", "programs", "duration_days >= 0"),
        ("duration_days >= random()", "programs", "duration_days >= 0"),
        ("target_strength <= 0", "batches", "target_strength >= 0"),
        ("0 >= target_strength", "batches", "target_strength >= 0"),
    ])
    def test_schema_validator_blocks_incorrect_inequality_directions(self, invalid_direction_expr, table, desc):
        """Verifies rejection of reversed inequalities and non-literal bounds."""
        inspector = build_mock_valid_inspector()
        def mock_checks(t):
            if t == table:
                checks = [ck for ck in build_mock_valid_inspector().get_check_constraints(t)]
                for ck in checks:
                    if desc.split()[0] in ck["sqltext"] or desc.split()[0] in ck["name"]:
                        ck["sqltext"] = invalid_direction_expr
                return checks
            return build_mock_valid_inspector().get_check_constraints(t)

        inspector.get_check_constraints.side_effect = mock_checks
        result = verify_database_schema(inspector)
        assert result["valid"] is False
        assert any(f"Incorrect check constraint expression for '{desc}'" in err for err in result["errors"])
        with pytest.raises(RuntimeError, match="Incorrect check constraint expression"):
            assert_full_baseline_integrity(inspector)



