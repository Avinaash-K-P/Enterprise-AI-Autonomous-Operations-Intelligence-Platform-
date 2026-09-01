import api from "./api";

// ==========================================
// Create Tenant
// POST /tenants
// ==========================================

export const createTenant = async (payload) => {
    const response = await api.post(
        "/tenants",
        payload
    );

    return response.data;
};


// ==========================================
// Get All Tenants
// GET /tenants
// ==========================================

export const getTenants = async () => {
    const response = await api.get(
        "/tenants"
    );

    return response.data;
};


// ==========================================
// Get Tenant By ID
// GET /tenants/{id}
// ==========================================

export const getTenantById = async (id) => {
    const response = await api.get(
        `/tenants/${id}`
    );

    return response.data;
};


// ==========================================
// Update Tenant
// PUT /tenants/{id}
// ==========================================

export const updateTenant = async (id, payload) => {
    const response = await api.put(
        `/tenants/${id}`,
        payload
    );

    return response.data;
};


// ==========================================
// Delete Tenant
// DELETE /tenants/{id}
// ==========================================

export const deleteTenant = async (id) => {
    const response = await api.delete(
        `/tenants/${id}`
    );

    return response.data;
};


// ==========================================
// Assign Tenant To User
// PATCH /tenants/assign/{user_id}
// ==========================================

export const assignTenant = async (userId, payload) => {
    const response = await api.patch(
        `/tenants/assign/${userId}`,
        payload
    );

    return response.data;
};