export type MetricStatus = 'GOOD' | 'WARNING' | 'DANGER' | 'UNCONFIGURED';

export interface MetricItem {
  id: string;
  name: string;
  category: 'Code Quality' | 'Testing & Security' | 'EV Charging Metrics' | string;
  source: 'SonarQube Cloud' | 'Jira Cloud';
  value: number | null;
  formatted_value: string;
  unit: string;
  description: string;
  status: MetricStatus;
  benchmark: string;
  formula?: string | null;
  details?: Record<string, any> | null;
}

export interface QualityOverview {
  overall_score: number;
  status_label: string;
  total_metrics: number;
  configured_metrics: number;
  sonarqube_status: string;
  jira_status: string;
  last_updated: string | null;
  metrics: MetricItem[];
  project_health_summary: string;
}

export interface MetricSnapshot {
  id: number;
  timestamp: string;
  overall_score: number;
  loc?: number | null;
  code_complexity?: number | null;
  cyclomatic_complexity?: number | null;
  coverage?: number | null;
  duplication?: number | null;
  bugs?: number | null;
  technical_debt?: number | null;
  vulnerabilities?: number | null;
  charging_workflow_efficiency?: number | null;
  station_availability_response_index?: number | null;
  status: string;
}

export interface ApiConfig {
  id: number;
  service_name: 'sonarqube' | 'jira';
  base_url: string;
  project_key: string;
  auth_token?: string | null;
  username_or_email?: string | null;
  organization?: string | null;
  custom_fields_json?: string | null;
  is_active: boolean;
  updated_at: string;
}

export interface TestConnectionResponse {
  success: boolean;
  service: string;
  message: string;
  details?: Record<string, any> | null;
}
