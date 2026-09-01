import api from "./api";

// Create metric
export const createMetric = async (payload) => {
    const response = await api.post(
        "/forecast-metrics",
        payload
    );

    return response.data;
};


// Get all metrics
export const getMetrics = async () => {
    const response = await api.get(
        "/forecast-metrics"
    );

    return response.data.data;
};


// Get metric by ID
export const getMetricById = async (id) => {
    const response = await api.get(
        `/forecast-metrics/${id}`
    );

    return response.data;
};


// Update metric
export const updateMetric = async (id, payload) => {
    const response = await api.put(
        `/forecast-metrics/${id}`,
        payload
    );

    return response.data;
};


// Delete metric
export const deleteMetric = async (id) => {
    const response = await api.delete(
        `/forecast-metrics/${id}`
    );

    return response.data;
};