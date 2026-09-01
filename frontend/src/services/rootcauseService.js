import api from "./api";

// ==================================================
// ANALYZE ROOT CAUSE
// POST /analyze/{anomaly_id}
// ==================================================

export const analyzeRootCause = async (
    anomalyId,
    payload
) => {

    const response = await api.post(
        `/root-cause/analyze/${anomalyId}`,
        payload
    );

    return response.data;
};


// ==================================================
// GET ROOT CAUSE ANALYSIS
// GET /analyze/{anomaly_id}
// ==================================================

export const getRootCauseByAnomaly = async (
    anomalyId
) => {

    const response = await api.get(
        `/root-cause/analyze/${anomalyId}`
    );

    return response.data;
};

