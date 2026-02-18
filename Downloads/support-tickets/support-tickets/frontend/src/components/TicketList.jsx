import React, { useState, useEffect, useCallback } from 'react';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const STATUS_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed'],
  closed: [],
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function TicketCard({ ticket, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const nextStatuses = STATUS_TRANSITIONS[ticket.status] || [];

  return (
    <div
      className={`ticket-card ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="ticket-header">
        <div className="ticket-title">{ticket.title}</div>
        <div className="ticket-badges">
          <span className={`badge badge-priority-${ticket.priority}`}>{ticket.priority}</span>
          <span className={`badge badge-cat-${ticket.category}`}>{ticket.category}</span>
          <span className={`badge badge-status-${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="ticket-desc">
        {expanded ? ticket.description : ticket.description.slice(0, 120) + (ticket.description.length > 120 ? '…' : '')}
      </div>

      <div className="ticket-footer">
        <span className="ticket-time">{formatDate(ticket.created_at)}</span>
        {expanded && nextStatuses.length > 0 && (
          <div className="ticket-actions" onClick={e => e.stopPropagation()}>
            {nextStatuses.map(s => (
              <button
                key={s}
                className="status-btn"
                onClick={() => onStatusChange(ticket.id, s)}
              >
                → {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TicketList({ apiBase, refreshTrigger, addToast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '' });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);

    try {
      const res = await fetch(`${apiBase}/tickets/?${params}`);
      const data = await res.json();
      setTickets(data);
    } catch {
      addToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiBase, filters, addToast]);

  useEffect(() => { fetchTickets(); }, [fetchTickets, refreshTrigger]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${apiBase}/tickets/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      addToast(`Ticket marked as ${newStatus.replace('_', ' ')}`, 'success');
    } catch {
      addToast('Failed to update ticket', 'error');
    }
  };

  const setFilter = (key) => (e) => {
    setFilters(prev => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <div>
      <div className="section-title">All Tickets</div>

      <div className="filters">
        <input
          className="form-input"
          type="text"
          placeholder="Search tickets..."
          value={filters.search}
          onChange={setFilter('search')}
        />
        <select className="form-select" value={filters.category} onChange={setFilter('category')}>
          <option value="">All categories</option>
          {['billing', 'technical', 'account', 'general', 'hardware'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="form-select" value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All priorities</option>
          {['low', 'medium', 'high', 'critical'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="form-select" value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="ai-loading" style={{ justifyContent: 'center', padding: '2rem' }}>
          <div className="spinner" />
          Loading tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">◫</div>
          <div className="empty-state-text">No tickets found</div>
        </div>
      ) : (
        <div className="ticket-list">
          {tickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
