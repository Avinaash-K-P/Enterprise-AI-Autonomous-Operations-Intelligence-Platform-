import api from "./api";

//Get Profile
export const getProfile = () => {
    return api.get("/auth/get-me");
};

