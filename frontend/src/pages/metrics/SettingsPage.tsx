import React, { useState, useEffect } from 'react';
import {
  Settings, Database, GitPullRequest, CheckCircle2,
  XCircle, Save, HelpCircle, ShieldCheck
} from 'lucide-react';
import { ApiConfig, TestConnectionResponse } from '../../types/metrics';
import { metricsService } from '../../services/metricsService';

interface SettingsPageProps {
  onRefreshMetrics: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshMetrics }) => {
  const [sonarConfig, setSonarConfig] = useState({
    base_url: 'https://sonarcloud.io',
    project_key: 'shrivarsah_EV-Charging-Station-Management-System',
    organization: 'shrivarsah',
    auth_token: ''
  });

  const [jiraConfig, setJiraConfig] = useState({
    base_url: '',
    project_key: '',
    username_or_email: '',
    auth_token: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Test Connection States
  const [sonarTesting, setSonarTesting] = useState(false);
  const [sonarTestResult, setSonarTestResult] = useState<TestConnectionResponse | null>(null);

  const [jiraTesting, setJiraTesting] = useState(false);
  const [jiraTestResult, setJiraTestResult] = useState<TestConnectionResponse | null>(null);

  useEffect(() => {
    metricsService.getConfig().then(configs => {
      configs.forEach(cfg => {
        if (cfg.service_name === 'sonarqube') {
          setSonarConfig({
            base_url: cfg.base_url || 'https://sonarcloud.io',
            project_key: cfg.project_key || '',
            organization: cfg.organization || '',
            auth_token: cfg.auth_token || ''
          });
        } else if (cfg.service_name === 'jira') {
          setJiraConfig({
            base_url: cfg.base_url || '',
            project_key: cfg.project_key || '',
            username_or_email: cfg.username_or_email || '',
            auth_token: cfg.auth_token || ''
          });
        }
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleTestSonar = async () => {
    setSonarTesting(true);
    setSonarTestResult(null);
    try {
      const res = await metricsService.testConnection({
        service_name: 'sonarqube',
        base_url: sonarConfig.base_url,
        project_key: sonarConfig.project_key,
        auth_token: sonarConfig.auth_token || undefined,
        organization: sonarConfig.organization || undefined
      });
      setSonarTestResult(res);
    } catch (err: any) {
      setSonarTestResult({
        success: false,
        service: 'SonarQube Cloud',
        message: err.message
      });
    } finally {
      setSonarTesting(false);
    }
  };

  const handleTestJira = async () => {
    setJiraTesting(true);
    setJiraTestResult(null);
    try {
      const res = await metricsService.testConnection({
        service_name: 'jira',
        base_url: jiraConfig.base_url,
        project_key: jiraConfig.project_key,
        username_or_email: jiraConfig.username_or_email,
        auth_token: jiraConfig.auth_token || undefined
      });
      setJiraTestResult(res);
    } catch (err: any) {
      setJiraTestResult({
        success: false,
        service: 'Jira Cloud',
        message: err.message
      });
    } finally {
      setJiraTesting(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    try {
      await Promise.all([
        metricsService.saveConfig({
          service_name: 'sonarqube',
          base_url: sonarConfig.base_url,
          project_key: sonarConfig.project_key,
          organization: sonarConfig.organization,
          auth_token: sonarConfig.auth_token || undefined,
          is_active: true
        }),
        metricsService.saveConfig({
          service_name: 'jira',
          base_url: jiraConfig.base_url,
          project_key: jiraConfig.project_key,
          username_or_email: jiraConfig.username_or_email,
          auth_token: jiraConfig.auth_token || undefined,
          is_active: true
        })
      ]);

      setSaveSuccess('API credentials saved securely. Re-evaluating live metrics now...');
      onRefreshMetrics();
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Integration & API Configuration</h1>
        <p className="page-subtitle">
          Configure authentications for real SonarQube Cloud and Atlassian Jira Cloud metrics retrieval.
        </p>
      </div>

      {saveSuccess && (
        <div className="glass-card" style={{ borderColor: 'var(--good-border)', background: 'var(--good-bg)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 color="var(--good)" />
          <div style={{ color: 'var(--good)', fontWeight: 600 }}>{saveSuccess}</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading saved integration configurations...
        </div>
      ) : (
        <form onSubmit={handleSaveAll}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* SonarQube Cloud Card */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', marginBottom: '1.25rem' }}>
                <Database size={22} />
                <h3 style={{ fontSize: '1.15rem' }}>SonarQube Cloud REST API (8 Metrics)</h3>
              </div>

              <div className="form-group">
                <label className="form-label">SonarQube / SonarCloud URL</label>
                <input
                  type="url"
                  required
                  className="form-input"
                  value={sonarConfig.base_url}
                  onChange={e => setSonarConfig({ ...sonarConfig, base_url: e.target.value })}
                  placeholder="https://sonarcloud.io"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Key</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={sonarConfig.project_key}
                  onChange={e => setSonarConfig({ ...sonarConfig, project_key: e.target.value })}
                  placeholder="e.g. your_org_project_name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Organization Key (SonarCloud)</label>
                <input
                  type="text"
                  className="form-input"
                  value={sonarConfig.organization}
                  onChange={e => setSonarConfig({ ...sonarConfig, organization: e.target.value })}
                  placeholder="e.g. shrivarsah"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SonarQube User Token</label>
                <input
                  type="password"
                  className="form-input"
                  value={sonarConfig.auth_token}
                  onChange={e => setSonarConfig({ ...sonarConfig, auth_token: e.target.value })}
                  placeholder="Paste SonarCloud token (leave blank to keep existing)"
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Generate in: SonarCloud → My Account → Security → Generate Token
                </div>
              </div>

              {sonarTestResult && (
                <div style={{ padding: '0.75rem', borderRadius: '6px', background: sonarTestResult.success ? 'var(--good-bg)' : 'var(--danger-bg)', border: `1px solid ${sonarTestResult.success ? 'var(--good-border)' : 'var(--danger-border)'}`, marginBottom: '1rem', fontSize: '0.85rem', color: sonarTestResult.success ? 'var(--good)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sonarTestResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span>{sonarTestResult.message}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleTestSonar}
                  disabled={sonarTesting}
                  className="btn btn-secondary btn-sm"
                >
                  {sonarTesting ? 'Testing Connectivity...' : 'Test SonarQube Connection'}
                </button>
              </div>
            </div>

            {/* Jira Cloud Card */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-indigo)', marginBottom: '1.25rem' }}>
                <GitPullRequest size={22} />
                <h3 style={{ fontSize: '1.15rem' }}>Atlassian Jira Cloud API (2 Custom Metrics)</h3>
              </div>

              <div className="form-group">
                <label className="form-label">Jira Instance URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={jiraConfig.base_url}
                  onChange={e => setJiraConfig({ ...jiraConfig, base_url: e.target.value })}
                  placeholder="https://your-domain.atlassian.net"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Key</label>
                <input
                  type="text"
                  className="form-input"
                  value={jiraConfig.project_key}
                  onChange={e => setJiraConfig({ ...jiraConfig, project_key: e.target.value.toUpperCase() })}
                  placeholder="e.g. EVC"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Atlassian Account Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={jiraConfig.username_or_email}
                  onChange={e => setJiraConfig({ ...jiraConfig, username_or_email: e.target.value })}
                  placeholder="name@organization.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Atlassian API Token</label>
                <input
                  type="password"
                  className="form-input"
                  value={jiraConfig.auth_token}
                  onChange={e => setJiraConfig({ ...jiraConfig, auth_token: e.target.value })}
                  placeholder="Paste Atlassian API Token (leave blank to keep existing)"
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Generate in: id.atlassian.com/manage-profile/security/api-tokens
                </div>
              </div>

              {jiraTestResult && (
                <div style={{ padding: '0.75rem', borderRadius: '6px', background: jiraTestResult.success ? 'var(--good-bg)' : 'var(--danger-bg)', border: `1px solid ${jiraTestResult.success ? 'var(--good-border)' : 'var(--danger-border)'}`, marginBottom: '1rem', fontSize: '0.85rem', color: jiraTestResult.success ? 'var(--good)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {jiraTestResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span>{jiraTestResult.message}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleTestJira}
                  disabled={jiraTesting}
                  className="btn btn-secondary btn-sm"
                >
                  {jiraTesting ? 'Testing Connectivity...' : 'Test Jira Connection'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              <Save size={16} />
              {saving ? 'Saving Configurations...' : 'Save API Configurations'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
