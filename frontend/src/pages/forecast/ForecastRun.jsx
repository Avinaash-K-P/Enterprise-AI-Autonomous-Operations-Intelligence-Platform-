import { useState } from "react";
import { toast } from "react-toastify";

import {
    runForecastModel,
    getForecastResults,
} from "../../services/forecastService";

function ForecastRun() {

    // ==================================================
    // STATE
    // ==================================================

    const [modelId, setModelId] = useState("");
    const [entityId, setEntityId] = useState("");

    const [runId, setRunId] = useState(null);

    const [results, setResults] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);


    // ==================================================
    // GET FORECAST RESULTS
    // ==================================================

    const fetchForecastResults = async (generatedRunId) => {

        try {

            setLoadingResults(true);

            const response = await getForecastResults(
                generatedRunId
            );

            console.log(
                "GET /forecast-models/runs/{run_id}/results response:",
                response
            );

            if (Array.isArray(response)) {

                setResults(response);

            } else if (Array.isArray(response?.data)) {

                setResults(response.data);

            } else if (Array.isArray(response?.results)) {

                setResults(response.results);

            } else {

                setResults([]);

            }

        } catch (error) {

            console.error(
                "Failed to fetch forecast results:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to load forecast results."
            );

        } finally {

            setLoadingResults(false);
        }
    };


    // ==================================================
    // RUN FORECAST
    // ==================================================

    const handleRunForecast = async (e) => {

        e.preventDefault();

        if (!modelId) {

            toast.error(
                "Please enter a Model ID."
            );

            return;
        }

        if (!entityId) {

            toast.error(
                "Please enter an Entity ID."
            );

            return;
        }

        const numericModelId = Number(modelId);
        const numericEntityId = Number(entityId);

        if (
            Number.isNaN(numericModelId) ||
            numericModelId <= 0
        ) {

            toast.error(
                "Model ID must be a valid number."
            );

            return;
        }

        if (
            Number.isNaN(numericEntityId) ||
            numericEntityId <= 0
        ) {

            toast.error(
                "Entity ID must be a valid number."
            );

            return;
        }

        try {

            setLoading(true);

            setRunId(null);
            setResults([]);

            // ------------------------------------------
            // Run Forecast
            // ------------------------------------------

            const response = await runForecastModel(
                numericModelId,
                numericEntityId
            );

            console.log(
                "POST /forecast-models/{model_id}/run response:",
                response
            );

            // ------------------------------------------
            // Extract Run ID
            // ------------------------------------------

            const generatedRunId =
                response?.run_id ||
                response?.data?.run_id ||
                response?.id ||
                response?.data?.id;

            if (!generatedRunId) {

                toast.error(
                    "Forecast completed, but no Run ID was returned."
                );

                return;
            }

            setRunId(generatedRunId);

            toast.success(
                response?.message ||
                "Forecast completed successfully."
            );

            // ------------------------------------------
            // Fetch Results
            // ------------------------------------------

            await fetchForecastResults(
                generatedRunId
            );

        } catch (error) {

            console.error(
                "Forecast execution failed:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to run forecast."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // RESET
    // ==================================================

    const resetForecast = () => {

        setModelId("");
        setEntityId("");

        setRunId(null);
        setResults([]);

        setLoading(false);
        setLoadingResults(false);
    };


    // ==================================================
    // HTML / JSX
    // ==================================================

    return (

        <div className="container-fluid">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="mb-4">

                <h2 className="fw-bold mb-1">
                    Forecast Run
                </h2>

                <p className="text-muted mb-0">
                    Run a forecasting model and view its results.
                </p>

            </div>


            {/* ==================================================
                RUN FORECAST CARD
            ================================================== */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-3">
                        Run Forecast
                    </h5>

                    <form onSubmit={handleRunForecast}>

                        <div className="row g-3 align-items-end">


                            {/* Model ID */}

                            <div className="col-md-5">

                                <label
                                    htmlFor="modelId"
                                    className="form-label fw-semibold"
                                >
                                    Model ID
                                </label>

                                <input
                                    id="modelId"
                                    type="number"
                                    className="form-control"
                                    placeholder="Enter model ID"
                                    value={modelId}
                                    onChange={(e) =>
                                        setModelId(e.target.value)
                                    }
                                    min="1"
                                    disabled={loading}
                                    required
                                />

                            </div>


                            {/* Entity ID */}

                            <div className="col-md-5">

                                <label
                                    htmlFor="entityId"
                                    className="form-label fw-semibold"
                                >
                                    Entity ID
                                </label>

                                <input
                                    id="entityId"
                                    type="number"
                                    className="form-control"
                                    placeholder="Enter entity ID"
                                    value={entityId}
                                    onChange={(e) =>
                                        setEntityId(e.target.value)
                                    }
                                    min="1"
                                    disabled={loading}
                                    required
                                />

                            </div>


                            {/* Run Button */}

                            <div className="col-md-2">

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >

                                    {loading ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                aria-hidden="true"
                                            ></span>

                                            Running...
                                        </>

                                    ) : (

                                        <>
                                            <i className="bi bi-play-fill me-1"></i>

                                            Run Forecast
                                        </>

                                    )}

                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* ==================================================
                LOADING SECTION
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

                        <h6 className="fw-semibold">
                            Running forecast...
                        </h6>

                        <p className="text-muted mb-0">
                            Please wait while the forecasting model
                            generates the results.
                        </p>

                    </div>

                </div>

            )}


            {/* ==================================================
                RUN INFORMATION
            ================================================== */}

            {runId && !loading && (

                <div className="alert alert-success d-flex justify-content-between align-items-center mb-4">

                    <div>

                        <strong>
                            Forecast completed successfully.
                        </strong>

                        <div className="small mt-1">
                            Run ID: <strong>{runId}</strong>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={resetForecast}
                    >
                        New Run
                    </button>

                </div>

            )}


            {/* ==================================================
                RESULTS SECTION
            ================================================== */}

            {runId && (

                <div className="card shadow-sm border-0">

                    <div className="card-body">

                        <div className="d-flex justify-content-between align-items-center mb-3">

                            <div>

                                <h5 className="fw-bold mb-1">
                                    Forecast Results
                                </h5>

                                <small className="text-muted">
                                    Run ID: {runId}
                                </small>

                            </div>

                        </div>


                        {/* Results Loading */}

                        {loadingResults ? (

                            <div className="text-center py-5">

                                <div
                                    className="spinner-border text-primary"
                                    role="status"
                                >

                                    <span className="visually-hidden">
                                        Loading results...
                                    </span>

                                </div>

                                <p className="text-muted mt-2 mb-0">
                                    Loading forecast results...
                                </p>

                            </div>

                        ) : results.length === 0 ? (

                            <div className="text-center text-muted py-5">

                                <i className="bi bi-bar-chart fs-2 d-block mb-2"></i>

                                No forecast results found.

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
                                                Timestamp
                                            </th>

                                            <th>
                                                Predicted Value
                                            </th>

                                            <th>
                                                Lower Bound
                                            </th>

                                            <th>
                                                Upper Bound
                                            </th>

                                            <th>
                                                Confidence Score
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {results.map(
                                            (result, index) => (

                                                <tr
                                                    key={
                                                        result.id ||
                                                        index
                                                    }
                                                >

                                                    <td>
                                                        {index + 1}
                                                    </td>

                                                    <td>
                                                        {result.forecast_timestamp ||
                                                         result.timestamp ||
                                                         "-"}
                                                    </td>

                                                    <td className="fw-semibold">

                                                        {result.predicted_value ??
                                                         "-"}

                                                    </td>

                                                    <td>
                                                        {result.lower_bound ??
                                                         "-"}
                                                    </td>

                                                    <td>
                                                        {result.upper_bound ??
                                                         "-"}
                                                    </td>

                                                    <td>
                                                        {result.confidence_score ??
                                                         "-"}
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

            )}

        </div>
    );
}

export default ForecastRun;

