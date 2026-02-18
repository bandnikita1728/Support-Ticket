import React, { useState, useEffect } from 'react';

const PRIORITY_COLORS = {
  low: 'var(--priority-low)',
  medium: 'var(--priority-medium)',
  high: 'var(--priority-high)',
  critical: 'var(--priority-critical)',
};

const CATEGORY_COLORS = {
  billing: 'var(--cat-billing)',
  technical: 'var(--cat-technical)',
  account: 'var(--cat-account)',
  general: 'var(--cat-general)',
  hardware: 'var(--cat-hardware)',
};

function BreakdownRow({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="breakdown-row">
      <span className="badge" style={{ background: `${color}22`, color, minWidth: 80, textAlign: 'center' }}>{label}</span>
      <div className="breakdown-bar-wrap">
        <div className="breakdown-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="breakdown-count">{count}</span>
    </div>
  );
}

export default function StatsDashboard({ apiBase, refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/tickets/stats/`);
        const data = await res.json();
        setStats(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase, refreshTrigger]);

  if (loading) return (
    <div className="ai-loading" style={{ justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner" />
      Loading stats...
    </div>
  );

  if (!stats) return <div className="empty-state"><div className="empty-state-text">Could not load stats</div></div>;

  const totalPriority = Object.values(stats.priority_breakdown).reduce((a, b) => a + b, 0);
  const totalCategory = Object.values(stats.category_breakdown).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="section-title">Overview</div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value accent">{stats.total_tickets}</div>
          <div className="stat-label">Total Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.open_tickets}</div>
          <div className="stat-label">Open Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avg_tickets_per_day}</div>
          <div className="stat-label">Avg / Day</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.total_tickets > 0 ? Math.round((stats.open_tickets / stats.total_tickets) * 100) : 0}%</div>
          <div className="stat-label">Open Rate</div>
        </div>
      </div>

      <div className="breakdown-grid">
        <div className="breakdown-card">
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>By Priority</div>
          {Object.entries(stats.priority_breakdown).map(([p, count]) => (
            <BreakdownRow
              key={p}
              label={p}
              count={count}
              total={totalPriority}
              color={PRIORITY_COLORS[p]}
            />
          ))}
        </div>
        <div className="breakdown-card">
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>By Category</div>
          {Object.entries(stats.category_breakdown).map(([c, count]) => (
            <BreakdownRow
              key={c}
              label={c}
              count={count}
              total={totalCategory}
              color={CATEGORY_COLORS[c]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
