import api from "./api";

export const getDashboardKPIs = async () => {
    const response = await api.get("/dashboard/kpis");
    return response.data;
};

export const getHistoricalVsPredicted = async (params) => {
    const response = await api.get(
        "/dashboard/historical-vs-predicted",
        {
            params: params,
        }
    );

    return response.data;
};

// MODEL PERFORMANCE
// GET /dashboard/model-performance


export const getModelPerformance = () => {
    return api.get("/dashboard/model-performance");
};


// ENTITY COMPARISON
// GET /dashboard/entity-comparison

export const getEntityComparison = (params = {}) => {
    return api.get("/dashboard/entity-comparison", {
        params,
    });
};

export const getAnomalyHeatmap = (params = {}) => { 
    return api.get("/dashboard/anomaly-heatmap", { 
        params, 
    }); 
};
