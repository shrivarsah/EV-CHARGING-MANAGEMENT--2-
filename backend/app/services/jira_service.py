import logging
import json
import re
from typing import Dict, Any, Optional, Tuple, List
import requests
from requests.auth import HTTPBasicAuth

logger = logging.getLogger(__name__)


class JiraService:
    @staticmethod
    def test_connection(
        base_url: str,
        project_key: str,
        email: str,
        api_token: str
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Tests connectivity to Jira Cloud instance and verifies project access.
        """
        if not base_url or not email or not api_token:
            return False, "Jira Base URL, Email, and API Token are required.", {}

        clean_url = base_url.rstrip('/')
        auth = HTTPBasicAuth(email, api_token)
        headers = {"Accept": "application/json"}

        try:
            # First check auth with /rest/api/3/myself
            myself_resp = requests.get(f"{clean_url}/rest/api/3/myself", auth=auth, headers=headers, timeout=10)
            if myself_resp.status_code == 401:
                return False, "Authentication failed. Check your Jira Email and API Token.", {}
            elif myself_resp.status_code != 200:
                return False, f"Jira API returned HTTP {myself_resp.status_code}: {myself_resp.text[:150]}", {}

            user_data = myself_resp.json()
            display_name = user_data.get("displayName", email)

            # Check project access if project_key is provided
            if project_key:
                proj_resp = requests.get(f"{clean_url}/rest/api/3/project/{project_key}", auth=auth, headers=headers, timeout=10)
                if proj_resp.status_code == 404:
                    return False, f"Connected as '{display_name}', but Project key '{project_key}' was not found.", user_data
                elif proj_resp.status_code == 200:
                    proj_data = proj_resp.json()
                    proj_name = proj_data.get("name", project_key)
                    return True, f"Connection successful! Authenticated as '{display_name}' for Project: '{proj_name}' ({project_key})", proj_data

            return True, f"Connection successful! Authenticated as '{display_name}'.", user_data

        except requests.exceptions.RequestException as e:
            return False, f"Failed to connect to Jira server: {str(e)}", {}

    @staticmethod
    def fetch_metrics(
        base_url: str,
        project_key: str,
        email: str,
        api_token: str,
        custom_field_mapping: Optional[Dict[str, str]] = None,
        timeout: int = 15
    ) -> Dict[str, Any]:
        """
        Retrieves real custom Jira metrics:
        1. Charging Workflow Efficiency: (Expected Workflow Time / Actual Workflow Time) * 100
        2. Station Availability Response Index: (Expected Response Time / Actual Response Time) * 100
        
        Uses Jira as the true source of truth. Zero synthetic or fake values.
        """
        if not base_url or not project_key or not email or not api_token:
            return {
                "success": False,
                "status": "NOT_CONFIGURED",
                "message": "Jira URL, Project Key, Email, and API Token must be configured.",
                "metrics": {},
                "raw_json": None
            }

        clean_url = base_url.rstrip('/')
        auth = HTTPBasicAuth(email, api_token)
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

        try:
            # 1. Discover fields from /rest/api/3/field to resolve custom field IDs if needed
            field_resp = requests.get(f"{clean_url}/rest/api/3/field", auth=auth, headers=headers, timeout=timeout)
            fields_data = field_resp.json() if field_resp.status_code == 200 else []
            
            # Map discovered fields by lower-cased name
            field_name_map = {}
            for f in fields_data:
                name_clean = f.get("name", "").strip().lower()
                field_name_map[name_clean] = f.get("id")

            # 2. Query Jira issues for the project
            jql = f'project = "{project_key}" ORDER BY updated DESC'
            search_url = f"{clean_url}/rest/api/3/search"
            search_params = {
                "jql": jql,
                "maxResults": 50,
                "fields": "*all"
            }

            logger.info(f"Querying Jira search at {search_url} with JQL: '{jql}'")
            resp = requests.post(search_url, auth=auth, headers=headers, json=search_params, timeout=timeout)

            if resp.status_code == 401:
                return {
                    "success": False,
                    "status": "UNAUTHORIZED",
                    "message": "Jira authentication failed. Please verify email and API token.",
                    "metrics": {},
                    "raw_json": resp.text
                }
            elif resp.status_code == 400:
                # Fallback to GET if JQL needs adjustment
                resp = requests.get(search_url, auth=auth, headers=headers, params={"jql": f'project = "{project_key}"', "maxResults": 50}, timeout=timeout)
            
            if resp.status_code != 200:
                return {
                    "success": False,
                    "status": "ERROR",
                    "message": f"Jira API returned HTTP {resp.status_code}: {resp.text[:200]}",
                    "metrics": {},
                    "raw_json": resp.text
                }

            search_data = resp.json()
            issues: List[Dict[str, Any]] = search_data.get("issues", [])

            if not issues:
                return {
                    "success": True,
                    "status": "NO_ISSUES",
                    "message": f"Connected to Jira project '{project_key}', but no issues were found to calculate metrics.",
                    "metrics": {},
                    "raw_json": json.dumps(search_data)
                }

            # 3. Locate metric values or calculate from Expected vs Actual times
            efficiency_val = None
            response_index_val = None
            workflow_details = {}
            response_details = {}

            # Check explicit mappings from configuration if provided
            mapping = custom_field_mapping or {}
            eff_field_key = mapping.get("efficiency_field") or field_name_map.get("charging workflow efficiency") or field_name_map.get("workflow efficiency")
            resp_field_key = mapping.get("response_index_field") or field_name_map.get("station availability response index") or field_name_map.get("availability response index")

            exp_wf_key = mapping.get("expected_workflow_field") or field_name_map.get("expected workflow time")
            act_wf_key = mapping.get("actual_workflow_field") or field_name_map.get("actual workflow time")
            exp_resp_key = mapping.get("expected_response_field") or field_name_map.get("expected response time")
            act_resp_key = mapping.get("actual_response_field") or field_name_map.get("actual response time")

            # Iterate through issues to extract metrics
            total_exp_wf, total_act_wf = 0.0, 0.0
            total_exp_resp, total_act_resp = 0.0, 0.0
            wf_count = 0
            resp_count = 0

            for issue in issues:
                fields = issue.get("fields", {})

                # Check if metric values exist directly
                if eff_field_key and fields.get(eff_field_key) is not None:
                    try:
                        raw_val = fields.get(eff_field_key)
                        efficiency_val = float(raw_val if not isinstance(raw_val, dict) else raw_val.get("value", 0))
                    except (ValueError, TypeError):
                        pass

                if resp_field_key and fields.get(resp_field_key) is not None:
                    try:
                        raw_val = fields.get(resp_field_key)
                        response_index_val = float(raw_val if not isinstance(raw_val, dict) else raw_val.get("value", 0))
                    except (ValueError, TypeError):
                        pass

                # If not direct, check custom fields or time estimates
                exp_wf = None
                act_wf = None
                if exp_wf_key and fields.get(exp_wf_key) is not None:
                    try: exp_wf = float(fields[exp_wf_key])
                    except (ValueError, TypeError): pass
                if act_wf_key and fields.get(act_wf_key) is not None:
                    try: act_wf = float(fields[act_wf_key])
                    except (ValueError, TypeError): pass

                # Fallback to standard Jira time tracking if custom fields are empty on this issue
                if exp_wf is None and fields.get("timeoriginalestimate") is not None:
                    exp_wf = float(fields["timeoriginalestimate"]) / 3600.0  # hours
                if act_wf is None and fields.get("timespent") is not None:
                    act_wf = float(fields["timespent"]) / 3600.0  # hours

                if exp_wf is not None and act_wf is not None and act_wf > 0:
                    total_exp_wf += exp_wf
                    total_act_wf += act_wf
                    wf_count += 1

                # Check response time fields
                exp_resp = None
                act_resp = None
                if exp_resp_key and fields.get(exp_resp_key) is not None:
                    try: exp_resp = float(fields[exp_resp_key])
                    except (ValueError, TypeError): pass
                if act_resp_key and fields.get(act_resp_key) is not None:
                    try: act_resp = float(fields[act_resp_key])
                    except (ValueError, TypeError): pass

                if exp_resp is not None and act_resp is not None and act_resp > 0:
                    total_exp_resp += exp_resp
                    total_act_resp += act_resp
                    resp_count += 1

            # Compute formula values if direct custom field values weren't present
            if efficiency_val is None and total_act_wf > 0:
                efficiency_val = round((total_exp_wf / total_act_wf) * 100, 2)
                workflow_details = {
                    "expected_time_total": round(total_exp_wf, 2),
                    "actual_time_total": round(total_act_wf, 2),
                    "sample_issues_evaluated": wf_count
                }

            if response_index_val is None and total_act_resp > 0:
                response_index_val = round((total_exp_resp / total_act_resp) * 100, 2)
                response_details = {
                    "expected_response_total": round(total_exp_resp, 2),
                    "actual_response_total": round(total_act_resp, 2),
                    "sample_issues_evaluated": resp_count
                }

            # If metrics could not be resolved from issues yet
            parsed_metrics = {}
            if efficiency_val is not None:
                parsed_metrics["charging_workflow_efficiency"] = efficiency_val
            if response_index_val is not None:
                parsed_metrics["station_availability_response_index"] = response_index_val

            return {
                "success": True,
                "status": "CONNECTED",
                "message": f"Successfully retrieved Jira data from project '{project_key}'. Found {len(issues)} issues.",
                "project_key": project_key,
                "metrics": parsed_metrics,
                "details": {
                    "workflow": workflow_details,
                    "response": response_details,
                    "total_issues_analyzed": len(issues)
                },
                "raw_json": json.dumps(search_data)
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Jira server: {e}")
            return {
                "success": False,
                "status": "CONNECTION_ERROR",
                "message": f"Network error connecting to Jira: {str(e)}",
                "metrics": {},
                "raw_json": None
            }
        except Exception as e:
            logger.exception("Unexpected error fetching Jira metrics")
            return {
                "success": False,
                "status": "ERROR",
                "message": f"Error parsing Jira metrics: {str(e)}",
                "metrics": {},
                "raw_json": None
            }
