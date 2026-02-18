import React, { useState, useCallback } from 'react';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import StatsDashboard from './components/StatsDashboard';
import Toast from './components/Toast';

const API_BASE = '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [toasts, setToasts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleTicketCreated = useCallback(() => {
    addToast('Ticket submitted successfully', 'success');
    setRefreshTrigger(t => t + 1);
  }, [addToast]);

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="dot" />
          SUPPORT_SYS
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            Tickets
          </button>
          <button
            className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
        </nav>
      </header>
      <main className="main">
        {activeTab === 'tickets' ? (
          <div className="page-grid">
            <div>
              <div className="section-title">New Ticket</div>
              <TicketForm apiBase={API_BASE} onCreated={handleTicketCreated} addToast={addToast} />
            </div>
            <div>
              <TicketList apiBase={API_BASE} refreshTrigger={refreshTrigger} addToast={addToast} />
            </div>
          </div>
        ) : (
          <StatsDashboard apiBase={API_BASE} refreshTrigger={refreshTrigger} />
        )}
      </main>
      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </div>
  );
}