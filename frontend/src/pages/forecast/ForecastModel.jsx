import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    getForecastModels,
    createForecastModel,
} from "../../services/forecastService";

function ForecastModel() {

    // ==================================================
    // STATE
    // ==================================================

    const [models, setModels] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        tenant_id: "",
        metric_id: "",
        name: "",
        model_type: "",
        entity_type: "",
        horizon: "",
        frequency: "",
        config: "{}",
        status: "active",
        version: "",
    });


    // ==================================================
    // GET FORECAST MODELS
    // ==================================================

    const fetchModels = async () => {

        try {

            setLoading(true);

            const response = await getForecastModels();

            console.log(
                "GET /forecast-models response:",
                response
            );

            /*
             * Expected backend response:
             *
             * {
             *     message: "Forecast model list fetched",
             *     data: [...]
             * }
             */

            setModels(
                Array.isArray(response)
                    ? response
                    : response.data || []
            );

        } catch (error) {

            console.error(
                "Failed to fetch forecast models:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to load forecast models."
            );

        } finally {

            setLoading(false);

        }
    };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        fetchModels();

    }, []);


    // ==================================================
    // HANDLE INPUT CHANGE
    // ==================================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // ==================================================
    // OPEN CREATE MODAL
    // ==================================================

    const handleCreate = () => {

        setFormData({
            tenant_id: "",
            metric_id: "",
            name: "",
            model_type: "",
            entity_type: "",
            horizon: "",
            frequency: "",
            config: "{}",
            status: "active",
            version: "",
        });

        setShowForm(true);
    };


    // ==================================================
    // CLOSE CREATE MODAL
    // ==================================================

    const handleCloseForm = () => {

        if (saving) {
            return;
        }

        setShowForm(false);

        setFormData({
            tenant_id: "",
            metric_id: "",
            name: "",
            model_type: "",
            entity_type: "",
            horizon: "",
            frequency: "",
            config: "{}",
            status: "active",
            version: "",
        });
    };


    // ==================================================
    // CREATE FORECAST MODEL
    // ==================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        // ----------------------------------------------
        // Validate JSON configuration
        // ----------------------------------------------

        let parsedConfig;

        try {

            parsedConfig = JSON.parse(
                formData.config
            );

        } catch (error) {

            toast.error(
                "Configuration must contain valid JSON."
            );

            return;
        }


        // ----------------------------------------------
        // Prepare payload
        // ----------------------------------------------

        const payload = {
            tenant_id: Number(
                formData.tenant_id
            ),

            metric_id: Number(
                formData.metric_id
            ),

            name: formData.name,

            model_type: formData.model_type,

            entity_type: formData.entity_type,

            horizon: formData.horizon,

            frequency: formData.frequency,

            config: parsedConfig,

            status: formData.status,

            version: formData.version,
        };


        try {

            setSaving(true);

            const response =
                await createForecastModel(
                    payload
                );

            console.log(
                "POST /forecast-models response:",
                response
            );

            toast.success(
                response.message ||
                "Forecast model created successfully."
            );

            handleCloseForm();

            await fetchModels();

        } catch (error) {

            console.error(
                "Failed to create forecast model:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to create forecast model."
            );

        } finally {

            setSaving(false);

        }
    };


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div className="container-fluid">


            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Forecast Models
                    </h2>

                    <p className="text-muted mb-0">
                        Manage forecasting models.
                    </p>

                </div>


                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreate}
                    disabled={saving}
                >

                    <i className="bi bi-plus-circle me-2"></i>

                    Create Model

                </button>

            </div>


            {/* ==================================================
                FORECAST MODELS TABLE
            ================================================== */}

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <h5 className="fw-bold mb-0">
                            Forecast Models
                        </h5>

                        <span className="text-muted">
                            Total: {models.length}
                        </span>

                    </div>


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
                                Loading forecast models...
                            </p>

                        </div>

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>

                                        <th>
                                            ID
                                        </th>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Metric ID
                                        </th>

                                        <th>
                                            Model Type
                                        </th>

                                        <th>
                                            Entity Type
                                        </th>

                                        <th>
                                            Horizon
                                        </th>

                                        <th>
                                            Frequency
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {models.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="8"
                                                className="text-center text-muted py-5"
                                            >

                                                <i className="bi bi-graph-up fs-2 d-block mb-2"></i>

                                                No forecast models available.

                                            </td>

                                        </tr>

                                    ) : (

                                        models.map((model) => (

                                            <tr key={model.id}>

                                                <td>
                                                    {model.id}
                                                </td>

                                                <td className="fw-semibold">
                                                    {model.name}
                                                </td>

                                                <td>
                                                    {model.metric_id}
                                                </td>

                                                <td>
                                                    {model.model_type}
                                                </td>

                                                <td>
                                                    {model.entity_type}
                                                </td>

                                                <td>
                                                    {model.horizon}
                                                </td>

                                                <td>
                                                    {model.frequency}
                                                </td>

                                                <td>

                                                    {model.status === "active" ? (

                                                        <span className="badge bg-success">
                                                            Active
                                                        </span>

                                                    ) : (

                                                        <span className="badge bg-secondary">
                                                            {model.status || "Inactive"}
                                                        </span>

                                                    )}

                                                </td>

                                            </tr>

                                        ))

                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>


            {/* ==================================================
                CREATE MODEL MODAL
            ================================================== */}

            {showForm && (

                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor:
                            "rgba(0, 0, 0, 0.5)"
                    }}
                >

                    <div
                        className="modal-dialog modal-lg modal-dialog-centered"
                        role="document"
                    >

                        <div className="modal-content">


                            {/* ==================================================
                                MODAL HEADER
                            ================================================== */}

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title fw-bold mb-1">
                                        Create Forecast Model
                                    </h5>

                                    <small className="text-muted">
                                        Configure a new forecasting model.
                                    </small>

                                </div>


                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCloseForm}
                                    disabled={saving}
                                ></button>

                            </div>


                            {/* ==================================================
                                MODAL BODY
                            ================================================== */}

                            <div className="modal-body">

                                <form onSubmit={handleSubmit}>

                                    <div className="row g-3">


                                        {/* Tenant ID */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="tenantId"
                                                className="form-label fw-semibold"
                                            >
                                                Tenant ID
                                            </label>

                                            <input
                                                id="tenantId"
                                                name="tenant_id"
                                                type="number"
                                                className="form-control"
                                                placeholder="Enter tenant ID"
                                                value={
                                                    formData.tenant_id
                                                }
                                                onChange={handleChange}
                                                min="1"
                                                required
                                            />

                                        </div>


                                        {/* Metric ID */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="metricId"
                                                className="form-label fw-semibold"
                                            >
                                                Metric ID
                                            </label>

                                            <input
                                                id="metricId"
                                                name="metric_id"
                                                type="number"
                                                className="form-control"
                                                placeholder="Enter metric ID"
                                                value={
                                                    formData.metric_id
                                                }
                                                onChange={handleChange}
                                                min="1"
                                                required
                                            />

                                        </div>


                                        {/* Model Name */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="modelName"
                                                className="form-label fw-semibold"
                                            >
                                                Model Name
                                            </label>

                                            <input
                                                id="modelName"
                                                name="name"
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter model name"
                                                value={
                                                    formData.name
                                                }
                                                onChange={handleChange}
                                                required
                                            />

                                        </div>


                                        {/* Model Type */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="modelType"
                                                className="form-label fw-semibold"
                                            >
                                                Model Type
                                            </label>

                                            <select
                                                id="modelType"
                                                name="model_type"
                                                className="form-select"
                                                value={
                                                    formData.model_type
                                                }
                                                onChange={handleChange}
                                                required
                                            >

                                                <option value="">
                                                    Select model type
                                                </option>

                                                <option value="ARIMA">
                                                    ARIMA
                                                </option>

                                                <option value="Prophet">
                                                    Prophet
                                                </option>

                                                <option value="XGBoost">
                                                    XGBoost
                                                </option>

                                                <option value="LSTM">
                                                    LSTM
                                                </option>

                                                <option value="GRU">
                                                    GRU
                                                </option>

                                            </select>

                                        </div>


                                        {/* Entity Type */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="entityType"
                                                className="form-label fw-semibold"
                                            >
                                                Entity Type
                                            </label>

                                            <input
                                                id="entityType"
                                                name="entity_type"
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. machine"
                                                value={
                                                    formData.entity_type
                                                }
                                                onChange={handleChange}
                                                required
                                            />

                                        </div>


                                        {/* Horizon */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="horizon"
                                                className="form-label fw-semibold"
                                            >
                                                Horizon
                                            </label>

                                            <input
                                                id="horizon"
                                                name="horizon"
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. 7d"
                                                value={
                                                    formData.horizon
                                                }
                                                onChange={handleChange}
                                                required
                                            />

                                        </div>


                                        {/* Frequency */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="frequency"
                                                className="form-label fw-semibold"
                                            >
                                                Frequency
                                            </label>

                                            <input
                                                id="frequency"
                                                name="frequency"
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. daily"
                                                value={
                                                    formData.frequency
                                                }
                                                onChange={handleChange}
                                                required
                                            />

                                        </div>


                                        {/* Version */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="version"
                                                className="form-label fw-semibold"
                                            >
                                                Version
                                            </label>

                                            <input
                                                id="version"
                                                name="version"
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. 1.0"
                                                value={
                                                    formData.version
                                                }
                                                onChange={handleChange}
                                                required
                                            />

                                        </div>


                                        {/* Status */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="status"
                                                className="form-label fw-semibold"
                                            >
                                                Status
                                            </label>

                                            <select
                                                id="status"
                                                name="status"
                                                className="form-select"
                                                value={
                                                    formData.status
                                                }
                                                onChange={handleChange}
                                                required
                                            >

                                                <option value="active">
                                                    Active
                                                </option>

                                                <option value="inactive">
                                                    Inactive
                                                </option>

                                            </select>

                                        </div>


                                        {/* Configuration */}

                                        <div className="col-12">

                                            <label
                                                htmlFor="config"
                                                className="form-label fw-semibold"
                                            >
                                                Configuration
                                            </label>

                                            <textarea
                                                id="config"
                                                name="config"
                                                className="form-control font-monospace"
                                                rows="4"
                                                placeholder='{"seasonal": true}'
                                                value={
                                                    formData.config
                                                }
                                                onChange={handleChange}
                                                required
                                            ></textarea>

                                            <div className="form-text">
                                                Enter configuration as valid JSON.
                                            </div>

                                        </div>

                                    </div>


                                    {/* ==================================================
                                        MODAL FOOTER
                                    ================================================== */}

                                    <div className="modal-footer px-0 pb-0 mt-4">

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCloseForm}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>


                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={saving}
                                        >

                                            {saving ? (

                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                    ></span>

                                                    Creating...
                                                </>

                                            ) : (

                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>

                                                    Create Model
                                                </>

                                            )}

                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ForecastModel;

