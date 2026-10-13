import { request } from './api';
import {
  QualityOverview, MetricSnapshot, ApiConfig, TestConnectionResponse
} from '../types/metrics';

export const metricsService = {
  async getOverview(): Promise<QualityOverview> {
    return request<QualityOverview>('/metrics/overview');
  },

  async refreshMetrics(): Promise<QualityOverview> {
    return request<QualityOverview>('/metrics/refresh', {
      method: 'POST'
    });
  },

  async getTrends(limit: number = 30): Promise<MetricSnapshot[]> {
    return request<MetricSnapshot[]>(`/metrics/trends?limit=${limit}`);
  },

  async getConfig(): Promise<ApiConfig[]> {
    return request<ApiConfig[]>('/metrics/config');
  },

  async saveConfig(config: Partial<ApiConfig>): Promise<ApiConfig> {
    return request<ApiConfig>('/metrics/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  async testConnection(data: {
    service_name: 'sonarqube' | 'jira';
    base_url: string;
    project_key: string;
    auth_token?: string;
    username_or_email?: string;
    organization?: string;
  }): Promise<TestConnectionResponse> {
    return request<TestConnectionResponse>('/metrics/test-connection', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
