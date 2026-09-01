import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    getForecastSummary,
    getAnomalySummary,
    getOptimizationSummary,
    getExecutiveDashboard,
    exportReportCSV,
    exportReportPDF,
} from "../../services/reportService";


function Reports() {

    // ==================================================
    // STATE
    // ==================================================

    const [reportType, setReportType] = useState("forecast");

    const [exporting, setExporting] = useState(false);

    const [forecastSummary, setForecastSummary] = useState(null);
    const [anomalySummary, setAnomalySummary] = useState(null);
    const [optimizationSummary, setOptimizationSummary] = useState(null);
    const [executiveDashboard, setExecutiveDashboard] = useState(null);

    const [loading, setLoading] = useState(true);

// ==================================================
// DOWNLOAD CSV
// GET /export/csv?report_type=...
// ==================================================

const handleDownloadCSV = async () => {

    try {

        setExporting(true);

        const response =
            await exportReportCSV(reportType);

        const blob = new Blob(
            [response.data],
            { type: "text/csv" }
        );

        const url =
            window.URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `${reportType}_report.csv`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);

        toast.success(
            "CSV report downloaded successfully."
        );

    } catch (error) {

        console.error(
            "CSV export failed:",
            error
        );

        toast.error(
            error.response?.data?.detail ||
            "Failed to download CSV report."
        );

    } finally {

        setExporting(false);
    }
};


// ==================================================
// DOWNLOAD PDF
// GET /export/pdf?report_type=...
// ==================================================

const handleDownloadPDF = async () => {

    try {

        setExporting(true);

        const response =
            await exportReportPDF(reportType);

        const blob = new Blob(
            [response.data],
            { type: "application/pdf" }
        );

        const url =
            window.URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `${reportType}_report.pdf`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);

        toast.success(
            "PDF report downloaded successfully."
        );

    } catch (error) {

        console.error(
            "PDF export failed:",
            error
        );

        toast.error(
            error.response?.data?.detail ||
            "Failed to download PDF report."
        );

    } finally {

        setExporting(false);
    }
};



    // ==================================================
    // FETCH ALL REPORTS
    // ==================================================

    const fetchReports = async () => {

        try {

            setLoading(true);

            const [
                forecastResponse,
                anomalyResponse,
                optimizationResponse,
                executiveResponse,
            ] = await Promise.all([
                getForecastSummary(),
                getAnomalySummary(),
                getOptimizationSummary(),
                getExecutiveDashboard(),
            ]);


            console.log(
                "Forecast Summary:",
                forecastResponse.data
            );

            console.log(
                "Anomaly Summary:",
                anomalyResponse.data
            );

            console.log(
                "Optimization Summary:",
                optimizationResponse.data
            );

            console.log(
                "Executive Dashboard:",
                executiveResponse.data
            );


            setForecastSummary(
                forecastResponse.data
            );

            setAnomalySummary(
                anomalyResponse.data
            );

            setOptimizationSummary(
                optimizationResponse.data
            );

            setExecutiveDashboard(
                executiveResponse.data
            );

        } catch (error) {

            console.error(
                "Failed to fetch reports:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to load reports."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        fetchReports();

    }, []);


    // ==================================================
    // FORMAT REPORT DATA
    // ==================================================

    const renderReportData = (data) => {

        if (
            data === null ||
            data === undefined
        ) {

            return (
                <p className="text-muted mb-0">
                    No data available.
                </p>
            );
        }


        // Array response

        if (Array.isArray(data)) {

            if (data.length === 0) {

                return (
                    <p className="text-muted mb-0">
                        No data available.
                    </p>
                );
            }

            return (
                <div className="table-responsive">

                    <table className="table table-sm table-hover align-middle mb-0">

                        <tbody>

                            {data.map(
                                (item, index) => (

                                    <tr key={index}>

                                        <td>
                                            {renderValue(
                                                item
                                            )}
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>
            );
        }


        // Object response

        if (
            typeof data === "object"
        ) {

            const entries =
                Object.entries(data);


            if (entries.length === 0) {

                return (
                    <p className="text-muted mb-0">
                        No data available.
                    </p>
                );
            }


            return (
                <div className="table-responsive">

                    <table className="table table-sm table-hover align-middle mb-0">

                        <tbody>

                            {entries.map(
                                ([key, value]) => (

                                    <tr key={key}>

                                        <th
                                            style={{
                                                width: "40%",
                                            }}
                                        >
                                            {formatKey(key)}
                                        </th>

                                        <td>
                                            {renderValue(
                                                value
                                            )}
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>
            );
        }


        // Primitive response

        return (
            <span>
                {String(data)}
            </span>
        );
    };


    // ==================================================
    // FORMAT OBJECT KEYS
    // ==================================================

    const formatKey = (key) => {

        return key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) =>
                char.toUpperCase()
            );
    };


    // ==================================================
    // FORMAT VALUES
    // ==================================================

    const renderValue = (value) => {

        if (
            value === null ||
            value === undefined
        ) {

            return (
                <span className="text-muted">
                    -
                </span>
            );
        }


        if (
            typeof value === "object"
        ) {

            return (
                <pre
                    className="mb-0 small"
                    style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {JSON.stringify(
                        value,
                        null,
                        2
                    )}
                </pre>
            );
        }


        return String(value);
    };


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (

            <div className="container-fluid">

                <div className="text-center py-5">

                    <div
                        className="spinner-border text-primary"
                        role="status"
                    >

                        <span className="visually-hidden">
                            Loading...
                        </span>

                    </div>

                    <p className="text-muted mt-3">
                        Loading reports...
                    </p>

                </div>

            </div>
        );
    }


    // ==================================================
    // PAGE
    // ==================================================

    return (

        <div className="container-fluid">



{/* ==================================================
    PAGE HEADER
================================================== */}

<div className="d-flex justify-content-between align-items-center mb-4">

    <div>

        <h2 className="fw-bold mb-1">
            Reports
        </h2>

        <p className="text-muted mb-0">
            Enterprise analytics and operational
            intelligence reports.
        </p>

    </div>


    <div className="d-flex align-items-center gap-2">

        {/* Report Type */}

        {/* <select
            className="form-select"
            style={{ width: "220px" }}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
        >
            <option value="forecast_summary">
                Forecast Summary
            </option>
        
            <option value="anomaly_summary">
                Anomaly Summary
            </option>
        
            <option value="optimization_summary">
                Optimization Summary
            </option>
        
            <option value="executive_dashboard">
                Executive Dashboard
            </option>
        </select> */}
        

        {/* CSV */}

        <button
            type="button"
            className="btn btn-outline-success"
            onClick={handleDownloadCSV}
            disabled={exporting}
        >
            {exporting
                ? "Downloading..."
                : "Download CSV"}
        </button>


        {/* PDF */}

        <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleDownloadPDF}
            disabled={exporting}
        >
            {exporting
                ? "Downloading..."
                : "Download PDF"}
        </button>


        {/* Refresh */}

        <button
            type="button"
            className="btn btn-outline-primary"
            onClick={fetchReports}
            disabled={loading}
        >
            Refresh
        </button>

    </div>

</div>



            {/* ==================================================
                REPORT CARDS
            ================================================== */}

            <div className="row g-4">


                {/* ==================================================
                    FORECAST SUMMARY
                ================================================== */}

                <div className="col-12">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <div className="d-flex align-items-center mb-3">

                                <div>

                                    <h5 className="fw-bold mb-1">
                                        Forecast Summary
                                    </h5>

                                    <small className="text-muted">
                                        Forecasting performance
                                        and prediction overview.
                                    </small>

                                </div>

                            </div>


                            {renderReportData(
                                forecastSummary
                            )}

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    ANOMALY SUMMARY
                ================================================== */}

                <div className="col-12">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <h5 className="fw-bold mb-1">
                                Anomaly Summary
                            </h5>

                            <small className="text-muted d-block mb-3">
                                Detected anomalies and
                                operational risk overview.
                            </small>


                            {renderReportData(
                                anomalySummary
                            )}

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    OPTIMIZATION SUMMARY
                ================================================== */}

                <div className="col-12">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <h5 className="fw-bold mb-1">
                                Optimization Summary
                            </h5>

                            <small className="text-muted d-block mb-3">
                                Optimization recommendations,
                                savings, and impact overview.
                            </small>


                            {renderReportData(
                                optimizationSummary
                            )}

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    EXECUTIVE DASHBOARD
                ================================================== */}

                <div className="col-12">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <h5 className="fw-bold mb-1">
                                Executive Dashboard
                            </h5>

                            <small className="text-muted d-block mb-3">
                                High-level enterprise
                                operational intelligence.
                            </small>


                            {renderReportData(
                                executiveDashboard
                            )}

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}


export default Reports;
