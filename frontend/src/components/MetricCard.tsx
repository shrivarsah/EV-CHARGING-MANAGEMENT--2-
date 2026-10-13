import React from 'react';
import { MetricItem } from '../types/metrics';
import { StatusBadge } from './StatusBadge';
import { Database, GitPullRequest } from 'lucide-react';

interface MetricCardProps {
  metric: MetricItem;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const isSonar = metric.source === 'SonarQube Cloud';

  return (
    <div className="metric-card">
      <div>
        <div className="metric-card-header">
          <div className="metric-card-title">{metric.name}</div>
          <span className={`metric-source-badge ${isSonar ? 'badge-sonarqube' : 'badge-jira'}`}>
            {isSonar ? <Database size={11} /> : <GitPullRequest size={11} />}
            {metric.source}
          </span>
        </div>

        <div className="metric-value-row">
          <div className="metric-value">
            {metric.formatted_value}
          </div>
          <StatusBadge status={metric.status} />
        </div>

        <p className="metric-desc">{metric.description}</p>

        {metric.formula && (
          <div className="metric-formula-box">
            <span>Formula: {metric.formula}</span>
          </div>
        )}
      </div>

      <div className="metric-benchmark">
        <span>Benchmark:</span> {metric.benchmark}
      </div>
    </div>
  );
};
