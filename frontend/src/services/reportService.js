import api from "./api";

// ==================================================
// FORECAST SUMMARY
// GET /reports/forecast-summary
// ==================================================

export const getForecastSummary = () => {
    return api.get("/reports/forecast-summary");
};


// ==================================================
// ANOMALY SUMMARY
// GET /reports/anomaly-summary
// ==================================================

export const getAnomalySummary = () => {
    return api.get("/reports/anomaly-summary");
};


// ==================================================
// OPTIMIZATION SUMMARY
// GET /reports/optimization-summary
// ==================================================

export const getOptimizationSummary = () => {
    return api.get("/reports/optimization-summary");
};


// ==================================================
// EXECUTIVE DASHBOARD
// GET /reports/executable_dashboard
// ==================================================

export const getExecutiveDashboard = () => {
    return api.get("/reports/executable_dashboard");
};


// ==================================================
// EXPORT CSV
// GET /export/csv?report_type=...
// ==================================================

export const exportReportCSV = (reportType) => {
    return api.get("/export/csv", {
        params: {
            report_type: reportType,
        },
        responseType: "blob",
    });
};


// ==================================================
// EXPORT PDF
// GET /export/pdf?report_type=...
// ==================================================

export const exportReportPDF = (reportType) => {
    return api.get("/export/pdf", {
        params: {
            report_type: reportType,
        },
        responseType: "blob",
    });
};

