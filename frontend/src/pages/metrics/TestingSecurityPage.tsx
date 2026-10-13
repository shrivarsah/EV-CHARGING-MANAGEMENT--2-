import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bug, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { QualityOverview } from '../../types/metrics';
import { metricsService } from '../../services/metricsService';
import { MetricCard } from '../../components/MetricCard';

export const TestingSecurityPage: React.FC = () => {
  const [data, setData] = useState<QualityOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metricsService.getOverview().then(setData).finally(() => setLoading(false));
  }, []);

  const testSecMetrics = data?.metrics.filter(m => m.category === 'Testing & Security') || [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Testing & Security Analysis</h1>
        <p className="page-subtitle">
          Automated test suite coverage and vulnerability audit from SonarQube Cloud: Code Coverage, Known Bugs, and Security Flaws.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading security metrics...
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            {testSecMetrics.map(m => (
              <MetricCard key={m.id} metric={m} />
            ))}
          </div>

          <div className="glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} color="var(--accent-emerald)" />
              Security & Reliability Governance Framework
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--good)' }}>Automated LCOV Line Coverage</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Unit and integration test suites run automatically through pytest and vitest, emitting standard LCOV and XML reports parsed by SonarQube Cloud.
                </p>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--danger)' }}>Zero-Day Security Flaws</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Continuous SAST (Static Application Security Testing) inspection detects injection attacks, cryptographic weaknesses, and broken access controls.
                </p>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--accent-blue)' }}>Quality Gate Enforcement</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Strict automated gating requiring 0 Vulnerabilities, 0 Reliability Bugs, and minimum 80% coverage on new code commits.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
