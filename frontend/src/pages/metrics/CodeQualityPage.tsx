import React, { useState, useEffect } from 'react';
import { Code2, GitFork, Copy, Wrench, FileCode, CheckCircle2 } from 'lucide-react';
import { QualityOverview, MetricItem } from '../../types/metrics';
import { metricsService } from '../../services/metricsService';
import { MetricCard } from '../../components/MetricCard';

export const CodeQualityPage: React.FC = () => {
  const [data, setData] = useState<QualityOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metricsService.getOverview().then(setData).finally(() => setLoading(false));
  }, []);

  const codeMetrics = data?.metrics.filter(m => m.category === 'Code Quality') || [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Code Quality & Architecture</h1>
        <p className="page-subtitle">
          In-depth architectural analysis from SonarQube Cloud: Lines of Code, Cognitive Complexity, Cyclomatic Complexity, Duplication, and Technical Debt.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading code quality metrics...
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            {codeMetrics.map(m => (
              <MetricCard key={m.id} metric={m} />
            ))}
          </div>

          {/* Deep Dive Engineering Analysis */}
          <div className="glass-card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code2 size={20} color="var(--accent-emerald)" />
              Architectural Complexity Analysis: Cognitive vs. Cyclomatic
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Cognitive Complexity (SonarQube)</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Measures human readability and comprehension effort by penalizing nested control flow structures (nested loops, ternary expressions, recursion).
                  A lower score ensures modern maintainability for agile teams.
                </p>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--good)' }}>
                  Industry Benchmark: &lt; 50 per critical module
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--accent-indigo)', marginBottom: '0.5rem' }}>Cyclomatic Complexity (McCabe)</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Calculates the exact number of linearly independent paths through the control graph (M = E − N + 2P).
                  Directly defines the minimum number of unit test cases needed to achieve branch coverage.
                </p>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--good)' }}>
                  Industry Benchmark: &lt; 60 repository aggregate
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
