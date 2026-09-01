import api from "./api";

// ==================================================
// CREATE SCENARIO
// POST /simulations
// ==================================================

export const createScenario = (payload) => {
    return api.post("/simulations", payload);
};


// ==================================================
// LIST SCENARIOS
// GET /simulations
// ==================================================

export const getScenarios = (params = {}) => {
    return api.get("/simulations", {
        params,
    });
};


// ==================================================
// GET SCENARIO BY ID
// GET /simulations/{scenario_id}
// ==================================================

export const getScenarioById = (scenarioId) => {
    return api.get(`/simulations/${scenarioId}`);
};


// ==================================================
// UPDATE SCENARIO
// PATCH /simulations/{scenario_id}
// ==================================================

export const updateScenario = (scenarioId, payload) => {
    return api.patch(
        `/simulations/${scenarioId}`,
        payload
    );
};


// ==================================================
// DELETE SCENARIO
// DELETE /simulations/{scenario_id}
// ==================================================

export const deleteScenario = (scenarioId) => {
    return api.delete(
        `/simulations/${scenarioId}`
    );
};


// ==================================================
// RUN SCENARIO
// POST /simulations/{scenario_id}/run
// ==================================================

export const runScenario = (scenarioId) => {
    return api.post(
        `/simulations/${scenarioId}/run`
    );
};

