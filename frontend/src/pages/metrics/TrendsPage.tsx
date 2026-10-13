import React, { useState, useEffect } from 'react';
import { LineChart as LineChartIcon, History, Calendar, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import { MetricSnapshot } from '../../types/metrics';
import { metricsService } from '../../services/metricsService';
import { StatusBadge } from '../../components/StatusBadge';

export const TrendsPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const data = await metricsService.getTrends(30);
      setSnapshots(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, []);

  const chartData = snapshots.map(s => ({
    time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: s.overall_score,
    coverage: s.coverage || 0,
    duplication: s.duplication || 0,
    bugs: s.bugs || 0,
    debt: s.technical_debt || 0,
    efficiency: s.charging_workflow_efficiency || 0,
    responseIndex: s.station_availability_response_index || 0
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Historical Trends & Snapshots</h1>
          <p className="page-subtitle">
            Longitudinal trend analysis tracking quality evolution across real SonarQube & Jira database snapshots.
          </p>
        </div>
        <button onClick={loadTrends} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} /> Refresh Snapshots
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Retrieving historical metric snapshots...
        </div>
      ) : snapshots.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <History size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3>No Historical Snapshots Recorded Yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0.75rem auto 1.5rem auto' }}>
            Historical snapshots are created whenever you click "Fetch & Snapshot Now" on the Overview page or configure real API credentials.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Chart 1: Quality Score Trend */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Overall Software Quality Score Trend</h3>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#scoreGrad)" name="Quality Score (%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Code Coverage vs Duplication */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Code Coverage & Duplication Density (%)</h3>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="coverage" stroke="#38bdf8" strokeWidth={2} name="Coverage (%)" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="duplication" stroke="#f87171" strokeWidth={2} name="Duplication (%)" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Jira Operational Metrics */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Jira Custom Operational Metrics Index (%)</h3>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis domain={[0, 110]} stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="efficiency" stroke="#818cf8" strokeWidth={2} name="Charging Efficiency (%)" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="responseIndex" stroke="#10b981" strokeWidth={2} name="Response Index (%)" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Reliability & Technical Debt */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Bugs & Technical Debt (Minutes)</h3>
              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="bugs" stroke="#f59e0b" strokeWidth={2} name="Bugs" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="debt" stroke="#a855f7" strokeWidth={2} name="Technical Debt (min)" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Historical Snapshots Table */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>Recorded Historical Snapshot Audit Log ({snapshots.length})</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Quality Score</th>
                    <th>LOC</th>
                    <th>Coverage</th>
                    <th>Duplication</th>
                    <th>Bugs</th>
                    <th>Debt</th>
                    <th>Workflow Efficiency</th>
                    <th>Response Index</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(s.timestamp).toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-emerald)' }}>{s.overall_score}%</td>
                      <td>{s.loc ? `${s.loc.toLocaleString()} LOC` : '—'}</td>
                      <td>{s.coverage !== null ? `${s.coverage}%` : '—'}</td>
                      <td>{s.duplication !== null ? `${s.duplication}%` : '—'}</td>
                      <td>{s.bugs !== null ? s.bugs : '—'}</td>
                      <td>{s.technical_debt !== null ? `${s.technical_debt}m` : '—'}</td>
                      <td>{s.charging_workflow_efficiency !== null ? `${s.charging_workflow_efficiency}%` : '—'}</td>
                      <td>{s.station_availability_response_index !== null ? `${s.station_availability_response_index}%` : '—'}</td>
                      <td><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
