import api from "./api";

export const uploadDataset = async (metricId, file) => {
    const formData = new FormData();

    formData.append("metric_id", metricId);
    formData.append("file", file);

    const response = await api.post(
        "/dataset/upload",
        formData
    );

    return response.data;
};