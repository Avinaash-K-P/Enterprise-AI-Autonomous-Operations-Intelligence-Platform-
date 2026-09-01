import api from "./api"

export const registerUser = (userData) => {
    return api.post("auth/register", userData);
}

export const loginUser = (credential) => {
    return api.post("auth/login", credential);
}

export const getMyProfile = () => {
    return api.get("/auth/get-me");
};

export const forgotPassword = (email) => {
    return api.post("/auth/forgot-password", {
        email,
    });
};

export const resetPassword = (token, newPassword) => {
    return api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
    });
};

