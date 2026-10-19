from compliance_scoring import calculate_checklist_compliance


def test_weighted_compliance_excludes_not_applicable_items():
    result = calculate_checklist_compliance([
        {"status": "Compliant"},
        {"status": "Partially Compliant"},
        {"status": "Non-Compliant"},
        {"status": "Not Started"},
        {"status": "Not Applicable"},
    ])

    assert result["compliance_rate"] == 37.5
    assert result["applicable_count"] == 4
    assert result["is_all_not_applicable"] is False


def test_all_not_applicable_returns_zero_and_explicit_flag():
    result = calculate_checklist_compliance([
        {"status": "Not Applicable"},
        {"status": "Not Applicable"},
    ])

    assert result["compliance_rate"] == 0
    assert result["applicable_count"] == 0
    assert result["is_all_not_applicable"] is True


def test_empty_checklist_is_not_marked_all_not_applicable():
    result = calculate_checklist_compliance([])

    assert result["compliance_rate"] == 0
    assert result["is_all_not_applicable"] is False
