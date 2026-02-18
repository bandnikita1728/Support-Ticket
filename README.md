# Support Ticket System

A full-stack support ticket management system with AI-powered triage using Gemini (Google).

## Quick Start

```bash
# Clone / unzip project
cd support-tickets

# (Optional) Set your Gemini API key for AI classification
export GEMINI_API_KEY=your_gemini_key_hereere

# Start everything
docker-compose up --build
```

**Frontend**: http://localhost:3000
**Backend API**: http://localhost:8000/api/

The app works fully without an API key — LLM classification feature simply won't be available.

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | React 18 |
| Backend | Django 4.2 + Django REST Framework |
| Database | PostgreSQL 15 |
| LLM | Google Gemini (gemini-2.5-flash) |
| Infrastructure | Docker + Docker Compose |

## LLM Choice: Google Gemini (gemini-2.5-flash)

I chose Gemini for several key advantages:

1. **Cost Efficiency**: Gemini models offer competitive pricing with excellent performance-to-cost ratio
2. **Speed & Performance**: Flash-optimized models provide sub-second response times, perfect for real-time classification
3. **Google Ecosystem**: Native integration with Google's robust infrastructure and monitoring tools
4. **Reliability**: Proven track record of consistent JSON output and structured responses
5. **Scalability**: Google's global infrastructure ensures high availability and low latency worldwide

## Prompt Design

The classify endpoint uses a structured prompt that:
- Defines valid output values explicitly (no hallucinated categories)
- Provides clear, business-relevant triage guidelines for each category/priority
- Instructs the model to return only raw JSON (no markdown fences, no preamble)
- Validates response programmatically and rejects invalid values
- Optimized for Gemini's response format and performance characteristics

If LLM is unavailable, times out, returns malformed JSON, or returns invalid enum values, classify endpoint returns HTTP 503 and the frontend continues to work normally — the user just fills in category and priority manually.

## Design Decisions

### Backend
- **Function-based views** over class-based: simpler and more explicit for a small API surface
- **DB-level aggregation**: `/stats/` endpoint uses Django ORM `aggregate`/`annotate` and a `TruncDate` subquery — no Python-level loops
- **Graceful LLM failure**: any exception in classification is caught and logged; endpoint returns 503 rather than 500, which the frontend handles silently

### Frontend
- **Debounced classification**: classification fires 1.2s after the user stops typing OR on blur — balances responsiveness with API call frequency
- **Optimistic UI**: status changes update the local state immediately after a successful API call, avoiding a full list reload
- **Suggested field highlight**: fields pre-filled by AI are subtly highlighted with an accent glow so users know they can override

### Data Model
All constraints are enforced at the DB level via Django's `CharField(choices=...)` — Django applies a `CHECK` constraint on supported databases. The `max_length=200` on title maps to a `VARCHAR(200)` column.

## Features

- **AI-Powered Classification**: Automatic category and priority suggestions based on ticket descriptions
- **Real-time Updates**: Ticket status changes reflect immediately across all connected clients
- **Search & Filtering**: Find tickets by category, priority, status, or search terms
- **Analytics Dashboard**: Visual breakdown of tickets by priority, category, and trends over time
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations and transitions

## Recent Updates

### Vite Migration (2026-02-18)
- **Switched from react-scripts to Vite** for faster builds and better development experience
- **Fixed build configuration** - Resolved entry module and output directory issues
- **Enhanced development workflow** - Hot reload and optimized production builds

### UI Enhancements (2026-02-18)
- **Added Hardware Category** - Extended AI classification to support hardware-related issues
- **Improved Layout** - Side-by-side view with form and ticket list
- **CSRF Protection** - Secure ticket submission with proper token handling
- **Visual Feedback** - AI suggestions highlighted with subtle accent glow
- **Better UX** - Immediate UI updates without full page reloads

## Repository

**GitHub**: https://github.com/bandnikita1728/Support-Ticket.git
**Main Branch**: `main`
**Last Updated**: 2026-02-18

---

Built with  using modern web technologies and AI-powered intelligence.
