# ANPR.CITY — Multi-Camera Vehicle Trajectory & Urban Traffic Intelligence

### Smart India Hackathon 2026 | SIH26127

> A centralized AI-powered platform that transforms fragmented ANPR/CCTV observations into cross-camera vehicle trajectories, real-time alerts, and city-wide traffic intelligence.

---

## 🚦 Overview

ANPR.CITY is a city-scale vehicle intelligence and urban traffic analytics platform designed to unify data from multiple ANPR/CCTV cameras into a single command grid.

Instead of treating every camera as an isolated system, ANPR.CITY correlates vehicle observations across cameras to reconstruct movement trajectories, generate blacklist alerts, and provide traffic analytics through an interactive GIS dashboard.

### Core idea

**Camera-level detection → Cross-camera correlation → Vehicle trajectory → Actionable city intelligence**

The platform is designed for:

- Traffic Control Operators
- Law-Enforcement Investigators
- Urban Traffic Planners
- City Command Centers
- Smart City infrastructure

---

## 🎯 Problem Statement

### SIH Problem Statement

**SIH26127 — City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking & Urban Traffic Analytics**

Existing ANPR/CCTV deployments can become fragmented across different camera systems and vendors. A vehicle may be detected by multiple cameras, but those observations are often difficult to correlate into one continuous movement history.

ANPR.CITY addresses this fragmentation by providing a centralized intelligence layer for:

- Multi-camera vehicle tracking
- Trajectory reconstruction
- GIS-based investigation
- Blacklist and alert management
- Traffic movement analytics
- Camera network monitoring

---

## 💡 Solution

ANPR.CITY combines ANPR detection events from multiple cameras and associates them using timestamps, camera locations, and vehicle identifiers.

Each detection can contain:

- License plate
- Camera ID
- Timestamp
- Location
- Speed
- Recognition confidence

The trajectory engine chronologically correlates observations and reconstructs a vehicle's movement across cameras.

Investigators can search for a vehicle and visualize its movement on a GIS map, while traffic operators can monitor alerts and city-wide activity from the same command interface.

---

## ✨ Key Features

### 🛰️ Multi-Camera Trajectory Tracking

Reconstruct a vehicle's movement across multiple cameras and visualize its route on a map.

### 🗺️ GIS Command Grid

Interactive map-based visualization using Leaflet and OpenStreetMap.

### 🚨 Real-Time Alerts

Detect and display blacklist-related vehicle observations and operational alerts.

### 📋 Blacklist Management

Maintain a configurable list of vehicles requiring attention.

### 📊 Urban Traffic Analytics

Analyze:

- Detection volume
- Camera activity
- Hourly traffic trends
- Vehicle movement patterns
- Origin-destination flows
- Congestion indicators

### 📹 Camera Network Monitoring

Monitor connected cameras and their operational status from a centralized dashboard.

### 🔐 Role-Based Authentication

JWT-based authentication with role-based access control.

### 🧾 Audit & Privacy Controls

The architecture supports role-based access, audit trails, configurable retention, and encrypted data handling.

---

## 🖥️ Dashboard Modules

ANPR.CITY provides a command-center style interface containing:

- **Live Operations**
- **Trajectory Tracker**
- **Camera Network**
- **Detection Feed**
- **Alerts**
- **Blacklist**
- **Analytics**

---

## 🧠 Vehicle Intelligence

The platform is designed to move beyond individual plate detections.

### Trajectory

A trajectory represents the movement of a vehicle within a selected time window.

Example:

Camera A
↓
Camera B
↓
Camera C
↓
Camera D

The system calculates chronological hops, distance, and movement between observations.

### Vehicle Behaviour Profile

Historical observations can be aggregated to identify recurring movement patterns such as:

- Frequently observed cameras
- Repeated corridors
- Observation frequency
- Peak activity periods
- Historical movement patterns

> The platform analyzes vehicle observations and movement patterns. Driver or facial identification is outside the scope of this project.

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │   ANPR / CCTV       │
                    │      Cameras        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   OCR / Detection   │
                    │      Ingestion      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Deduplication &      │
                    │ Confidence Filtering │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      MongoDB         │
                    │    Detection Store   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Trajectory Engine    │
                    │ Haversine +          │
                    │ Chronological Order  │
                    └──────────┬──────────┘
                               │
                               ▼
          ┌────────────────────────────────────────┐
          │          ANPR.CITY COMMAND GRID        │
          ├────────────┬───────────┬───────────────┤
          │ Live Ops   │ Trajectory│ Alerts        │
          │ Detection  │ GIS Map   │ Blacklist     │
          │ Analytics  │           │ Camera Network│
          └────────────┴───────────┴───────────────┘

🛠️ Technology Stack
Frontend
React 19
React Router
Tailwind CSS
shadcn/ui
Recharts
Leaflet
OpenStreetMap
Backend
Python 3.11
FastAPI
Motor
PyJWT
bcrypt
REST APIs
Database
MongoDB
AI/ML Production Path
YOLOv8
PaddleOCR / CRNN
Kafka
Cross-camera Re-ID
Trajectory graph storage
Deployment
Vercel-ready frontend
Docker/Kubernetes-ready backend architecture
Cloud / On-premise / Hybrid deployment

📂 Project Structure
city-wide-anpr-main/
│
├── backend/
│   ├── server.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── craco.config.js
│
├── .gitignore
├── package.json
└── README.md


⚙️ Local Development
Prerequisites
Node.js
npm
Python 3.11+
MongoDB / MongoDB Atlas

1. Clone the repository
git clone https://github.com/inshalnasim141-del/city-wide-anpr.git
cd city-wide-anpr
2. Backend setup
cd backend
pip install -r requirements.txt

Configure the required environment variables:

MONGO_URL=your_mongodb_connection_string
DB_NAME=anpr_city
JWT_SECRET=your_jwt_secret

ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_admin_password

OPERATOR_EMAIL=your_operator_email
OPERATOR_PASSWORD=your_operator_password

INVESTIGATOR_EMAIL=your_investigator_email
INVESTIGATOR_PASSWORD=your_investigator_password

Start the FastAPI server:

uvicorn server:app --reload
3. Frontend setup

Open another terminal:

cd frontend
npm install

Create the required frontend environment configuration:

REACT_APP_BACKEND_URL=http://localhost:8000

Then start the frontend:

npm start
🔐 Environment Variables
Backend
Variable	Description
MONGO_URL	MongoDB Atlas connection string
DB_NAME	MongoDB database name
JWT_SECRET	JWT signing secret
ADMIN_EMAIL	Admin account email
ADMIN_PASSWORD	Admin account password
OPERATOR_EMAIL	Operator account email
OPERATOR_PASSWORD	Operator account password
INVESTIGATOR_EMAIL	Investigator account email
INVESTIGATOR_PASSWORD	Investigator account password
Frontend
Variable	Description
REACT_APP_BACKEND_URL	Public backend API URL

Never commit .env files, MongoDB credentials, JWT secrets, or account passwords to GitHub.

📊 Prototype

The current prototype demonstrates:

JWT authentication
20 seeded cameras
Approximately 800 seeded detections
Vehicle trajectory reconstruction
Blacklist alerts
Analytics dashboard
Camera monitoring
GIS trajectory visualization
End-to-end backend testing
🌍 Use Cases
Traffic Management

Analyze traffic movement and identify high-volume corridors.

Law Enforcement

Search vehicle observations and reconstruct movement across camera locations.

Smart Cities

Integrate ANPR intelligence into centralized city command centers.

Highways

Monitor vehicle movement across multiple checkpoints.

Logistics

Analyze vehicle movement through logistics hubs and controlled facilities.

Parking & Tolling

Extend the same intelligence layer to vehicle access, parking, and tolling systems.

📈 Benefits
Operational
Centralized command interface
Faster vehicle investigation
Reduced dependence on siloed camera consoles
Improved situational awareness
Economic
Reduced manual monitoring effort
Better traffic planning
Improved logistics efficiency
Environmental
Traffic analytics can support congestion reduction
Origin-destination insights can support public transport optimization
Strategic

ANPR.CITY is designed as a reusable civic-tech intelligence layer that can integrate with broader smart-city systems.

🔒 Security & Privacy

Security is considered as part of the platform architecture.

The system supports:

JWT authentication
Role-based access control
Password hashing using bcrypt
Audit trails
Configurable data retention
Encryption in transit and at rest
Controlled access to investigation functions

The platform is intended for authorized operational use and should be deployed according to applicable privacy, legal, and data-retention requirements.

🚀 Roadmap
Current
 Authentication
 Live Operations dashboard
 Camera Network
 Detection Feed
 Blacklist
 Alerts
 Trajectory Tracker
 GIS visualization
 Traffic Analytics
Next
 Live CCTV/RTSP connectors
 Production ANPR inference
 Streaming infrastructure
 Advanced cross-camera Re-ID
 Distributed city-scale deployment
 Production SSO/MFA
 Smart-city system integrations
Future
 Advanced anomaly detection
 Predictive traffic intelligence
 Corridor forecasting
 Expanded city integrations
 Edge AI inference
🏆 Smart India Hackathon 2026

Team: Night Raid

Problem Statement ID: SIH26127

Problem Statement: City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking & Urban Traffic Analytics

Theme: Transportation & Logistics / Smart Automation

Category: Software

Solution: ANPR.CITY — Multi-Camera Vehicle Trajectory & Urban Traffic Intelligence

📚 References
Ultralytics YOLO
PaddleOCR
License Plate Detection & Recognition research
Cross-camera vehicle Re-ID research
ANPR and Intelligent Transportation System research
Smart City / Traffic Management research
Applicable privacy and data protection frameworks
👥 Team
Team Night Raid

Built for Smart India Hackathon 2026.

📄 License

This project is developed as part of Smart India Hackathon 2026.

Add an appropriate open-source license here if the project is intended for public reuse.


### One important change I'd make before publishing

I **would not put actual demo passwords in the README**. Your repository is public, and you've just configured MongoDB/authentication. Keep credentials only in Vercel/backend environment variables.

Also, I deliberately described the **YOLOv8 → PaddleOCR → Kafka → Re-ID pipeline as the production path**, rather than claiming that the current deployed prototype is doing all of that live. Your SIH document itself distinguishes that production path from the current working prototype. :contentReference[oaicite:1]{index=1}

The README's prototype claims—JWT authentication, 20 seeded cameras, ~800 detections, trajectory reconstruction, blacklist alerts and analytics—are also directly supported by your SIH material. :contentReference[oaicite:2]{index=2}

**One more recommendation:** add 2–3 screenshots/GIFs of your actual deployed dashboard near the top of the README. That will make the GitHub repo look substantially more professional to SIH judges.
