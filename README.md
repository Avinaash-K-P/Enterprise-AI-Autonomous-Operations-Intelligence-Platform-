# Enterprise AI Autonomous Operations Intelligence Platform

---

## Tech Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis
- JWT authentication

### Frontend

- React
- Vite
- React Router
- Axios
- Recharts
- CSS modules / custom CSS

### Machine Learning

- Pandas
- NumPy
- Scikit-learn
- Prophet
- Statsmodels
- XGBoost

### Reporting

- CSV export
- PDF export using ReportLab

---

## Database Explanation

The system uses PostgreSQL as the primary relational database. The schema is designed around multi-tenant enterprise isolation, meaning every major business record is connected to a tenant using `tenant_id`.

Core database areas include:

- `users`: Stores user accounts and authentication-related details.
- `tenants`: Stores organizations using the platform.
- `roles`, `permissions`, `user_roles`, `role_permissions`: Support role-based access control.
- `forecast_metrics`: Defines what operational metric is being measured or forecasted.
- `time_series_observations`: Stores uploaded historical dataset rows.
- `forecast_models`: Stores forecasting model configuration.
- `forecast_runs`: Tracks each forecasting execution.
- `forecast_results`: Stores predicted forecast output.
- `anomaly_events`: Stores detected anomalies.
- `simulation_scenarios`: Stores digital twin and scenario simulation results.
- `optimization_recommendations`: Stores AI-generated optimization recommendations.

Most operational tables include:

---

## System Architecture Diagram

```
text

                           ┌──────────────────────────┐
                           │        React Frontend     │
                           │  Dashboard + Analytics UI │
                           └─────────────┬────────────┘
                                         │
                                         │ Axios / JWT
                                         ▼
                           ┌──────────────────────────┐
                           │       FastAPI Backend     │
                           │ Routes + Services + Auth  │
                           └─────────────┬────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
   ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
   │ PostgreSQL       │       │ Redis            │       │ ML Pipeline      │
   │ Persistent Data  │       │ Cache / Queue    │       │ Forecast + AI    │
   └─────────┬────────┘       └──────────────────┘       └─────────┬────────┘
             │                                                      │
             ▼                                                      ▼
   ┌──────────────────┐                               ┌──────────────────────┐
   │ Enterprise Data  │                               │ Model Manager        │
   │ Tenants, Users,  │                               │ Prophet, SARIMA,     │
   │ Metrics, Results │                               │ XGBoost              │
   └──────────────────┘                               └──────────────────────┘
             │
             ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Analytics / Reports / Optimization / Simulation / Anomalies  │
   └──────────────────────────────────────────────────────────────┘
```

---

## Database Explanation

The system uses PostgreSQL as the primary relational database. The schema is designed around multi-tenant enterprise isolation, meaning every major business record is connected to a tenant using `tenant_id`.

Core database areas include:

- `users`: Stores user accounts and authentication-related details.
- `tenants`: Stores organizations using the platform.
- `roles`, `permissions`, `user_roles`, `role_permissions`: Support role-based access control.
- `forecast_metrics`: Defines what operational metric is being measured or forecasted.
- `time_series_observations`: Stores uploaded historical dataset rows.
- `forecast_models`: Stores forecasting model configuration.
- `forecast_runs`: Tracks each forecasting execution.
- `forecast_results`: Stores predicted forecast output.
- `anomaly_events`: Stores detected anomalies.
- `simulation_scenarios`: Stores digital twin and scenario simulation results.
- `optimization_recommendations`: Stores AI-generated optimization recommendations.

Most operational tables include:

```text
tenant_id
```

This ensures tenant-specific analytics, tenant-specific ML models, and organization-level data isolation.

---

## System Architecture Diagram

```text
                           ┌──────────────────────────┐
                           │        React Frontend     │
                           │  Dashboard + Analytics UI │
                           └─────────────┬────────────┘
                                         │
                                         │ Axios / JWT
                                         ▼
                           ┌──────────────────────────┐
                           │       FastAPI Backend     │
                           │ Routes + Services + Auth  │
                           └─────────────┬────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
   ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
   │ PostgreSQL       │       │ Redis            │       │ ML Pipeline      │
   │ Persistent Data  │       │ Cache / Queue    │       │ Forecast + AI    │
   └─────────┬────────┘       └──────────────────┘       └─────────┬────────┘
             │                                                      │
             ▼                                                      ▼
   ┌──────────────────┐                               ┌──────────────────────┐
   │ Enterprise Data  │                               │ Model Manager        │
   │ Tenants, Users,  │                               │ Prophet, SARIMA,     │
   │ Metrics, Results │                               │ XGBoost              │
   └──────────────────┘                               └──────────────────────┘
             │
             ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ Analytics / Reports / Optimization / Simulation / Anomalies  │
   └──────────────────────────────────────────────────────────────┘
```

---

## Dataset Explanation

The platform uses uploaded CSV datasets as historical time-series observations for forecasting, anomaly detection, analytics, and optimization.

Each dataset is linked to a forecast metric using:

```text
metric_id
```

The tenant is not taken from the CSV file. Instead, it is assigned from the authenticated user:

```text
tenant_id = current_user.tenant_id
```

Required CSV columns:

```csv
entity_type,entity_id,timestamp,value,source,quality_flag,metadata
```

Column meaning:

- `entity_type`: Type of entity being measured, such as `facility`, `device`, `business_unit`, or `region`.
- `entity_id`: ID of the specific entity.
- `timestamp`: Time of the observation.
- `value`: Numeric measured value.
- `source`: Source of the data, such as `sensor_gateway`, `iot_sensor`, `erp_system`, or `csv_upload`.
- `quality_flag`: Data quality status such as `valid`, `estimated`, `missing`, `outlier`, or `corrected`.
- `metadata`: Additional JSON context for the observation.

Example:

```csv
entity_type,entity_id,timestamp,value,source,quality_flag,metadata
facility,1,2026-08-01T00:00:00,4200.50,sensor_gateway,valid,"{""unit"":""kWh""}"
facility,1,2026-08-01T01:00:00,4215.25,sensor_gateway,valid,"{""unit"":""kWh""}"
```

The uploaded data is validated, cleaned, and preprocessed before being used by ML models.

---

## Forecasting Methodology

The forecasting engine predicts future operational behavior using tenant-specific time-series data.

Forecasting flow:

```text
Forecast metric
-> Uploaded observations
-> Dataset validation
-> Time-series preprocessing
-> Model training
-> Forecast generation
-> Forecast result storage

The system supports multi-dimensional forecasting through:

metric_id + entity_type + entity_id

This allows forecasting at different enterprise levels, including:
- Resource consumption
- Operational load
- Device-level metrics
- Regional or business-unit trends
- Workforce utilization
- Infrastructure demand
Implemented models:
- Prophet
- SARIMA
- XGBoost
```

---

## Optimization Strategy

The Autonomous AI Optimization Engine generates operational recommendations based on forecast results, anomaly events, simulation outcomes, and root cause insights.
The optimization engine supports recommendations such as:

- Load balancing
- Resource redistribution
- Predictive shutdown
- Cost optimization
- Capacity planning
- Dynamic scheduling
  Each recommendation includes:
- Recommendation type
- Priority and rank
- Confidence score
- Estimated cost savings
- Estimated operational impact
- Estimated resource change
- Estimated performance improvement
- Explanation for why the recommendation was generated
- Action plan for execution

Example recommendation:
Redistribute workload from overloaded assets to healthier available capacity during projected peak windows.
Recommendations are ranked using estimated savings, operational impact, and performance improvement.

---

## Simulation Methodology

The Scenario Simulation and Digital Twin module allows users to simulate enterprise-scale operational disruptions and estimate their impact.
Supported scenario types:

- Sudden traffic spikes
- Facility shutdown
- Extreme weather impact
- Resource shortages
- Device failures
- Workforce reduction
- Demand surges
- Supply chain delays
  Simulation inputs include:
- Scenario type
- Affected entity type and ID
- Time window
- Severity
- Base cost
- Base resource consumption
- Base failure probability
  The simulation engine estimates:
- Operational impact
- Cost increase or decrease
- Resource consumption change
- Failure probability
- Performance degradation
- Predicted savings
  The first version uses a rule-based scoring model with severity multipliers and scenario multipliers to estimate enterprise impact.

---

## Anomaly Detection Techniques

The Enterprise Anomaly Detection System identifies unusual operational behavior from time-series observations.
Detected anomaly types include:

- Operational anomalies
- Device failures
- Resource leakage
- Usage spikes
- Sensor inconsistencies
- Suspicious behavioral patterns
- Long-term degradation trends
  The implemented first version uses statistical deviation detection.
  Detection flow:

Fetch tenant-specific observations
-> Calculate baseline mean and standard deviation
-> Compute anomaly score using z-score
-> Classify severity
-> Generate root-cause hint
-> Store anomaly event

---

## API Documentation

The backend exposes REST APIs using FastAPI. Interactive API documentation is available through Swagger UI.
Local Swagger URL:

```
http://127.0.0.1:8000/docs
```

Main API modules:

### Authentication

POST /auth/register
POST /auth/login
POST /auth/refresh-token
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/profile

### Tenants

POST   /tenants
GET    /tenants
GET    /tenants/{tenant_id}
PUT    /tenants/{tenant_id}
PATCH  /tenants/{tenant_id}
DELETE /tenants/{tenant_id}

### Forecast Metrics

POST   /forecast-metrics
GET    /forecast-metrics
GET    /forecast-metrics/{metric_id}
PUT    /forecast-metrics/{metric_id}
PATCH  /forecast-metrics/{metric_id}
DELETE /forecast-metrics/{metric_id}

### Dataset Upload and Preprocessing

POST /time-series-observations/upload
GET  /time-series-observations/{observation_id}
DELETE /time-series-observations/{observation_id}
GET  /time-series-observations/preprocessed

### Forecasting

POST /forecast-models
GET  /forecast-models
GET  /forecast-models/{model_id}
PUT  /forecast-models/{model_id}
DELETE /forecast-models/{model_id}
POST /forecast-models/{model_id}/run
POST /forecast-models/compare
GET  /forecast-models/runs/{run_id}/results

### Anomaly Detection

POST   /anomalies/detect
GET    /anomalies
GET    /anomalies/{anomaly_id}
PATCH  /anomalies/{anomaly_id}
DELETE /anomalies/{anomaly_id}
Root Cause Analysis
POST /root-cause/analyze/{anomaly_id}
GET  /root-cause/analyze/{anomaly_id}

### Scenario Simulation

POST   /simulations
GET    /simulations
GET    /simulations/{scenario_id}
PATCH  /simulations/{scenario_id}
DELETE /simulations/{scenario_id}
POST   /simulations/{scenario_id}/run

### Optimization Recommendations

POST   /optimizations/generate
GET    /optimizations
GET    /optimizations/{recommendation_id}
PATCH  /optimizations/{recommendation_id}
DELETE /optimizations/{recommendation_id}
POST   /optimizations/{recommendation_id}/apply

### Enterprise Reports

GET /reports/forecast-summary
GET /reports/anomaly-summary
GET /reports/optimization-summary
GET /reports/simulation-summary
GET /reports/executive-dashboard
GET /reports/export/csv
GET /reports/export/pdf

### Analytics Dashboard

GET /dashboard/overview
GET /dashboard/historical-vs-predicted
GET /dashboard/anomaly-heatmap
GET /dashboard/optimization-panel
GET /dashboard/forecast-confidence/{run_id}
GET /dashboard/kpis
GET /dashboard/entity-comparison
GET /dashboard/root-cause-visualization/{anomaly_id}
GET /dashboard/simulation
GET /dashboard/model-performance
All protected APIs require JWT Bearer authentication.

---

### Author

Avinaash K P

Python Developer

---
