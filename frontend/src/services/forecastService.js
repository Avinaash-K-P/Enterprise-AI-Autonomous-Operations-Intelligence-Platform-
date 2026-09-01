import api from "./api";

// ==========================================
// CREATE FORECAST MODEL
// POST /forecast-models
// ==========================================

export const createForecastModel = async (payload) => {
    const response = await api.post(
        "/forecast-models",
        payload
    );

    return response.data;
};


// ==========================================
// GET ALL FORECAST MODELS
// GET /forecast-models
// ==========================================

export const getForecastModels = async () => {
    const response = await api.get(
        "/forecast-models"
    );

    return response.data;
};


// ==========================================
// GET FORECAST MODEL BY ID
// GET /forecast-models/{model_id}
// ==========================================

export const getForecastModelById = async (modelId) => {
    const response = await api.get(
        `/forecast-models/${modelId}`
    );

    return response.data;
};


// ==========================================
// RUN FORECAST MODEL
// POST /forecast-models/{model_id}/run
// ==========================================

export const runForecastModel = async (
    modelId,
    entityId
) => {

    const response = await api.post(
        `/forecast-models/${modelId}/run`,
        null,
        {
            params: {
                entity_id: entityId,
            },
        }
    );

    return response.data;
};


// ==========================================
// COMPARE FORECAST MODELS
// POST /compare
// ==========================================

export const compareForecastModels = async (
    payload
) => {

    const response = await api.post(
        "/compare",
        payload
    );

    return response.data;
};


// ==========================================
// GET FORECAST RESULTS
// GET /forecast-models/runs/{run_id}/results
// ==========================================

export const getForecastResults = async (
    runId
) => {

    const response = await api.get(
        `/forecast-models/runs/${runId}/results`
    );

    return response.data;
};

