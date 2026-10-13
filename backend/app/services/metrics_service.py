import datetime
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models import MetricSnapshot, ApiConfiguration
from app.schemas import MetricItem, QualityOverview
from app.services.sonarqube_service import SonarQubeService
from app.services.jira_service import JiraService
from app.config import settings

logger = logging.getLogger(__name__)


class MetricsService:
    @staticmethod
    def get_api_config(db: Session, service_name: str) -> Optional[ApiConfiguration]:
        return db.query(ApiConfiguration).filter(
            ApiConfiguration.service_name == service_name,
            ApiConfiguration.is_active == True
        ).first()

    @classmethod
    def fetch_all_metrics(cls, db: Session, save_snapshot: bool = True) -> QualityOverview:
        """
        Gathers live metrics from configured SonarQube and Jira endpoints.
        Never generates fake numbers. Handles missing configurations gracefully.
        """
        # 1. Resolve SonarQube credentials (DB first, then fallback to environment)
        sonar_cfg = cls.get_api_config(db, "sonarqube")
        sonar_url = sonar_cfg.base_url if sonar_cfg else settings.SONARQUBE_URL
        sonar_key = sonar_cfg.project_key if sonar_cfg else settings.SONARQUBE_PROJECT_KEY
        sonar_token = sonar_cfg.auth_token if sonar_cfg else settings.SONARQUBE_TOKEN
        sonar_org = sonar_cfg.organization if sonar_cfg else settings.SONARQUBE_ORGANIZATION

        sonar_result = SonarQubeService.fetch_metrics(
            base_url=sonar_url,
            project_key=sonar_key,
            token=sonar_token,
            organization=sonar_org
        )

        # 2. Resolve Jira credentials (DB first, then fallback to environment)
        jira_cfg = cls.get_api_config(db, "jira")
        jira_url = jira_cfg.base_url if jira_cfg else settings.JIRA_URL
        jira_key = jira_cfg.project_key if jira_cfg else settings.JIRA_PROJECT_KEY
        jira_email = jira_cfg.username_or_email if jira_cfg else settings.JIRA_EMAIL
        jira_token = jira_cfg.auth_token if jira_cfg else settings.JIRA_API_TOKEN

        jira_result = JiraService.fetch_metrics(
            base_url=jira_url,
            project_key=jira_key,
            email=jira_email,
            api_token=jira_token
        )

        sonar_metrics = sonar_result.get("metrics", {})
        jira_metrics = jira_result.get("metrics", {})

        # 3. Construct 10 Metric Items
        items = cls._build_metric_items(sonar_metrics, jira_metrics, sonar_result, jira_result)

        # 4. Compute overall score
        overall_score, status_label, configured_count = cls._compute_quality_score(sonar_metrics, jira_metrics)

        # 5. Persist to DB if valid data exists and requested
        if save_snapshot and configured_count > 0:
            try:
                snapshot = MetricSnapshot(
                    timestamp=datetime.datetime.utcnow(),
                    overall_score=overall_score,
                    loc=sonar_metrics.get("ncloc"),
                    code_complexity=sonar_metrics.get("cognitive_complexity"),
                    cyclomatic_complexity=sonar_metrics.get("complexity"),
                    coverage=sonar_metrics.get("coverage"),
                    duplication=sonar_metrics.get("duplicated_lines_density"),
                    bugs=sonar_metrics.get("bugs"),
                    technical_debt=sonar_metrics.get("sqale_index"),
                    vulnerabilities=sonar_metrics.get("vulnerabilities"),
                    charging_workflow_efficiency=jira_metrics.get("charging_workflow_efficiency"),
                    station_availability_response_index=jira_metrics.get("station_availability_response_index"),
                    raw_sonarqube_json=sonar_result.get("raw_json"),
                    raw_jira_json=jira_result.get("raw_json"),
                    status="SUCCESS" if configured_count == 10 else "PARTIAL"
                )
                db.add(snapshot)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to record metric snapshot: {e}")

        # Summary
        summary = (
            f"Evaluated {configured_count} of 10 metrics. "
            f"SonarQube status: {sonar_result.get('status')}. "
            f"Jira status: {jira_result.get('status')}."
        )

        return QualityOverview(
            overall_score=overall_score,
            status_label=status_label,
            total_metrics=10,
            configured_metrics=configured_count,
            sonarqube_status=sonar_result.get("status", "NOT_CONFIGURED"),
            jira_status=jira_result.get("status", "NOT_CONFIGURED"),
            last_updated=datetime.datetime.utcnow(),
            metrics=items,
            project_health_summary=summary
        )

    @classmethod
    def _build_metric_items(
        cls,
        sonar: Dict[str, Any],
        jira: Dict[str, Any],
        sonar_res: Dict[str, Any],
        jira_res: Dict[str, Any]
    ) -> List[MetricItem]:
        items: List[MetricItem] = []

        # --- 1. Lines of Code ---
        loc = sonar.get("ncloc")
        items.append(MetricItem(
            id="loc",
            name="Lines of Code",
            category="Code Quality",
            source="SonarQube Cloud",
            value=float(loc) if loc is not None else None,
            formatted_value=f"{loc:,} LOC" if loc is not None else "Not Available",
            unit="LOC",
            description="Total count of non-comment, non-empty physical source code lines.",
            status="GOOD" if loc is not None else "UNCONFIGURED",
            benchmark="Baseline scale indicator",
            formula=None
        ))

        # --- 2. Code Complexity ---
        cog = sonar.get("cognitive_complexity")
        items.append(MetricItem(
            id="code_complexity",
            name="Code Complexity",
            category="Code Quality",
            source="SonarQube Cloud",
            value=float(cog) if cog is not None else None,
            formatted_value=str(cog) if cog is not None else "Not Available",
            unit="points",
            description="Cognitive Complexity assesses how difficult control flow is to understand for human maintainers.",
            status=("GOOD" if cog is not None and cog < 50 else ("WARNING" if cog is not None and cog < 100 else ("DANGER" if cog is not None else "UNCONFIGURED"))),
            benchmark="Target < 50 for clean maintainability",
            formula=None
        ))

        # --- 3. Cyclomatic Complexity ---
        cyc = sonar.get("complexity")
        items.append(MetricItem(
            id="cyclomatic_complexity",
            name="Cyclomatic Complexity",
            category="Code Quality",
            source="SonarQube Cloud",
            value=float(cyc) if cyc is not None else None,
            formatted_value=str(cyc) if cyc is not None else "Not Available",
            unit="paths",
            description="Number of linearly independent execution paths through the application's source modules.",
            status=("GOOD" if cyc is not None and cyc < 60 else ("WARNING" if cyc is not None and cyc < 120 else ("DANGER" if cyc is not None else "UNCONFIGURED"))),
            benchmark="Target < 60 for comprehensive testability",
            formula=None
        ))

        # --- 4. Code Coverage ---
        cov = sonar.get("coverage")
        items.append(MetricItem(
            id="coverage",
            name="Code Coverage",
            category="Testing & Security",
            source="SonarQube Cloud",
            value=float(cov) if cov is not None else None,
            formatted_value=f"{cov}%" if cov is not None else "Not Available",
            unit="%",
            description="Percentage of executable source code covered by automated unit and integration tests.",
            status=("GOOD" if cov is not None and cov >= 80 else ("WARNING" if cov is not None and cov >= 60 else ("DANGER" if cov is not None else "UNCONFIGURED"))),
            benchmark="Enterprise Target >= 80%",
            formula="(Covered Lines / Executable Lines) * 100"
        ))

        # --- 5. Code Duplication ---
        dup = sonar.get("duplicated_lines_density")
        items.append(MetricItem(
            id="duplication",
            name="Code Duplication",
            category="Code Quality",
            source="SonarQube Cloud",
            value=float(dup) if dup is not None else None,
            formatted_value=f"{dup}%" if dup is not None else "Not Available",
            unit="%",
            description="Density of duplicated tokens and cloned logic across the repository.",
            status=("GOOD" if dup is not None and dup <= 3.0 else ("WARNING" if dup is not None and dup <= 5.0 else ("DANGER" if dup is not None else "UNCONFIGURED"))),
            benchmark="Target < 3.0%",
            formula="(Duplicated Lines / Total Lines) * 100"
        ))

        # --- 6. Bugs ---
        bugs = sonar.get("bugs")
        items.append(MetricItem(
            id="bugs",
            name="Bugs",
            category="Code Quality",
            source="SonarQube Cloud",
            value=float(bugs) if bugs is not None else None,
            formatted_value=f"{bugs} Bugs" if bugs is not None else "Not Available",
            unit="issues",
            description="Identified defects in code that will cause wrong behavior or runtime exceptions.",
            status=("GOOD" if bugs is not None and bugs == 0 else ("WARNING" if bugs is not None and bugs <= 2 else ("DANGER" if bugs is not None else "UNCONFIGURED"))),
            benchmark="Zero Bugs target",
            formula=None
        ))

        # --- 7. Technical Debt ---
        debt = sonar.get("sqale_index")
        debt_str = f"{debt} mins" if debt is not None else "Not Available"
        if debt is not None and debt >= 60:
            debt_str = f"{round(debt / 60, 1)} hrs ({debt} mins)"
        items.append(MetricItem(
            id="technical_debt",
            name="Technical Debt",
            category="Code Quality",
            source="SonarQube Cloud",
            value=float(debt) if debt is not None else None,
            formatted_value=debt_str,
            unit="minutes",
            description="Estimated effort required to remediate all code smells and architectural violations (SQALE index).",
            status=("GOOD" if debt is not None and debt < 60 else ("WARNING" if debt is not None and debt < 240 else ("DANGER" if debt is not None else "UNCONFIGURED"))),
            benchmark="Target < 60 minutes",
            formula=None
        ))

        # --- 8. Security Vulnerabilities ---
        vuln = sonar.get("vulnerabilities")
        items.append(MetricItem(
            id="vulnerabilities",
            name="Security Vulnerabilities",
            category="Testing & Security",
            source="SonarQube Cloud",
            value=float(vuln) if vuln is not None else None,
            formatted_value=f"{vuln} Vulnerabilities" if vuln is not None else "Not Available",
            unit="issues",
            description="Identified security flaws exposing the system to potential compromise or exploits.",
            status=("GOOD" if vuln is not None and vuln == 0 else ("DANGER" if vuln is not None else "UNCONFIGURED")),
            benchmark="Zero Tolerance (Target: 0)",
            formula=None
        ))

        # --- 9. Charging Workflow Efficiency (Jira) ---
        wf_eff = jira.get("charging_workflow_efficiency")
        items.append(MetricItem(
            id="charging_workflow_efficiency",
            name="Charging Workflow Efficiency",
            category="EV Charging Metrics",
            source="Jira Cloud",
            value=float(wf_eff) if wf_eff is not None else None,
            formatted_value=f"{wf_eff}%" if wf_eff is not None else "Not Available",
            unit="%",
            description="Evaluates operational velocity by comparing expected workflow time against actual measured workflow time.",
            status=("GOOD" if wf_eff is not None and wf_eff >= 90.0 else ("WARNING" if wf_eff is not None and wf_eff >= 75.0 else ("DANGER" if wf_eff is not None else "UNCONFIGURED"))),
            benchmark="Target >= 90%",
            formula="(Expected Workflow Time / Actual Workflow Time) * 100",
            details=jira_res.get("details", {}).get("workflow")
        ))

        # --- 10. Station Availability Response Index (Jira) ---
        resp_idx = jira.get("station_availability_response_index")
        items.append(MetricItem(
            id="station_availability_response_index",
            name="Station Availability Response Index",
            category="EV Charging Metrics",
            source="Jira Cloud",
            value=float(resp_idx) if resp_idx is not None else None,
            formatted_value=f"{resp_idx}%" if resp_idx is not None else "Not Available",
            unit="%",
            description="Quantifies responsiveness of charger availability state transitions and customer reservation handoffs.",
            status=("GOOD" if resp_idx is not None and resp_idx >= 90.0 else ("WARNING" if resp_idx is not None and resp_idx >= 75.0 else ("DANGER" if resp_idx is not None else "UNCONFIGURED"))),
            benchmark="Target >= 90%",
            formula="(Expected Response Time / Actual Response Time) * 100",
            details=jira_res.get("details", {}).get("response")
        ))

        return items

    @staticmethod
    def _compute_quality_score(sonar: Dict[str, Any], jira: Dict[str, Any]) -> (float, str, int):
        """
        Calculates an objective score from 0-100 based on all available verified metrics.
        Returns (score, status_label, configured_count).
        """
        weights = {
            "coverage": 20,
            "bugs": 20,
            "vulnerabilities": 20,
            "duplication": 10,
            "technical_debt": 10,
            "charging_workflow_efficiency": 10,
            "station_availability_response_index": 10
        }

        total_weight = 0
        earned_score = 0.0
        configured_count = 0

        # Check Sonar count
        for k in ["ncloc", "cognitive_complexity", "complexity", "coverage", "duplicated_lines_density", "bugs", "sqale_index", "vulnerabilities"]:
            if sonar.get(k) is not None:
                configured_count += 1

        # Check Jira count
        for k in ["charging_workflow_efficiency", "station_availability_response_index"]:
            if jira.get(k) is not None:
                configured_count += 1

        # Coverage score
        cov = sonar.get("coverage")
        if cov is not None:
            total_weight += weights["coverage"]
            earned_score += weights["coverage"] * min(cov / 100.0, 1.0)

        # Bugs score
        bugs = sonar.get("bugs")
        if bugs is not None:
            total_weight += weights["bugs"]
            earned_score += weights["bugs"] * max(0.0, 1.0 - (bugs * 0.25))

        # Vulnerabilities score
        vuln = sonar.get("vulnerabilities")
        if vuln is not None:
            total_weight += weights["vulnerabilities"]
            earned_score += weights["vulnerabilities"] * max(0.0, 1.0 - (vuln * 0.5))

        # Duplication score
        dup = sonar.get("duplicated_lines_density")
        if dup is not None:
            total_weight += weights["duplication"]
            earned_score += weights["duplication"] * max(0.0, 1.0 - (dup / 10.0))

        # Technical debt score
        debt = sonar.get("sqale_index")
        if debt is not None:
            total_weight += weights["technical_debt"]
            earned_score += weights["technical_debt"] * max(0.0, 1.0 - (debt / 300.0))

        # Workflow efficiency
        wf = jira.get("charging_workflow_efficiency")
        if wf is not None:
            total_weight += weights["charging_workflow_efficiency"]
            earned_score += weights["charging_workflow_efficiency"] * min(wf / 100.0, 1.0)

        # Response index
        resp = jira.get("station_availability_response_index")
        if resp is not None:
            total_weight += weights["station_availability_response_index"]
            earned_score += weights["station_availability_response_index"] * min(resp / 100.0, 1.0)

        if total_weight == 0:
            return 0.0, "Awaiting Integration", configured_count

        final_score = round((earned_score / total_weight) * 100.0, 1)

        if final_score >= 90:
            label = "A (Optimal)"
        elif final_score >= 80:
            label = "B (Good)"
        elif final_score >= 70:
            label = "C (Adequate)"
        elif final_score >= 60:
            label = "D (Needs Attention)"
        else:
            label = "E (Critical Deficits)"

        return final_score, label, configured_count
