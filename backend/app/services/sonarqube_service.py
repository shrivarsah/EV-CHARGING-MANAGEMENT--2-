import logging
import json
from typing import Dict, Any, Optional, Tuple
import requests

logger = logging.getLogger(__name__)

SONARQUBE_METRIC_KEYS = [
    "ncloc",                    # 1. Lines of Code
    "cognitive_complexity",     # 2. Code Complexity
    "complexity",               # 3. Cyclomatic Complexity
    "coverage",                 # 4. Code Coverage
    "duplicated_lines_density", # 5. Code Duplication
    "bugs",                     # 6. Bugs
    "sqale_index",              # 7. Technical Debt (minutes)
    "vulnerabilities",          # 8. Security Vulnerabilities
]


class SonarQubeService:
    @staticmethod
    def fetch_metrics(
        base_url: str,
        project_key: str,
        token: Optional[str] = None,
        organization: Optional[str] = None,
        timeout: int = 15
    ) -> Dict[str, Any]:
        """
        Retrieves real SonarQube / SonarCloud metrics via the REST API.
        Does not generate or fake metrics.
        """
        if not base_url or not project_key:
            return {
                "success": False,
                "status": "NOT_CONFIGURED",
                "message": "SonarQube URL and Project Key must be configured.",
                "metrics": {},
                "raw_json": None
            }

        endpoint = f"{base_url.rstrip('/')}/api/measures/component"
        params = {
            "component": project_key,
            "metricKeys": ",".join(SONARQUBE_METRIC_KEYS)
        }
        
        headers = {
            "Accept": "application/json",
            "User-Agent": "EV-Charging-Metrics-Dashboard/1.0"
        }
        
        auth = (token, "") if token else None

        try:
            logger.info(f"Querying SonarQube API at {endpoint} for project '{project_key}'")
            response = requests.get(
                endpoint,
                params=params,
                headers=headers,
                auth=auth,
                timeout=timeout
            )
            
            if response.status_code == 401:
                return {
                    "success": False,
                    "status": "UNAUTHORIZED",
                    "message": "SonarQube authentication failed. Please provide a valid user token.",
                    "metrics": {},
                    "raw_json": response.text
                }
            elif response.status_code == 404:
                return {
                    "success": False,
                    "status": "NOT_FOUND",
                    "message": f"Project key '{project_key}' was not found on SonarQube/SonarCloud. Ensure the project key is accurate and has been scanned at least once.",
                    "metrics": {},
                    "raw_json": response.text
                }
            elif response.status_code != 200:
                return {
                    "success": False,
                    "status": "ERROR",
                    "message": f"SonarQube API returned HTTP {response.status_code}: {response.text[:200]}",
                    "metrics": {},
                    "raw_json": response.text
                }

            data = response.json()
            measures = data.get("component", {}).get("measures", [])
            
            # Map retrieved real measures
            parsed_metrics: Dict[str, Any] = {}
            for m in measures:
                key = m.get("metric")
                raw_val = m.get("value")
                
                if key in ["ncloc", "cognitive_complexity", "complexity", "bugs", "vulnerabilities", "sqale_index"]:
                    parsed_metrics[key] = int(raw_val) if raw_val is not None else 0
                elif key in ["coverage", "duplicated_lines_density"]:
                    parsed_metrics[key] = round(float(raw_val), 2) if raw_val is not None else 0.0

            # Quality gate status if available
            quality_gate = None
            try:
                qg_resp = requests.get(
                    f"{base_url.rstrip('/')}/api/qualitygates/project_status",
                    params={"projectKey": project_key},
                    headers=headers,
                    auth=auth,
                    timeout=5
                )
                if qg_resp.status_code == 200:
                    quality_gate = qg_resp.json().get("projectStatus", {}).get("status")
            except Exception as qg_err:
                logger.debug(f"Quality gate check skipped: {qg_err}")

            return {
                "success": True,
                "status": "CONNECTED",
                "message": "Successfully fetched real SonarQube metrics.",
                "project_key": project_key,
                "quality_gate": quality_gate,
                "metrics": parsed_metrics,
                "raw_json": json.dumps(data)
            }

        except requests.exceptions.RequestException as req_err:
            logger.error(f"Failed to connect to SonarQube server: {req_err}")
            return {
                "success": False,
                "status": "CONNECTION_ERROR",
                "message": f"Network error connecting to SonarQube: {str(req_err)}",
                "metrics": {},
                "raw_json": None
            }
        except Exception as e:
            logger.exception("Unexpected error fetching SonarQube metrics")
            return {
                "success": False,
                "status": "ERROR",
                "message": f"Error parsing SonarQube metrics: {str(e)}",
                "metrics": {},
                "raw_json": None
            }

    @staticmethod
    def test_connection(
        base_url: str,
        project_key: str,
        token: Optional[str] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates connectivity to SonarQube instance and project existence.
        """
        if not base_url or not project_key:
            return False, "Base URL and Project Key are required.", {}

        endpoint = f"{base_url.rstrip('/')}/api/measures/component"
        params = {"component": project_key, "metricKeys": "ncloc"}
        auth = (token, "") if token else None

        try:
            resp = requests.get(endpoint, params=params, auth=auth, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                component_name = data.get("component", {}).get("name", project_key)
                return True, f"Connection successful! Connected to project: {component_name}", data
            elif resp.status_code == 401:
                return False, "Authentication failed. Please verify your SonarQube User Token.", {}
            elif resp.status_code == 404:
                return False, f"Project '{project_key}' not found on this SonarQube server.", {}
            else:
                return False, f"SonarQube returned status {resp.status_code}: {resp.text[:150]}", {}
        except Exception as e:
            return False, f"Connection test failed: {str(e)}", {}
