import { useState } from "react";
import { toast } from "react-toastify";

import {
    analyzeRootCause,
    getRootCauseByAnomaly,
} from "../../services/rootcauseService";

function RootCause() {

    // ==================================================
    // STATE
    // ==================================================

    const [anomalyId, setAnomalyId] = useState("");

    const [lookbackHours, setLookbackHours] = useState(24);

    const [includeFeatureImportance, setIncludeFeatureImportance] =
        useState(true);

    const [includeImpactChain, setIncludeImpactChain] =
        useState(true);

    const [analysis, setAnalysis] = useState(null);

    const [loading, setLoading] = useState(false);


    // ==================================================
    // ANALYZE ROOT CAUSE
    // ==================================================

    const handleAnalyze = async (e) => {

        e.preventDefault();

        if (!anomalyId) {

            toast.error("Please enter an Anomaly ID.");

            return;
        }

        const numericAnomalyId = Number(anomalyId);

        if (
            Number.isNaN(numericAnomalyId) ||
            numericAnomalyId <= 0
        ) {

            toast.error(
                "Anomaly ID must be a valid number."
            );

            return;
        }

        if (
            lookbackHours < 1 ||
            lookbackHours > 168
        ) {

            toast.error(
                "Lookback hours must be between 1 and 168."
            );

            return;
        }


        const payload = {
            lookback_hours: Number(lookbackHours),
            include_feature_importance:
                includeFeatureImportance,
            include_impact_chain:
                includeImpactChain,
        };


        try {

            setLoading(true);

            setAnalysis(null);


            const response = await analyzeRootCause(
                numericAnomalyId,
                payload
            );


            console.log(
                "POST /analyze/{anomaly_id} response:",
                response
            );


            setAnalysis(response);

            toast.success(
                "Root cause analysis completed successfully."
            );

        } catch (error) {

            console.error(
                "Root cause analysis failed:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to analyze root cause."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // GET EXISTING ROOT CAUSE ANALYSIS
    // ==================================================

    const handleGetAnalysis = async () => {

        if (!anomalyId) {

            toast.error("Please enter an Anomaly ID.");

            return;
        }

        const numericAnomalyId = Number(anomalyId);

        if (
            Number.isNaN(numericAnomalyId) ||
            numericAnomalyId <= 0
        ) {

            toast.error(
                "Anomaly ID must be a valid number."
            );

            return;
        }


        try {

            setLoading(true);

            const response =
                await getRootCauseByAnomaly(
                    numericAnomalyId
                );


            console.log(
                "GET /analyze/{anomaly_id} response:",
                response
            );


            setAnalysis(response);

            toast.success(
                "Root cause analysis loaded."
            );

        } catch (error) {

            console.error(
                "Failed to load root cause analysis:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to load root cause analysis."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // CLEAR ANALYSIS
    // ==================================================

    const handleClear = () => {

        setAnomalyId("");

        setLookbackHours(24);

        setIncludeFeatureImportance(true);

        setIncludeImpactChain(true);

        setAnalysis(null);
    };


    // ==================================================
    // JSX
    // ==================================================

    return (

        <div className="container-fluid">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="mb-4">

                <h2 className="fw-bold mb-1">
                    Root Cause Analysis
                </h2>

                <p className="text-muted mb-0">
                    Analyze detected anomalies and identify their
                    likely root causes and contributing factors.
                </p>

            </div>


            {/* ==================================================
                ANALYSIS FORM
            ================================================== */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-3">
                        Analyze Anomaly
                    </h5>


                    <form onSubmit={handleAnalyze}>

                        <div className="row g-3">


                            {/* Anomaly ID */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Anomaly ID
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Enter anomaly ID"
                                    value={anomalyId}
                                    onChange={(e) =>
                                        setAnomalyId(
                                            e.target.value
                                        )
                                    }
                                    min="1"
                                    disabled={loading}
                                />

                            </div>


                            {/* Lookback Hours */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Lookback Hours
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    value={lookbackHours}
                                    onChange={(e) =>
                                        setLookbackHours(
                                            e.target.value
                                        )
                                    }
                                    min="1"
                                    max="168"
                                    disabled={loading}
                                />

                                <small className="text-muted">
                                    Range: 1–168 hours
                                </small>

                            </div>


                            {/* Feature Importance */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Feature Importance
                                </label>

                                <div className="form-check form-switch mt-2">

                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={
                                            includeFeatureImportance
                                        }
                                        onChange={(e) =>
                                            setIncludeFeatureImportance(
                                                e.target.checked
                                            )
                                        }
                                        disabled={loading}
                                    />

                                    <label className="form-check-label">
                                        Include analysis
                                    </label>

                                </div>

                            </div>


                            {/* Impact Chain */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Impact Chain
                                </label>

                                <div className="form-check form-switch mt-2">

                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={
                                            includeImpactChain
                                        }
                                        onChange={(e) =>
                                            setIncludeImpactChain(
                                                e.target.checked
                                            )
                                        }
                                        disabled={loading}
                                    />

                                    <label className="form-check-label">
                                        Include analysis
                                    </label>

                                </div>

                            </div>


                            {/* Buttons */}

                            <div className="col-12 d-flex gap-2">

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >

                                    {loading ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>

                                            Analyzing...
                                        </>

                                    ) : (

                                        <>
                                            Analyze Root Cause
                                        </>

                                    )}

                                </button>


                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={handleGetAnalysis}
                                    disabled={loading}
                                >
                                    Load Existing
                                </button>


                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={handleClear}
                                    disabled={loading}
                                >
                                    Clear
                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* ==================================================
                LOADING
            ================================================== */}

            {loading && (

                <div className="card shadow-sm border-0 mb-4">

                    <div className="card-body text-center py-5">

                        <div
                            className="spinner-border text-primary mb-3"
                            role="status"
                        >

                            <span className="visually-hidden">
                                Loading...
                            </span>

                        </div>

                        <p className="text-muted mb-0">
                            Analyzing anomaly and identifying
                            potential root causes...
                        </p>

                    </div>

                </div>

            )}


            {/* ==================================================
                ANALYSIS RESULTS
            ================================================== */}

            {analysis && !loading && (

                <>

                    {/* ------------------------------------------
                        ANOMALY OVERVIEW
                    ------------------------------------------ */}

                    <div className="card shadow-sm border-0 mb-4">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-start">

                                <div>

                                    <h5 className="fw-bold mb-2">
                                        Anomaly Overview
                                    </h5>

                                    <p className="text-muted mb-0">
                                        {analysis.summary || "-"}
                                    </p>

                                </div>

                                <span className="badge bg-primary fs-6">
                                    Confidence:{" "}
                                    {analysis.confidence_score ??
                                        "-"}
                                </span>

                            </div>


                            <hr />


                            <div className="row g-3">

                                <div className="col-md-2">

                                    <small className="text-muted d-block">
                                        Anomaly ID
                                    </small>

                                    <strong>
                                        {analysis.anomaly_id ??
                                            "-"}
                                    </strong>

                                </div>

                                <div className="col-md-2">

                                    <small className="text-muted d-block">
                                        Metric ID
                                    </small>

                                    <strong>
                                        {analysis.metric_id ??
                                            "-"}
                                    </strong>

                                </div>

                                <div className="col-md-2">

                                    <small className="text-muted d-block">
                                        Entity Type
                                    </small>

                                    <strong>
                                        {analysis.entity_type ??
                                            "-"}
                                    </strong>

                                </div>

                                <div className="col-md-2">

                                    <small className="text-muted d-block">
                                        Entity ID
                                    </small>

                                    <strong>
                                        {analysis.entity_id ??
                                            "-"}
                                    </strong>

                                </div>

                                <div className="col-md-2">

                                    <small className="text-muted d-block">
                                        Anomaly Type
                                    </small>

                                    <strong>
                                        {analysis.anomaly_type ??
                                            "-"}
                                    </strong>

                                </div>

                                <div className="col-md-2">

                                    <small className="text-muted d-block">
                                        Severity
                                    </small>

                                    <strong>
                                        {analysis.severity ??
                                            "-"}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* ------------------------------------------
                        LIKELY CAUSES
                    ------------------------------------------ */}

                    <div className="card shadow-sm border-0 mb-4">

                        <div className="card-body">

                            <h5 className="fw-bold mb-3">
                                Likely Causes
                            </h5>


                            {analysis.likely_causes?.length > 0 ? (

                                <div className="table-responsive">

                                    <table className="table table-hover align-middle">

                                        <thead className="table-light">

                                            <tr>

                                                <th>
                                                    Cause Type
                                                </th>

                                                <th>
                                                    Confidence
                                                </th>

                                                <th>
                                                    Explanation
                                                </th>

                                                <th>
                                                    Supporting Evidence
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {analysis.likely_causes.map(
                                                (cause, index) => (

                                                    <tr key={index}>

                                                        <td>
                                                            <strong>
                                                                {
                                                                    cause.cause_type
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {
                                                                cause.confidence_score
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                cause.explanation
                                                            }
                                                        </td>

                                                        <td>

                                                            {cause.supporting_evidence?.length > 0 ? (

                                                                <ul className="mb-0">

                                                                    {cause.supporting_evidence.map(
                                                                        (evidence, evidenceIndex) => (

                                                                            <li
                                                                                key={
                                                                                    evidenceIndex
                                                                                }
                                                                            >
                                                                                {evidence}
                                                                            </li>

                                                                        )
                                                                    )}

                                                                </ul>

                                                            ) : (
                                                                "-"
                                                            )}

                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            ) : (

                                <p className="text-muted mb-0">
                                    No likely causes available.
                                </p>

                            )}

                        </div>

                    </div>


                    {/* ------------------------------------------
                        CORRELATED METRICS
                    ------------------------------------------ */}

                    <div className="card shadow-sm border-0 mb-4">

                        <div className="card-body">

                            <h5 className="fw-bold mb-3">
                                Correlated Metrics
                            </h5>


                            {analysis.correlated_metrics?.length > 0 ? (

                                <div className="table-responsive">

                                    <table className="table table-hover align-middle">

                                        <thead className="table-light">

                                            <tr>

                                                <th>
                                                    Metric ID
                                                </th>

                                                <th>
                                                    Metric Name
                                                </th>

                                                <th>
                                                    Correlation Score
                                                </th>

                                                <th>
                                                    Relationship
                                                </th>

                                                <th>
                                                    Explanation
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {analysis.correlated_metrics.map(
                                                (metric, index) => (

                                                    <tr key={index}>

                                                        <td>
                                                            {
                                                                metric.metric_id
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                metric.metric_name ||
                                                                "-"
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                metric.correlation_score
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                metric.relationship_type
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                metric.explanation
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            ) : (

                                <p className="text-muted mb-0">
                                    No correlated metrics available.
                                </p>

                            )}

                        </div>

                    </div>


                    {/* ------------------------------------------
                        FEATURE IMPORTANCE
                    ------------------------------------------ */}

                    <div className="card shadow-sm border-0 mb-4">

                        <div className="card-body">

                            <h5 className="fw-bold mb-3">
                                Feature Importance
                            </h5>


                            {analysis.feature_importance?.length > 0 ? (

                                <div className="table-responsive">

                                    <table className="table table-hover align-middle">

                                        <thead className="table-light">

                                            <tr>

                                                <th>
                                                    Feature
                                                </th>

                                                <th>
                                                    Importance Score
                                                </th>

                                                <th>
                                                    Explanation
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {analysis.feature_importance.map(
                                                (feature, index) => (

                                                    <tr key={index}>

                                                        <td>
                                                            {
                                                                feature.feature_name
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                feature.importance_score
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                feature.explanation
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            ) : (

                                <p className="text-muted mb-0">
                                    Feature importance was not included.
                                </p>

                            )}

                        </div>

                    </div>


                    {/* ------------------------------------------
                        IMPACT CHAIN
                    ------------------------------------------ */}

                    <div className="card shadow-sm border-0 mb-4">

                        <div className="card-body">

                            <h5 className="fw-bold mb-3">
                                Impact Chain
                            </h5>


                            {analysis.impact_chain?.length > 0 ? (

                                <div className="table-responsive">

                                    <table className="table table-hover align-middle">

                                        <thead className="table-light">

                                            <tr>

                                                <th>
                                                    Source
                                                </th>

                                                <th>
                                                    Target
                                                </th>

                                                <th>
                                                    Impact Type
                                                </th>

                                                <th>
                                                    Severity
                                                </th>

                                                <th>
                                                    Explanation
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {analysis.impact_chain.map(
                                                (item, index) => (

                                                    <tr key={index}>

                                                        <td>
                                                            {
                                                                item.source
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                item.target
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                item.impact_type
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                item.severity
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                item.explanation
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            ) : (

                                <p className="text-muted mb-0">
                                    Impact chain was not included.
                                </p>

                            )}

                        </div>

                    </div>


                    {/* ------------------------------------------
                        METADATA
                    ------------------------------------------ */}

                    <div className="card shadow-sm border-0 mb-4">

                        <div className="card-body">

                            <h5 className="fw-bold mb-3">
                                Analysis Information
                            </h5>

                            <div className="row g-3">

                                <div className="col-md-4">

                                    <small className="text-muted d-block">
                                        Tenant ID
                                    </small>

                                    <strong>
                                        {analysis.tenant_id ??
                                            "-"}
                                    </strong>

                                </div>

                                <div className="col-md-4">

                                    <small className="text-muted d-block">
                                        Anomaly Score
                                    </small>

                                    <strong>
                                        {analysis.anomaly_score ??
                                            "-"}
                                    </strong>

                                </div>

                                <div className="col-md-4">

                                    <small className="text-muted d-block">
                                        Generated At
                                    </small>

                                    <strong>
                                        {analysis.generated_at ??
                                            "-"}
                                    </strong>

                                </div>

                            </div>


                            {analysis.metadata && (

                                <>

                                    <hr />

                                    <small className="text-muted d-block mb-2">
                                        Metadata
                                    </small>

                                    <pre className="bg-light p-3 rounded">
                                        {JSON.stringify(
                                            analysis.metadata,
                                            null,
                                            2
                                        )}
                                    </pre>

                                </>

                            )}

                        </div>

                    </div>

                </>

            )}

        </div>
    );
}

export default RootCause;

