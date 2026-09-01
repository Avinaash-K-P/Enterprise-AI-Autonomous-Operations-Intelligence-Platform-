import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    generateRecommendations,
    getRecommendations,
    getRecommendationById,
    applyRecommendation,
} from "../../services/optimizationService";

function Optimization() {

    // ==================================================
    // GENERATE RECOMMENDATION STATE
    // ==================================================

    const [generateData, setGenerateData] = useState({
        source_type: "",
        source_id: "",
        entity_type: "",
        entity_id: "",
        include_types: "",
    });


    // ==================================================
    // FILTER STATE
    // ==================================================

    const [filters, setFilters] = useState({
        source_type: "",
        recommendation_type: "",
        status_filter: "",
        entity_type: "",
        entity_id: "",
    });


    // ==================================================
    // RECOMMENDATIONS
    // ==================================================

    const [recommendations, setRecommendations] = useState([]);

    const [loading, setLoading] = useState(false);

    const [generating, setGenerating] = useState(false);


    // ==================================================
    // VIEW RECOMMENDATION STATE
    // ==================================================

    const [selectedRecommendation, setSelectedRecommendation] =
        useState(null);

    const [viewLoading, setViewLoading] = useState(false);


    // ==================================================
    // APPLY RECOMMENDATION STATE
    // ==================================================

    const [recommendationToApply, setRecommendationToApply] =
        useState(null);

    const [applying, setApplying] = useState(false);


    // ==================================================
    // HANDLE GENERATE INPUT
    // ==================================================

    const handleGenerateChange = (e) => {

        const { name, value } = e.target;

        setGenerateData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // ==================================================
    // HANDLE FILTER INPUT
    // ==================================================

    const handleFilterChange = (e) => {

        const { name, value } = e.target;

        setFilters((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // ==================================================
    // FETCH RECOMMENDATIONS
    // ==================================================

    const fetchRecommendations = async (
        customFilters = filters
    ) => {

        try {

            setLoading(true);

            // Remove empty filter values

            const params = Object.fromEntries(
                Object.entries(customFilters).filter(
                    ([, value]) =>
                        value !== "" &&
                        value !== null &&
                        value !== undefined
                )
            );


            // Convert entity ID to number

            if (params.entity_id) {

                params.entity_id =
                    Number(params.entity_id);
            }


            const response =
                await getRecommendations(params);


            console.log(
                "GET /optimizations response:",
                response
            );


            if (Array.isArray(response)) {

                setRecommendations(response);

            } else if (Array.isArray(response?.data)) {

                setRecommendations(response.data);

            } else {

                setRecommendations([]);
            }

        } catch (error) {

            console.error(
                "Failed to fetch recommendations:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to load recommendations."
            );

            setRecommendations([]);

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // GENERATE RECOMMENDATIONS
    // ==================================================

    const handleGenerate = async (e) => {

        e.preventDefault();


        // -----------------------------
        // Validation
        // -----------------------------

        if (!generateData.source_type) {

            toast.error("Please enter Source Type.");

            return;
        }

        if (!generateData.source_id) {

            toast.error("Please enter Source ID.");

            return;
        }

        if (!generateData.entity_type) {

            toast.error("Please enter Entity Type.");

            return;
        }

        if (!generateData.entity_id) {

            toast.error("Please enter Entity ID.");

            return;
        }


        // -----------------------------
        // Prepare include_types
        // -----------------------------

        const includeTypes =
            generateData.include_types
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item !== "");


        // -----------------------------
        // Prepare payload
        // -----------------------------

        const payload = {

            source_type:
                generateData.source_type,

            source_id:
                Number(generateData.source_id),

            entity_type:
                generateData.entity_type,

            entity_id:
                Number(generateData.entity_id),

            include_types:
                includeTypes.length > 0
                    ? includeTypes
                    : null,
        };


        try {

            setGenerating(true);

            const response =
                await generateRecommendations(payload);


            console.log(
                "POST /optimizations/generate response:",
                response
            );


            toast.success(
                response?.message ||
                "Optimization recommendations generated successfully."
            );


            // Refresh table

            await fetchRecommendations();

        } catch (error) {

            console.error(
                "Failed to generate recommendations:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to generate recommendations."
            );

        } finally {

            setGenerating(false);
        }
    };


    // ==================================================
    // APPLY FILTERS
    // ==================================================

    const handleApplyFilters = async (e) => {

        e.preventDefault();

        await fetchRecommendations(filters);
    };


    // ==================================================
    // CLEAR FILTERS
    // ==================================================

    const handleClearFilters = async () => {

        const emptyFilters = {
            source_type: "",
            recommendation_type: "",
            status_filter: "",
            entity_type: "",
            entity_id: "",
        };

        setFilters(emptyFilters);

        await fetchRecommendations(emptyFilters);
    };


    // ==================================================
    // VIEW RECOMMENDATION
    // ==================================================

    const handleViewRecommendation = async (
        recommendationId
    ) => {

        try {

            setViewLoading(true);

            const response =
                await getRecommendationById(
                    recommendationId
                );


            console.log(
                "GET recommendation response:",
                response
            );


            /*
             * Backend may return the object directly
             * or inside "data".
             */

            const recommendation =
                response?.data &&
                !Array.isArray(response.data)
                    ? response.data
                    : response;


            setSelectedRecommendation(
                recommendation
            );

        } catch (error) {

            console.error(
                "Failed to fetch recommendation:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to load recommendation."
            );

        } finally {

            setViewLoading(false);
        }
    };


    // ==================================================
    // CLOSE VIEW MODAL
    // ==================================================

    const closeViewModal = () => {

        setSelectedRecommendation(null);
    };


    // ==================================================
    // APPLY RECOMMENDATION
    // ==================================================

    const handleApplyRecommendation = async () => {

        if (!recommendationToApply) {
            return;
        }


        try {

            setApplying(true);

            const response =
                await applyRecommendation(
                    recommendationToApply.id
                );


            console.log(
                "Apply recommendation response:",
                response
            );


            toast.success(
                response?.message ||
                "Recommendation applied successfully."
            );


            setRecommendationToApply(null);


            // Refresh table

            await fetchRecommendations();

        } catch (error) {

            console.error(
                "Failed to apply recommendation:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to apply recommendation."
            );

        } finally {

            setApplying(false);
        }
    };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        fetchRecommendations();

    }, []);


    // ==================================================
    // HELPER
    // ==================================================

    const formatValue = (value) => {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return "-";
        }

        return value;
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
                    Optimization Recommendations
                </h2>

                <p className="text-muted mb-0">
                    Generate and monitor AI-powered
                    optimization recommendations.
                </p>

            </div>


            {/* ==================================================
                GENERATE RECOMMENDATIONS
            ================================================== */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-3">
                        Generate Recommendations
                    </h5>


                    <form onSubmit={handleGenerate}>

                        <div className="row g-3">


                            {/* Source Type */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Source Type
                                </label>

                                <input
                                    type="text"
                                    name="source_type"
                                    className="form-control"
                                    placeholder="e.g. anomaly"
                                    value={
                                        generateData.source_type
                                    }
                                    onChange={
                                        handleGenerateChange
                                    }
                                    disabled={generating}
                                />

                            </div>


                            {/* Source ID */}

                            <div className="col-md-2">

                                <label className="form-label fw-semibold">
                                    Source ID
                                </label>

                                <input
                                    type="number"
                                    name="source_id"
                                    className="form-control"
                                    placeholder="Source ID"
                                    value={
                                        generateData.source_id
                                    }
                                    onChange={
                                        handleGenerateChange
                                    }
                                    min="1"
                                    disabled={generating}
                                />

                            </div>


                            {/* Entity Type */}

                            <div className="col-md-3">

                                <label className="form-label fw-semibold">
                                    Entity Type
                                </label>

                                <input
                                    type="text"
                                    name="entity_type"
                                    className="form-control"
                                    placeholder="e.g. device"
                                    value={
                                        generateData.entity_type
                                    }
                                    onChange={
                                        handleGenerateChange
                                    }
                                    disabled={generating}
                                />

                            </div>


                            {/* Entity ID */}

                            <div className="col-md-2">

                                <label className="form-label fw-semibold">
                                    Entity ID
                                </label>

                                <input
                                    type="number"
                                    name="entity_id"
                                    className="form-control"
                                    placeholder="Entity ID"
                                    value={
                                        generateData.entity_id
                                    }
                                    onChange={
                                        handleGenerateChange
                                    }
                                    min="1"
                                    disabled={generating}
                                />

                            </div>


                            {/* Generate Button */}

                            <div className="col-md-2 d-flex align-items-end">

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={generating}
                                >

                                    {generating ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>

                                            Generating...
                                        </>

                                    ) : (

                                        "Generate"
                                    )}

                                </button>

                            </div>


                            {/* Include Types */}

                            <div className="col-12">

                                <label className="form-label fw-semibold">
                                    Recommendation Types
                                </label>

                                <input
                                    type="text"
                                    name="include_types"
                                    className="form-control"
                                    placeholder="e.g. cost, resource, performance"
                                    value={
                                        generateData.include_types
                                    }
                                    onChange={
                                        handleGenerateChange
                                    }
                                    disabled={generating}
                                />

                                <small className="text-muted">
                                    Optional. Enter multiple types
                                    separated by commas.
                                </small>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* ==================================================
                FILTER RECOMMENDATIONS
            ================================================== */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-3">
                        Filter Recommendations
                    </h5>


                    <form onSubmit={handleApplyFilters}>

                        <div className="row g-3">


                            {/* Source Type */}

                            <div className="col-md-2">

                                <label className="form-label">
                                    Source Type
                                </label>

                                <input
                                    type="text"
                                    name="source_type"
                                    className="form-control"
                                    placeholder="Source"
                                    value={
                                        filters.source_type
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                />

                            </div>


                            {/* Recommendation Type */}

                            <div className="col-md-3">

                                <label className="form-label">
                                    Recommendation Type
                                </label>

                                <input
                                    type="text"
                                    name="recommendation_type"
                                    className="form-control"
                                    placeholder="Recommendation type"
                                    value={
                                        filters.recommendation_type
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                />

                            </div>


                            {/* Status */}

                            <div className="col-md-2">

                                <label className="form-label">
                                    Status
                                </label>

                                <select
                                    name="status_filter"
                                    className="form-select"
                                    value={
                                        filters.status_filter
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                >

                                    <option value="">
                                        All
                                    </option>

                                    <option value="pending">
                                        Pending
                                    </option>

                                    <option value="approved">
                                        Approved
                                    </option>

                                    <option value="applied">
                                        Applied
                                    </option>

                                    <option value="rejected">
                                        Rejected
                                    </option>

                                </select>

                            </div>


                            {/* Entity Type */}

                            <div className="col-md-2">

                                <label className="form-label">
                                    Entity Type
                                </label>

                                <input
                                    type="text"
                                    name="entity_type"
                                    className="form-control"
                                    placeholder="Entity"
                                    value={
                                        filters.entity_type
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                />

                            </div>


                            {/* Entity ID */}

                            <div className="col-md-1">

                                <label className="form-label">
                                    Entity ID
                                </label>

                                <input
                                    type="number"
                                    name="entity_id"
                                    className="form-control"
                                    placeholder="ID"
                                    value={
                                        filters.entity_id
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                    min="1"
                                />

                            </div>


                            {/* Buttons */}

                            <div className="col-md-2 d-flex align-items-end gap-2">

                                <button
                                    type="submit"
                                    className="btn btn-primary flex-fill"
                                    disabled={loading}
                                >
                                    Apply
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={
                                        handleClearFilters
                                    }
                                >
                                    Clear
                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* ==================================================
                RECOMMENDATIONS TABLE
            ================================================== */}

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <div>

                            <h5 className="fw-bold mb-1">
                                Recommendations
                            </h5>

                            <small className="text-muted">
                                Optimization recommendations
                                matching the selected filters.
                            </small>

                        </div>

                        <span className="badge bg-secondary">
                            {recommendations.length} Results
                        </span>

                    </div>


                    {/* Loading */}

                    {loading ? (

                        <div className="text-center py-5">

                            <div
                                className="spinner-border text-primary"
                                role="status"
                            >

                                <span className="visually-hidden">
                                    Loading...
                                </span>

                            </div>

                            <p className="text-muted mt-2 mb-0">
                                Loading recommendations...
                            </p>

                        </div>

                    ) : recommendations.length === 0 ? (

                        <div className="text-center text-muted py-5">

                            No optimization recommendations
                            found.

                        </div>

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>

                                        <th>ID</th>

                                        <th>Title</th>

                                        <th>Recommendation</th>

                                        <th>Entity</th>

                                        <th>Priority</th>

                                        <th>Rank</th>

                                        <th>Confidence</th>

                                        <th>Cost Savings</th>

                                        <th>Risk</th>

                                        <th>Status</th>

                                        <th>Actions</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {recommendations.map(
                                        (recommendation) => (

                                            <tr
                                                key={
                                                    recommendation.id
                                                }
                                            >

                                                <td>
                                                    {
                                                        recommendation.id
                                                    }
                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            recommendation.title
                                                        }
                                                    </strong>

                                                </td>


                                                <td>
                                                    {
                                                        recommendation.recommendation_type ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>

                                                    {
                                                        recommendation.entity_type ||
                                                        "-"
                                                    }

                                                    {" "}

                                                    #

                                                    {
                                                        recommendation.entity_id ??
                                                        "-"
                                                    }

                                                </td>


                                                <td>

                                                    <span className="badge bg-primary">

                                                        {
                                                            recommendation.priority ||
                                                            "-"
                                                        }

                                                    </span>

                                                </td>


                                                <td>
                                                    {
                                                        recommendation.rank ??
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        recommendation.confidence_score ??
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        recommendation.estimated_cost_savings ??
                                                        "-"
                                                    }
                                                </td>


                                                <td>

                                                    <span
                                                        className={`badge ${
                                                            recommendation.risk_level ===
                                                            "high"
                                                                ? "bg-danger"
                                                                : recommendation.risk_level ===
                                                                  "medium"
                                                                    ? "bg-warning text-dark"
                                                                    : "bg-secondary"
                                                        }`}
                                                    >

                                                        {
                                                            recommendation.risk_level ||
                                                            "-"
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="badge bg-secondary">

                                                        {
                                                            recommendation.status ||
                                                            "-"
                                                        }

                                                    </span>

                                                </td>


                                                {/* ACTIONS */}

                                                <td>

                                                    <div className="d-flex gap-2">

                                                        {/* VIEW */}

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() =>
                                                                handleViewRecommendation(
                                                                    recommendation.id
                                                                )
                                                            }
                                                        >
                                                            View
                                                        </button>


                                                        {/* APPLY */}

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-success"
                                                            disabled={
                                                                recommendation.status ===
                                                                "applied"
                                                            }
                                                            onClick={() =>
                                                                setRecommendationToApply(
                                                                    recommendation
                                                                )
                                                            }
                                                        >

                                                            {recommendation.status ===
                                                            "applied"
                                                                ? "Applied"
                                                                : "Apply"}

                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>


            {/* ==================================================
                VIEW RECOMMENDATION MODAL
            ================================================== */}

            {selectedRecommendation && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor:
                            "rgba(0, 0, 0, 0.5)",
                    }}
                >

                    <div className="modal-dialog modal-lg modal-dialog-scrollable">

                        <div className="modal-content">


                            {/* Modal Header */}

                            <div className="modal-header">

                                <h5 className="modal-title">
                                    Recommendation Details
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={
                                        closeViewModal
                                    }
                                ></button>

                            </div>


                            {/* Modal Body */}

                            <div className="modal-body">

                                {viewLoading ? (

                                    <div className="text-center py-5">

                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        ></div>

                                        <p className="text-muted mt-2">
                                            Loading recommendation...
                                        </p>

                                    </div>

                                ) : (

                                    <div className="row g-3">


                                        {/* Title */}

                                        <div className="col-12">

                                            <label className="fw-semibold">
                                                Title
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.title
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Description */}

                                        <div className="col-12">

                                            <label className="fw-semibold">
                                                Description
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.description
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Recommendation Type */}

                                        <div className="col-md-6">

                                            <label className="fw-semibold">
                                                Recommendation Type
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.recommendation_type
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Source */}

                                        <div className="col-md-6">

                                            <label className="fw-semibold">
                                                Source
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.source_type
                                                    )
                                                }

                                                {" #"}

                                                {
                                                    formatValue(
                                                        selectedRecommendation.source_id
                                                    )
                                                }

                                            </div>

                                        </div>


                                        {/* Entity */}

                                        <div className="col-md-6">

                                            <label className="fw-semibold">
                                                Entity
                                            </label>

                                            <div>

                                                {
                                                    formatValue(
                                                        selectedRecommendation.entity_type
                                                    )
                                                }

                                                {" #"}

                                                {
                                                    formatValue(
                                                        selectedRecommendation.entity_id
                                                    )
                                                }

                                            </div>

                                        </div>


                                        {/* Priority */}

                                        <div className="col-md-3">

                                            <label className="fw-semibold">
                                                Priority
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.priority
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Rank */}

                                        <div className="col-md-3">

                                            <label className="fw-semibold">
                                                Rank
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.rank
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Confidence */}

                                        <div className="col-md-4">

                                            <label className="fw-semibold">
                                                Confidence Score
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.confidence_score
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Cost Savings */}

                                        <div className="col-md-4">

                                            <label className="fw-semibold">
                                                Estimated Cost Savings
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.estimated_cost_savings
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Operational Impact */}

                                        <div className="col-md-4">

                                            <label className="fw-semibold">
                                                Operational Impact
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.estimated_operational_impact
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Resource Change */}

                                        <div className="col-md-4">

                                            <label className="fw-semibold">
                                                Resource Change
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.estimated_resource_change
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Performance Improvement */}

                                        <div className="col-md-4">

                                            <label className="fw-semibold">
                                                Performance Improvement
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.estimated_performance_improvement
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Risk */}

                                        <div className="col-md-4">

                                            <label className="fw-semibold">
                                                Risk Level
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.risk_level
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Status */}

                                        <div className="col-md-4">

                                            <label className="fw-semibold">
                                                Status
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.status
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Reason */}

                                        <div className="col-12">

                                            <label className="fw-semibold">
                                                Reason
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.reason
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Action Plan */}

                                        <div className="col-12">

                                            <label className="fw-semibold">
                                                Action Plan
                                            </label>

                                            {Array.isArray(
                                                selectedRecommendation.action_plan
                                            ) &&
                                            selectedRecommendation
                                                .action_plan
                                                .length > 0 ? (

                                                <ol className="mb-0">

                                                    {
                                                        selectedRecommendation
                                                            .action_plan
                                                            .map(
                                                                (
                                                                    action,
                                                                    index
                                                                ) => (

                                                                    <li
                                                                        key={
                                                                            index
                                                                        }
                                                                    >

                                                                        {typeof action ===
                                                                        "object"
                                                                            ? JSON.stringify(
                                                                                  action
                                                                              )
                                                                            : action}

                                                                    </li>

                                                                )
                                                            )
                                                    }

                                                </ol>

                                            ) : (

                                                <div>
                                                    -
                                                </div>

                                            )}

                                        </div>


                                        {/* Expiry */}

                                        <div className="col-md-6">

                                            <label className="fw-semibold">
                                                Expires At
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.expires_at
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Created */}

                                        <div className="col-md-6">

                                            <label className="fw-semibold">
                                                Created At
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.created_at
                                                    )
                                                }
                                            </div>

                                        </div>


                                        {/* Updated */}

                                        <div className="col-md-6">

                                            <label className="fw-semibold">
                                                Updated At
                                            </label>

                                            <div>
                                                {
                                                    formatValue(
                                                        selectedRecommendation.updated_at
                                                    )
                                                }
                                            </div>

                                        </div>

                                    </div>

                                )}

                            </div>


                            {/* Modal Footer */}

                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={
                                        closeViewModal
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* ==================================================
                APPLY CONFIRMATION MODAL
            ================================================== */}

            {recommendationToApply && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor:
                            "rgba(0, 0, 0, 0.5)",
                    }}
                >

                    <div className="modal-dialog modal-dialog-centered">

                        <div className="modal-content">


                            <div className="modal-header">

                                <h5 className="modal-title">
                                    Apply Recommendation
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setRecommendationToApply(
                                            null
                                        )
                                    }
                                    disabled={applying}
                                ></button>

                            </div>


                            <div className="modal-body">

                                <p className="mb-2">
                                    Are you sure you want to
                                    apply this recommendation?
                                </p>

                                <div className="alert alert-light border mb-0">

                                    <strong>
                                        {
                                            recommendationToApply.title
                                        }
                                    </strong>

                                    <br />

                                    <small className="text-muted">

                                        {
                                            recommendationToApply.recommendation_type
                                        }

                                        {" • "}

                                        {
                                            recommendationToApply.entity_type
                                        }

                                        {" #"}

                                        {
                                            recommendationToApply.entity_id
                                        }

                                    </small>

                                </div>

                            </div>


                            <div className="modal-footer">

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setRecommendationToApply(
                                            null
                                        )
                                    }
                                    disabled={applying}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={
                                        handleApplyRecommendation
                                    }
                                    disabled={applying}
                                >

                                    {applying ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>

                                            Applying...
                                        </>

                                    ) : (

                                        "Apply Recommendation"
                                    )}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Optimization;

