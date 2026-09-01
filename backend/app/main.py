from fastapi import FastAPI
from app.routes import(
    auth,
    tenant,
    forecast_metric,
    dataset,
    preprocess,
    forecast_model,
    optimization,
    anomaly,
    root_cause,
    scenario,
    reports,
    analytics
)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Enterprise AI Autonomous Operation Intelligence Platform")

#CORS Confurigation
app.add_middleware(
    CORSMiddleware,
    allow_origins= ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)  

app.include_router(auth.router)
app.include_router(tenant.router)
app.include_router(forecast_metric.router)
app.include_router(dataset.router)
app.include_router(preprocess.router)
app.include_router(forecast_model.router)
app.include_router(optimization.router)
app.include_router(anomaly.router)
app.include_router(root_cause.router)
app.include_router(scenario.router)
app.include_router(reports.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {"message":"Fastapi connected successfully!"}