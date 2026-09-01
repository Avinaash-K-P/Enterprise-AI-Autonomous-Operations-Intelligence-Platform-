import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    detectAnomalies,
    getAnomalies,
} from "../../services/anomalyService";

function Anomaly() {

    // ==================================================
    // DETECTION FORM STATE
    // ==================================================

    const [detectionData, setDetectionData] = useState({
        metric_id: "",
        entity_type: "",
        entity_id: "",
    });


    // ==================================================
    // FILTER STATE
    // ==================================================

    const [filters, setFilters] = useState({
        metric_id: "",
        entity_type: "",
        entity_id: "",
        severity: "",
        status_filter: "",
    });


    // ==================================================
    // ANOMALY EVENTS
    // ==================================================

    const [anomalies, setAnomalies] = useState([]);

    const [loading, setLoading] = useState(false);

    const [detecting, setDetecting] = useState(false);


    // ==================================================
    // HANDLE DETECTION INPUT
    // ==================================================

    const handleDetectionChange = (e) => {

        const { name, value } = e.target;

        setDetectionData((previous) => ({
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
    // DETECT ANOMALIES
    // ==================================================

    const handleDetectAnomalies = async (e) => {

        e.preventDefault();

        if (!detectionData.metric_id) {

            toast.error("Please enter Metric ID.");

            return;
        }

        if (!detectionData.entity_type) {

            toast.error("Please enter Entity Type.");

            return;
        }

        if (!detectionData.entity_id) {

            toast.error("Please enter Entity ID.");

            return;
        }


        const payload = {
            ...detectionData,
            metric_id: Number(detectionData.metric_id),
            entity_id: Number(detectionData.entity_id),
        };


        try {

            setDetecting(true);

            const response = await detectAnomalies(
                payload
            );

            console.log(
                "POST /anomalies/detect response:",
                response
            );


            toast.success(
                response?.message ||
                "Anomaly detection completed successfully."
            );


            // Refresh anomaly events after detection

            await fetchAnomalies();

        } catch (error) {

            console.error(
                "Anomaly detection failed:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to detect anomalies."
            );

        } finally {

            setDetecting(false);
        }
    };


    // ==================================================
    // FETCH ANOMALY EVENTS
    // ==================================================

    const fetchAnomalies = async (
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


            // Convert numeric filters

            if (params.metric_id) {

                params.metric_id =
                    Number(params.metric_id);
            }

            if (params.entity_id) {

                params.entity_id =
                    Number(params.entity_id);
            }


            const response = await getAnomalies(
                params
            );


            console.log(
                "GET /anomalies response:",
                response
            );


            // Handle possible backend response formats

            if (Array.isArray(response)) {

                setAnomalies(response);

            } else if (Array.isArray(response?.data)) {

                setAnomalies(response.data);

            } else if (Array.isArray(response?.anomalies)) {

                setAnomalies(response.anomalies);

            } else {

                setAnomalies([]);
            }

        } catch (error) {

            console.error(
                "Failed to fetch anomaly events:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to load anomaly events."
            );

            setAnomalies([]);

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // APPLY FILTERS
    // ==================================================

    const handleApplyFilters = async (e) => {

        e.preventDefault();

        await fetchAnomalies(filters);
    };


    // ==================================================
    // CLEAR FILTERS
    // ==================================================

    const handleClearFilters = async () => {

        const emptyFilters = {
            metric_id: "",
            entity_type: "",
            entity_id: "",
            severity: "",
            status_filter: "",
        };

        setFilters(emptyFilters);

        await fetchAnomalies(emptyFilters);
    };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        fetchAnomalies();

    }, []);


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
                    Anomaly Detection
                </h2>

                <p className="text-muted mb-0">
                    Detect and monitor anomalous events across
                    enterprise metrics.
                </p>

            </div>


            {/* ==================================================
                DETECT ANOMALY
            ================================================== */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-3">
                        Detect Anomaly
                    </h5>


                    <form onSubmit={handleDetectAnomalies}>

                        <div className="row g-3 align-items-end">


                            {/* Metric ID */}

                            <div className="col-md-4">

                                <label
                                    className="form-label fw-semibold"
                                >
                                    Metric ID
                                </label>

                                <input
                                    type="number"
                                    name="metric_id"
                                    className="form-control"
                                    placeholder="Enter metric ID"
                                    value={
                                        detectionData.metric_id
                                    }
                                    onChange={
                                        handleDetectionChange
                                    }
                                    min="1"
                                    disabled={detecting}
                                />

                            </div>


                            {/* Entity Type */}

                            <div className="col-md-4">

                                <label
                                    className="form-label fw-semibold"
                                >
                                    Entity Type
                                </label>

                                <input
                                    type="text"
                                    name="entity_type"
                                    className="form-control"
                                    placeholder="e.g. device"
                                    value={
                                        detectionData.entity_type
                                    }
                                    onChange={
                                        handleDetectionChange
                                    }
                                    disabled={detecting}
                                />

                            </div>


                            {/* Entity ID */}

                            <div className="col-md-2">

                                <label
                                    className="form-label fw-semibold"
                                >
                                    Entity ID
                                </label>

                                <input
                                    type="number"
                                    name="entity_id"
                                    className="form-control"
                                    placeholder="ID"
                                    value={
                                        detectionData.entity_id
                                    }
                                    onChange={
                                        handleDetectionChange
                                    }
                                    min="1"
                                    disabled={detecting}
                                />

                            </div>


                            {/* Detect Button */}

                            <div className="col-md-2">

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={detecting}
                                >

                                    {detecting ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>

                                            Detecting...
                                        </>

                                    ) : (

                                        <>
                                            <i className="bi bi-search me-1"></i>

                                            Detect
                                        </>

                                    )}

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <h5 className="fw-bold mb-0">
                            Filter Anomaly Events
                        </h5>

                    </div>


                    <form onSubmit={handleApplyFilters}>

                        <div className="row g-3">


                            {/* Metric ID */}

                            <div className="col-md-2">

                                <label className="form-label">
                                    Metric ID
                                </label>

                                <input
                                    type="number"
                                    name="metric_id"
                                    className="form-control"
                                    placeholder="Metric ID"
                                    value={
                                        filters.metric_id
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                    min="1"
                                />

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
                                    placeholder="Entity type"
                                    value={
                                        filters.entity_type
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                />

                            </div>


                            {/* Entity ID */}

                            <div className="col-md-2">

                                <label className="form-label">
                                    Entity ID
                                </label>

                                <input
                                    type="number"
                                    name="entity_id"
                                    className="form-control"
                                    placeholder="Entity ID"
                                    value={
                                        filters.entity_id
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                    min="1"
                                />

                            </div>


                            {/* Severity */}

                            <div className="col-md-2">

                                <label className="form-label">
                                    Severity
                                </label>

                                <select
                                    name="severity"
                                    className="form-select"
                                    value={
                                        filters.severity
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                >

                                    <option value="">
                                        All
                                    </option>

                                    <option value="low">
                                        Low
                                    </option>

                                    <option value="medium">
                                        Medium
                                    </option>

                                    <option value="high">
                                        High
                                    </option>

                                    <option value="critical">
                                        Critical
                                    </option>

                                </select>

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

                                    <option value="open">
                                        Open
                                    </option>

                                    <option value="investigating">
                                        Investigating
                                    </option>

                                    <option value="resolved">
                                        Resolved
                                    </option>

                                </select>

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
                ANOMALY EVENTS TABLE
            ================================================== */}

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <div>

                            <h5 className="fw-bold mb-1">
                                Anomaly Events
                            </h5>

                            <small className="text-muted">
                                Detected anomaly events matching
                                the selected filters.
                            </small>

                        </div>

                        <span className="badge bg-secondary">
                            {anomalies.length} Events
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
                                Loading anomaly events...
                            </p>

                        </div>

                    ) : anomalies.length === 0 ? (

                        <div className="text-center text-muted py-5">

                            <i className="bi bi-shield-check fs-2 d-block mb-2"></i>

                            No anomaly events found.

                        </div>

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>

                                        <th>
                                            #
                                        </th>

                                        <th>
                                            Metric ID
                                        </th>

                                        <th>
                                            Entity Type
                                        </th>

                                        <th>
                                            Entity ID
                                        </th>

                                        <th>
                                            Severity
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Detected At
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {anomalies.map(
                                        (anomaly, index) => (

                                            <tr
                                                key={
                                                    anomaly.id ||
                                                    index
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    {
                                                        anomaly.metric_id ??
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        anomaly.entity_type ??
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        anomaly.entity_id ??
                                                        "-"
                                                    }
                                                </td>

                                                <td>

                                                    <span
                                                        className={`badge ${
                                                            anomaly.severity === "critical"
                                                                ? "bg-danger"
                                                                : anomaly.severity === "high"
                                                                    ? "bg-warning text-dark"
                                                                    : anomaly.severity === "medium"
                                                                        ? "bg-info text-dark"
                                                                        : "bg-secondary"
                                                        }`}
                                                    >

                                                        {
                                                            anomaly.severity ??
                                                            "-"
                                                        }

                                                    </span>

                                                </td>

                                                <td>
                                                    {
                                                        anomaly.status ??
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        anomaly.detected_at ||
                                                        anomaly.created_at ||
                                                        "-"
                                                    }
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

        </div>
    );
}

export default Anomaly;

