import api from "./api";

// ==================================================
// GENERATE OPTIMIZATION RECOMMENDATIONS
// POST /optimizations/generate
// ==================================================

export const generateRecommendations = async (payload) => {

    const response = await api.post(
        "/optimizations/generate",
        payload
    );

    return response.data;
};


// ==================================================
// GET ALL OPTIMIZATION RECOMMENDATIONS
// GET /optimizations
// ==================================================

export const getRecommendations = async (filters = {}) => {

    const response = await api.get(
        "/optimizations",
        {
            params: filters,
        }
    );

    return response.data;
};


// ==================================================
// GET RECOMMENDATION BY ID
// GET /optimizations/{recommendation_id}
// ==================================================

export const getRecommendationById = async (
    recommendationId
) => {

    const response = await api.get(
        `/optimizations/${recommendationId}`
    );

    return response.data;
};


// ==================================================
// UPDATE RECOMMENDATION
// PATCH /optimizations/{recommendation_id}
// ==================================================

export const updateRecommendation = async (
    recommendationId,
    payload
) => {

    const response = await api.patch(
        `/optimizations/${recommendationId}`,
        payload
    );

    return response.data;
};


// ==================================================
// APPLY RECOMMENDATION
// POST /optimizations/{recommendation_id}/apply
// ==================================================

export const applyRecommendation = async (
    recommendationId
) => {

    const response = await api.post(
        `/optimizations/${recommendationId}/apply`
    );

    return response.data;
};


// ==================================================
// DELETE RECOMMENDATION
// DELETE /optimizations/{recommendation_id}
// ==================================================

export const deleteRecommendation = async (
    recommendationId
) => {

    const response = await api.delete(
        `/optimizations/${recommendationId}`
    );

    return response.data;
};

