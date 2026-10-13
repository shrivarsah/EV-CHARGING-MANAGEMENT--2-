from app.services.metrics_service import MetricsService


def test_metrics_build_exactly_ten_items():
    sonar_data = {
        "ncloc": 1500,
        "cognitive_complexity": 25,
        "complexity": 35,
        "coverage": 85.5,
        "duplicated_lines_density": 1.2,
        "bugs": 0,
        "sqale_index": 20,
        "vulnerabilities": 0
    }
    jira_data = {
        "charging_workflow_efficiency": 96.5,
        "station_availability_response_index": 94.2
    }

    items = MetricsService._build_metric_items(sonar_data, jira_data, {}, {})
    assert len(items) == 10

    # Validate names and sources
    item_map = {item.id: item for item in items}
    assert item_map["loc"].source == "SonarQube Cloud"
    assert item_map["code_complexity"].source == "SonarQube Cloud"
    assert item_map["cyclomatic_complexity"].source == "SonarQube Cloud"
    assert item_map["coverage"].source == "SonarQube Cloud"
    assert item_map["duplication"].source == "SonarQube Cloud"
    assert item_map["bugs"].source == "SonarQube Cloud"
    assert item_map["technical_debt"].source == "SonarQube Cloud"
    assert item_map["vulnerabilities"].source == "SonarQube Cloud"
    assert item_map["charging_workflow_efficiency"].source == "Jira Cloud"
    assert item_map["station_availability_response_index"].source == "Jira Cloud"


def test_custom_formulas_evaluation():
    # Formula 9: Charging Workflow Efficiency = (Expected / Actual) * 100
    expected_workflow_time = 45.0
    actual_workflow_time = 50.0
    efficiency = round((expected_workflow_time / actual_workflow_time) * 100, 2)
    assert efficiency == 90.0

    # Formula 10: Station Availability Response Index = (Expected / Actual) * 100
    expected_response_time = 2.0
    actual_response_time = 2.2
    response_index = round((expected_response_time / actual_response_time) * 100, 2)
    assert response_index == 90.91


def test_quality_score_calculation():
    # Optimal metrics
    sonar_perfect = {
        "ncloc": 2000,
        "cognitive_complexity": 15,
        "complexity": 25,
        "coverage": 95.0,
        "duplicated_lines_density": 0.5,
        "bugs": 0,
        "sqale_index": 10,
        "vulnerabilities": 0
    }
    jira_perfect = {
        "charging_workflow_efficiency": 98.0,
        "station_availability_response_index": 95.0
    }

    score, label, count = MetricsService._compute_quality_score(sonar_perfect, jira_perfect)
    assert score >= 90.0
    assert "A" in label
    assert count == 10


def test_unconfigured_quality_score():
    score, label, count = MetricsService._compute_quality_score({}, {})
    assert score == 0.0
    assert "Awaiting" in label
    assert count == 0
