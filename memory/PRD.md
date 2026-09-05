# PRD — City-Wide ANPR Trajectory Engine

## Original Problem Statement
Build a Vercel-ready full-stack web application with a vehicle route tracking system, based on the attached City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking & Urban Traffic Analytics PRD.

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB). All routes prefixed `/api`. JWT auth (12h access token via httpOnly cookie + Bearer header fallback). Role-based access.
- **Frontend**: React 19 + React Router + Tailwind + shadcn/ui + Recharts + Leaflet.
- **Database**: MongoDB. String `id` fields (no ObjectId leakage).
- **Deployment ready for Vercel**: frontend uses `REACT_APP_BACKEND_URL`, backend uses env vars only.

## User Personas / Roles
- **Admin** (`admin@anpr.city / Admin@123`) — full access, user & blacklist management.
- **Investigator** (`investigator@anpr.city / Investigator@123`) — trajectory tracking, alerts triage, blacklist management.
- **Operator** (`operator@anpr.city / Operator@123`) — live monitoring, alerts triage only (no blacklist writes).

## Core Requirements (static)
- Multi-camera ANPR ingestion (simulated).
- Cross-camera single-vehicle trajectory reconstruction.
- Blacklist / watchlist with real-time alerts.
- GIS-based map for camera network & trajectory playback.
- Traffic analytics: KPIs, hourly volume, top cameras.
- RBAC + audit trail entries on alert actions.

## Implemented (v1 — Feb 2026)
- JWT auth, 3 seeded roles, /me endpoint, cookie + Bearer support.
- 20 seeded cameras in Bengaluru region with online/offline status.
- ~800 seeded detections in last 24h + 8-hop demo trajectory for first plate.
- Live dashboard with 4 KPIs, streaming detection feed, active alerts panel, 24h flow area chart.
- Vehicle Trajectory Tracker: plate search + time window + Leaflet dark map with cyan dashed polyline, hop-by-hop timeline with distance/time/avg-speed, CSV export.
- Camera Network map with online/offline filter + node registry.
- Detection Feed (all reads, plate filter).
- Alerts triage: Open/Acknowledged/Escalated/Closed tabs with Ack/Escalate/Close workflow.
- Blacklist registry with priority (low/medium/high/critical), add/remove (RBAC).
- Analytics: KPIs, hourly volume chart, top-8 cameras bar chart.
- Auto-simulator on dashboard (creates 3 detections every 4s, fires blacklist alerts on hit).

## Prioritized Backlog (P0/P1/P2)
- **P1** — Real ANPR from image via vision model (currently simulated).
- **P1** — Origin-Destination matrix + heat-map overlay on Camera Network map.
- **P1** — Anomaly detection (unusual routes, restricted zones, over-speed).
- **P2** — Multi-plate correlation for investigative analysis.
- **P2** — PDF trajectory export (currently CSV only).
- **P2** — WebSocket push for live alerts (currently 4-5s polling).
- **P2** — Admin console: user management, camera CRUD, audit log viewer.
- **P2** — Vehicle classification & filter (car/truck/motorcycle) already stored, not surfaced in UI filters.

## Testing
- Backend: 11/11 areas verified via testing agent (auth, RBAC, cameras, detections, trajectory, blacklist, alerts, analytics, health).
- Frontend: manually screenshot-verified (login, live dashboard, trajectory map + hop timeline).
