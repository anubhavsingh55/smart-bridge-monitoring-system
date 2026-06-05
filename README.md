Smart Bridge Health Monitoring System
Overview

The Smart Bridge Health Monitoring System is a cloud-based IoT monitoring platform designed to simulate and monitor the structural health of bridges in real time. The system continuously generates sensor readings, stores them in a PostgreSQL database, analyzes bridge conditions, and visualizes the results through an interactive dashboard.

This project demonstrates the integration of IoT simulation, cloud computing, full-stack development, database management, and real-time monitoring technologies.

Features
Real-Time Bridge Monitoring
Continuous sensor data generation
Multi-bridge monitoring support
Live bridge status updates
Data freshness tracking
Health Assessment
Bridge Health Score calculation
Structural condition monitoring
Risk assessment indicators
Automated health evaluation
Alert System
Warning and Critical alerts
Threshold-based monitoring
Real-time status notifications
Bridge condition tracking
Cloud Architecture
Cloud-hosted backend
Cloud-hosted PostgreSQL database
Public REST APIs
Global accessibility
Dashboard & Analytics
Live monitoring dashboard
Sensor data visualization
Bridge performance overview
Historical data storage
Technology Stack
Frontend
React.js
Vite
React Router
Recharts
CSS
Backend
FastAPI
Python
SQLAlchemy
Pydantic
Database
PostgreSQL
Railway PostgreSQL
Cloud & Deployment
Railway
Vercel
Docker
Development Tools
Git
GitHub
HeidiSQL
VS Code
System Architecture
IoT Dataset
     │
     ▼
IoT Sensor Simulator
     │
     ▼
FastAPI Backend (Railway)
     │
     ▼
PostgreSQL Database (Railway)
     │
     ▼
React Dashboard (Vercel)
     │
     ▼
Bridge Monitoring & Analytics
Project Structure
smart-bridge-monitoring-system/

├── backend/
│   ├── app/
│   ├── database/
│   ├── models/
│   ├── schemas/
│   └── api/
│
├── frontend/
│   └── react-app/
│
├── simulator/
│   ├── iot_simulator.py
│   └── requirements.txt
│
├── cleaned_dataset/
│
├── docker/
│
├── README.md
│
└── requirements.txt
Key Sensors Simulated

The system simulates the following bridge sensors:

Sensor	Description
Temperature	Bridge surface temperature
Humidity	Environmental humidity
Vibration	Structural vibration level
Strain	Structural strain measurement
Tilt	Bridge inclination
Battery Level	Sensor battery status
Health Score Logic

Bridge health is calculated using sensor readings and predefined thresholds.

Example:

Healthy: 80–100
Warning: 50–79
Critical: Below 50

Factors considered:

Vibration
Strain
Tilt
Temperature
Sensor battery level
Deployment
Frontend Deployment

Hosted on Vercel:

https://smart-bridge-monitoring-system-jx785iq49.vercel.app?_vercel_share=ArhAaul3imJaSlfp4nkNvIvard5vsWxO

Backend Deployment

Hosted on Railway:
https://railway.com/project/c70e1ee7-0ff1-4e63-8834-52b3a0ca800d/service/2e92ed92-5e47-474f-ac86-e4b230a57232?environmentId=d1066ca5-26b1-42f5-9762-032e3d1c5e1e

Database

Railway PostgreSQL Database

API Endpoints
Create Sensor Reading
POST /api/sensors/readings
Get Latest Readings
GET /api/sensors/readings/latest
Get All Readings
GET /api/sensors/readings
System Health
GET /api/health
Local Setup
Clone Repository
git clone https://github.com/your-username/smart-bridge-monitoring-system.git

cd smart-bridge-monitoring-system
Backend Setup
cd backend

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
Frontend Setup
cd frontend/react-app

npm install

npm run dev
Run Simulator
python simulator/iot_simulator.py


Dashboard
<img width="1917" height="1018" alt="Screenshot 2026-06-05 110133" src="https://github.com/user-attachments/assets/e101b7cf-f214-4a62-8cd5-795c1c86026c" />
<img width="1915" height="866" alt="image" src="https://github.com/user-attachments/assets/467e9418-d83d-4d82-b4ed-d851e55d3ccc" />


Monitoring Center
<img width="1919" height="877" alt="Screenshot 2026-06-05 110357" src="https://github.com/user-attachments/assets/cf8cca5c-210b-4fb4-af07-e88c853d692c" />
<img width="1919" height="1024" alt="Screenshot 2026-06-05 110418" src="https://github.com/user-attachments/assets/b4f4888e-30dc-40a0-b7cb-23edaf9153f1" />

Database
<img width="1919" height="1079" alt="Screenshot 2026-06-05 110506" src="https://github.com/user-attachments/assets/e08ad5a0-2eb1-4e14-821d-c69254fb2cbc" />

API Documentation

<img width="1919" height="884" alt="Screenshot 2026-06-05 110714" src="https://github.com/user-attachments/assets/4d184a0a-5f7e-485a-bfc5-d63e18f7ad1d" />


Learning Outcomes

Through this project, I gained practical experience in:

Full-Stack Development
Cloud Deployment
REST API Development
PostgreSQL Database Management
IoT Data Simulation
React Development
FastAPI Development
Docker Fundamentals
Git & GitHub Workflow
Production Debugging
Cloud-Native Architecture
Future Improvements
Authentication & Authorization
WebSocket Live Updates
Advanced Analytics
Predictive Maintenance
Machine Learning Integration
Mobile Application
Cloud Monitoring
AWS Deployment
Email/SMS Alerts
Report Generation
Author

Anubhav Singh

Bachelor of Technology (B.Tech)
Computer Science & Engineering

GitHub: https://github.com/anubhavsingh55

LinkedIn: https://www.linkedin.com/in/anubhav-singh-b689522a9/

License

This project is developed for educational and learning purposes.
