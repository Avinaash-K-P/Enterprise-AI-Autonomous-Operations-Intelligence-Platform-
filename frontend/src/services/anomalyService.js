import api from "./api";

// ==================================================
// DETECT ANOMALIES
// POST /anomalies/detect
// ==================================================

export const detectAnomalies = async (payload) => {
    const response = await api.post(
        "/anomalies/detect",
        payload
    );

    return response.data;
};


// ==================================================
// GET ALL ANOMALIES
// GET /anomalies
// ==================================================

export const getAnomalies = async (filters = {}) => {

    const response = await api.get(
        "/anomalies",
        {
            params: filters,
        }
    );

    return response.data;
};


// ==================================================
// GET ANOMALY BY ID
// GET /anomalies/{id}
// ==================================================

export const getAnomalyById = async (id) => {

    const response = await api.get(
        `/anomalies/${id}`
    );

    return response.data;
};


// ==================================================
// UPDATE ANOMALY
// PATCH /anomalies/{id}
// ==================================================

export const updateAnomaly = async (
    id,
    payload
) => {

    const response = await api.patch(
        `/anomalies/${id}`,
        payload
    );

    return response.data;
};


// ==================================================
// DELETE ANOMALY
// DELETE /anomalies/{id}
// ==================================================

export const deleteAnomaly = async (id) => {

    const response = await api.delete(
        `/anomalies/${id}`
    );

    return response.data;
};

