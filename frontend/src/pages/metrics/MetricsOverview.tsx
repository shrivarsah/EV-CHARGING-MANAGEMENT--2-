import React, { useState, useEffect } from 'react';
import {
  RotateCw, CheckCircle2, AlertCircle, Database, GitPullRequest,
  Sparkles, ShieldCheck, ArrowRight
} from 'lucide-react';
import { QualityOverview } from '../../types/metrics';
import { metricsService } from '../../services/metricsService';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';

interface MetricsOverviewProps {
  onGoToSettings: () => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ onGoToSettings }) => {
  const [data, setData] = useState<QualityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async (refreshSnapshot = false) => {
    if (refreshSnapshot) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = refreshSnapshot
        ? await metricsService.refreshMetrics()
        : await metricsService.getOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Error fetching metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Software Metrics & Quality Dashboard</h1>
          <p className="page-subtitle">
            Enterprise software engineering dashboard featuring 10 verified metrics from SonarQube Cloud and Atlassian Jira Cloud.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => loadMetrics(true)}
            disabled={refreshing}
            className="btn btn-primary btn-sm"
          >
            <RotateCw size={14} className={refreshing ? 'pulse-indicator' : ''} />
            {refreshing ? 'Syncing...' : 'Fetch & Snapshot Now'}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle color="var(--danger)" />
          <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Retrieving live quality measures from SonarQube and Jira endpoints...
        </div>
      ) : data ? (
        <>
          {/* Executive Quality Overview Card */}
          <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <ShieldCheck size={20} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Composite Software Quality Index
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', margin: '0.5rem 0' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {data.overall_score > 0 ? `${data.overall_score}%` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: data.overall_score >= 80 ? 'var(--good)' : 'var(--warning)' }}>
                    Rating: {data.status_label}
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {data.project_health_summary}
                </p>
                {data.last_updated && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    Snapshot Timestamp: {new Date(data.last_updated).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Integration Status Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  External Cloud Integrations
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    <Database size={16} color="var(--accent-blue)" /> SonarQube Cloud
                  </div>
                  <StatusBadge status={data.sonarqube_status} label={data.sonarqube_status} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                    <GitPullRequest size={16} color="var(--accent-indigo)" /> Atlassian Jira Cloud
                  </div>
                  <StatusBadge status={data.jira_status} label={data.jira_status} />
                </div>

                {(data.sonarqube_status !== 'CONNECTED' || data.jira_status !== 'CONNECTED') && (
                  <button onClick={onGoToSettings} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    Configure Tokens in Settings <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 10 Verified Metrics Grid */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem' }}>10 Required Quality & Operational Metrics</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              8 SonarQube Cloud + 2 Jira Cloud
            </span>
          </div>

          <div className="metrics-grid">
            {data.metrics.map(m => (
              <MetricCard key={m.id} metric={m} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};
