import React, { useState, useEffect } from 'react';
import { GitPullRequest, Calculator, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { QualityOverview } from '../../types/metrics';
import { metricsService } from '../../services/metricsService';
import { MetricCard } from '../../components/MetricCard';

export const EVMetricsPage: React.FC = () => {
  const [data, setData] = useState<QualityOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metricsService.getOverview().then(setData).finally(() => setLoading(false));
  }, []);

  const jiraMetrics = data?.metrics.filter(m => m.source === 'Jira Cloud') || [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">EV Charging Metrics (Jira Integration)</h1>
        <p className="page-subtitle">
          Real-time custom operational indexes retrieved directly from Atlassian Jira Cloud project tracking issues.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Retrieving live Jira custom metrics...
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            {jiraMetrics.map(m => (
              <MetricCard key={m.id} metric={m} />
            ))}
          </div>

          {/* Mathematical Formulations & Operational Rationale */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {/* Metric 9 Breakdown */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-indigo)', marginBottom: '0.75rem' }}>
                <Calculator size={20} />
                <h3 style={{ fontSize: '1.1rem' }}>Metric 9: Charging Workflow Efficiency</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Measures the precision and velocity of the end-to-end vehicle charging workflow execution compared to planned engineering benchmarks.
              </p>

              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Mathematical Formula
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  (Expected Workflow Time / Actual Workflow Time) × 100
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong>Jira Source of Truth:</strong> Pulled from custom Jira time estimation fields or logged worklogs across charging workflow feature issues. An index &gt;= 90% denotes high operational agility.
              </div>
            </div>

            {/* Metric 10 Breakdown */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
                <Clock size={20} />
                <h3 style={{ fontSize: '1.1rem' }}>Metric 10: Station Availability Response Index</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Quantifies the latency and responsiveness of charger availability state transitions and customer reservation handoffs.
              </p>

              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Mathematical Formula
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  (Expected Response Time / Actual Response Time) × 100
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <strong>Jira Source of Truth:</strong> Sourced from Jira issue SLA tracking or custom availability response time logs. A target &gt;= 90% ensures real-time charger bay updates without stale telemetry.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
