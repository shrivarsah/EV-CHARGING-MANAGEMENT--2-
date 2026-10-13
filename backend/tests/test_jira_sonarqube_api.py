from unittest.mock import patch, MagicMock
from app.services.sonarqube_service import SonarQubeService
from app.services.jira_service import JiraService


@patch("requests.get")
def test_sonarqube_fetch_success(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "component": {
            "key": "test_proj",
            "measures": [
                {"metric": "ncloc", "value": "1250"},
                {"metric": "cognitive_complexity", "value": "18"},
                {"metric": "complexity", "value": "28"},
                {"metric": "coverage", "value": "88.4"},
                {"metric": "duplicated_lines_density", "value": "0.8"},
                {"metric": "bugs", "value": "0"},
                {"metric": "sqale_index", "value": "25"},
                {"metric": "vulnerabilities", "value": "0"},
            ]
        }
    }
    mock_get.return_value = mock_resp

    res = SonarQubeService.fetch_metrics(
        base_url="https://sonarcloud.io",
        project_key="test_proj",
        token="valid_token"
    )

    assert res["success"] is True
    assert res["status"] == "CONNECTED"
    metrics = res["metrics"]
    assert metrics["ncloc"] == 1250
    assert metrics["coverage"] == 88.4
    assert metrics["bugs"] == 0
    assert metrics["vulnerabilities"] == 0


@patch("requests.get")
def test_sonarqube_fetch_unauthorized(mock_get):
    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = "Invalid credentials"
    mock_get.return_value = mock_resp

    res = SonarQubeService.fetch_metrics(
        base_url="https://sonarcloud.io",
        project_key="test_proj",
        token="bad_token"
    )

    assert res["success"] is False
    assert res["status"] == "UNAUTHORIZED"
    assert "authentication failed" in res["message"].lower()


@patch("requests.post")
@patch("requests.get")
def test_jira_fetch_and_calculate_metrics(mock_get, mock_post):
    # Mock field list
    mock_fields = MagicMock()
    mock_fields.status_code = 200
    mock_fields.json.return_value = [
        {"id": "customfield_1001", "name": "Expected Workflow Time"},
        {"id": "customfield_1002", "name": "Actual Workflow Time"},
        {"id": "customfield_1003", "name": "Expected Response Time"},
        {"id": "customfield_1004", "name": "Actual Response Time"}
    ]
    mock_get.return_value = mock_fields

    # Mock issue search
    mock_search = MagicMock()
    mock_search.status_code = 200
    mock_search.json.return_value = {
        "issues": [
            {
                "key": "EVC-1",
                "fields": {
                    "customfield_1001": 50.0,
                    "customfield_1002": 52.0,
                    "customfield_1003": 5.0,
                    "customfield_1004": 5.2
                }
            }
        ]
    }
    mock_post.return_value = mock_search

    res = JiraService.fetch_metrics(
        base_url="https://test.atlassian.net",
        project_key="EVC",
        email="dev@test.com",
        api_token="token"
    )

    assert res["success"] is True
    assert res["status"] == "CONNECTED"
    metrics = res["metrics"]
    
    # Formula 9: (50 / 52) * 100 = 96.15
    assert metrics["charging_workflow_efficiency"] == 96.15
    # Formula 10: (5.0 / 5.2) * 100 = 96.15
    assert metrics["station_availability_response_index"] == 96.15
