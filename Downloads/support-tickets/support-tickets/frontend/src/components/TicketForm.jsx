import React, { useState, useRef, useCallback, useEffect } from 'react';

const CATEGORIES = ['billing', 'technical', 'account', 'general', 'hardware'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const INITIAL_FORM = {
  title: '',
  description: '',
  category: '',
  priority: '',
};

export default function TicketForm({ apiBase, onCreated, addToast }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [classifying, setClassifying] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [suggested, setSuggested] = useState({ category: false, priority: false });
  const [csrfToken, setCsrfToken] = useState('');
  const classifyTimer = useRef(null);

  // Get CSRF token on component mount
  useEffect(() => {
    const getCsrfToken = async () => {
      try {
        const res = await fetch(`${apiBase}/csrf/`);
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch {
        console.error('Failed to get CSRF token');
      }
    };
    getCsrfToken();
  }, [apiBase]);

  const classify = useCallback(async (description) => {
    if (description.trim().length < 20) return;
    setClassifying(true);
    setSuggestion(null);
    try {
      const res = await fetch(`${apiBase}/tickets/classify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setSuggestion(data);
      setForm(prev => ({
  ...prev,
  category: data.category?.toLowerCase().includes('account') ? 'account' :
            data.category?.toLowerCase().includes('billing') ? 'billing' :
            data.category?.toLowerCase().includes('technical') ? 'technical' :
            data.category?.toLowerCase().includes('hardware') ? 'hardware' :
            data.category?.toLowerCase().includes('general') ? 'general' :
            prev.category,
  priority: data.priority?.toLowerCase() || prev.priority,
}));

      setSuggested({ category: true, priority: true });
    } catch {
      // silently fail — form still works
    } finally {
      setClassifying(false);
    }
  }, [apiBase]);

  const handleDescriptionBlur = () => {
    if (form.description.trim().length >= 20) {
      classify(form.description);
    }
  };

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, description: val }));
    clearTimeout(classifyTimer.current);
    if (val.trim().length >= 20) {
      classifyTimer.current = setTimeout(() => classify(val), 1200);
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (field === 'category') setSuggested(prev => ({ ...prev, category: false }));
    if (field === 'priority') setSuggested(prev => ({ ...prev, priority: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.priority) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      // Get CSRF token from Django's hidden input
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
      
      const res = await fetch(`${apiBase}/tickets/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        addToast(Object.values(err).flat().join(', '), 'error');
        return;
      }
      setForm(INITIAL_FORM);
      setSuggestion(null);
      setSuggested({ category: false, priority: false });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onCreated();
    } catch {
      addToast('Network error, please try again', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => () => clearTimeout(classifyTimer.current), []);

  const titleLen = form.title.length;

  return (
    <div className="card">
      {success && (
        <div className="success-banner">
          ✓ Ticket submitted successfully
        </div>
      )}

      {classifying && (
        <div className="ai-loading">
          <div className="spinner" />
          AI is classifying your ticket...
        </div>
      )}

      {suggestion && !classifying && (
        <div className="ai-suggestion">
          <span className="ai-icon">◈</span>
          <div className="ai-suggestion-text">
            Ai suggests: <strong>{suggestion.category}</strong> · 
<strong>{suggestion.priority} priority</strong>
            {' '}— you can override below.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            type="text"
            value={form.title}
            onChange={handleChange('title')}
            maxLength={200}
            placeholder="Brief summary of the issue"
            required
          />
          <div className={`char-count ${titleLen > 180 ? 'warning' : ''}`}>
            {titleLen}/200
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            className="form-textarea"
            value={form.description}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            placeholder="Describe the issue in detail... (AI will auto-classify after you type)"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className={`form-select ${suggested.category ? 'suggested-field' : ''}`}
              value={form.category}
              onChange={handleChange('category')}
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority *</label>
            <select
              className={`form-select ${suggested.priority ? 'suggested-field' : ''}`}
              value={form.priority}
              onChange={handleChange('priority')}
              required
            >
              <option value="">Select priority</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ width: '100%' }}
        >
          {submitting ? (
            <><div className="spinner" style={{ width: 12, height: 12 }} />Submitting...</>
          ) : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
