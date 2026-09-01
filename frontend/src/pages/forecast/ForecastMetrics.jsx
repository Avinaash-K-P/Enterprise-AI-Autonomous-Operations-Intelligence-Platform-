import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    getMetrics,
    createMetric,
    updateMetric,
    deleteMetric,
} from "../../services/metricsService";

function ForecastMetrics() {

    const [metrics, setMetrics] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingMetric, setEditingMetric] = useState(null);

    const [formData, setFormData] = useState({
        tenant_id: "",
        name: "",
        code: "",
        description: "",
        unit: "",
        category: "",
        is_active: true,
    });


    // --------------------------------------------------
    // GET METRICS
    // --------------------------------------------------

const fetchMetrics = async () => {

    try {

        setLoading(true);

        const data = await getMetrics();

        console.log("GET /forecast-metrics response:", data);

        setMetrics(data);

    } catch (error) {

        console.error(
            "Failed to fetch metrics:",
            error
        );

        toast.error(
            error.response?.data?.detail ||
            "Failed to load metrics."
        );

    } finally {

        setLoading(false);

    }
};


    useEffect(() => {

        fetchMetrics();

    }, []);


    // --------------------------------------------------
    // HANDLE INPUT CHANGE
    // --------------------------------------------------

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    // --------------------------------------------------
    // HANDLE BOOLEAN CHANGE
    // --------------------------------------------------

    const handleActiveChange = (e) => {

        setFormData((previous) => ({
            ...previous,
            is_active: e.target.checked,
        }));
    };


    // --------------------------------------------------
    // CREATE FORM
    // --------------------------------------------------

    const handleCreate = () => {

        setEditingMetric(null);

        setFormData({
            tenant_id: "",
            name: "",
            code: "",
            description: "",
            unit: "",
            category: "",
            is_active: true,
        });

        setShowForm(true);
    };


    // --------------------------------------------------
    // EDIT FORM
    // --------------------------------------------------

    const handleEdit = (metric) => {

        setEditingMetric(metric);

        setFormData({
            tenant_id: metric.tenant_id ?? "",
            name: metric.name ?? "",
            code: metric.code ?? "",
            description: metric.description ?? "",
            unit: metric.unit ?? "",
            category: metric.category ?? "",
            is_active: metric.is_active ?? true,
        });

        setShowForm(true);
    };


    // --------------------------------------------------
    // CLOSE FORM
    // --------------------------------------------------

    const handleCloseForm = () => {

        setShowForm(false);
        setEditingMetric(null);

        setFormData({
            tenant_id: "",
            name: "",
            code: "",
            description: "",
            unit: "",
            category: "",
            is_active: true,
        });
    };


    // --------------------------------------------------
    // CREATE / UPDATE
    // --------------------------------------------------

    const handleSubmit = async (e) => {

        e.preventDefault();

        setSaving(true);

        try {

            if (editingMetric) {

                // ------------------------------------------
                // UPDATE
                // ------------------------------------------

                const payload = {
                    tenant_id: Number(formData.tenant_id),
                    name: formData.name,
                    code: formData.code,
                    description: formData.description,
                    unit: formData.unit,
                    category: formData.category,
                    is_active: formData.is_active,
                };

                const response = await updateMetric(
                    editingMetric.id,
                    payload
                );

                toast.success(
                    response.message ||
                    "Metric updated successfully."
                );

            } else {

                // ------------------------------------------
                // CREATE
                // ------------------------------------------

                const payload = {
                    tenant_id: Number(formData.tenant_id),
                    name: formData.name,
                    code: formData.code,
                    description: formData.description,
                    unit: formData.unit,
                    category: formData.category,
                };

                const response = await createMetric(
                    payload
                );

                toast.success(
                    response.message ||
                    "Metric created successfully."
                );
            }

            handleCloseForm();

            await fetchMetrics();

        } catch (error) {

            console.error(
                "Metric operation failed:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Metric operation failed."
            );

        } finally {

            setSaving(false);

        }
    };


    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    const handleDelete = async () => {

        if (!editingMetric) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${editingMetric.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setSaving(true);

            const response = await deleteMetric(
                editingMetric.id
            );

            toast.success(
                response.message ||
                "Metric deleted successfully."
            );

            handleCloseForm();

            await fetchMetrics();

        } catch (error) {

            console.error(
                "Failed to delete metric:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to delete metric."
            );

        } finally {

            setSaving(false);

        }
    };


    return (
        <div className="container-fluid">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Forecast Metrics
                    </h2>

                    <p className="text-muted mb-0">
                        Manage metrics used for forecasting
                        and analysis.
                    </p>

                </div>


                <button
                    className="btn btn-primary"
                    onClick={handleCreate}
                    disabled={saving}
                >

                    <i className="bi bi-plus-circle me-2"></i>

                    Create Metric

                </button>

            </div>


            {/* =================================================
                METRICS TABLE
            ================================================= */}

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <h5 className="fw-bold mb-0">
                            Metrics
                        </h5>

                        <span className="text-muted">
                            Total: {metrics.length}
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
                                Loading metrics...
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
                                            Tenant ID
                                        </th>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Code
                                        </th>

                                        <th>
                                            Description
                                        </th>

                                        <th>
                                            Unit
                                        </th>

                                        <th>
                                            Category
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th className="text-center">
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {metrics.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="9"
                                                className="text-center text-muted py-5"
                                            >

                                                <i className="bi bi-database fs-2 d-block mb-2"></i>

                                                No metrics available.

                                            </td>

                                        </tr>

                                    ) : (

                                        metrics.map((metric) => (

                                            <tr key={metric.id}>

                                                <td>
                                                    {metric.id}
                                                </td>

                                                <td>
                                                    {metric.tenant_id}
                                                </td>

                                                <td className="fw-semibold">
                                                    {metric.name}
                                                </td>

                                                <td>

                                                    <span className="badge bg-light text-dark border">
                                                        {metric.code}
                                                    </span>

                                                </td>

                                                <td>
                                                    {metric.description || "-"}
                                                </td>

                                                <td>
                                                    {metric.unit || "-"}
                                                </td>

                                                <td>
                                                    {metric.category || "-"}
                                                </td>

                                                <td>

                                                    {metric.is_active ? (

                                                        <span className="badge bg-success">
                                                            Active
                                                        </span>

                                                    ) : (

                                                        <span className="badge bg-secondary">
                                                            Inactive
                                                        </span>

                                                    )}

                                                </td>

                                                <td className="text-center">

                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() =>
                                                            handleEdit(metric)
                                                        }
                                                    >

                                                        <i className="bi bi-pencil me-1"></i>

                                                        Edit

                                                    </button>

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

{/* =================================================
    CREATE / EDIT MODAL
================================================= */}

{showForm && (

    <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >

        <div
            className="modal-dialog modal-lg modal-dialog-centered"
            role="document"
        >

            <div className="modal-content">


                {/* Modal Header */}

                <div className="modal-header">

                    <div>

                        <h5 className="modal-title fw-bold mb-1">

                            {editingMetric
                                ? "Edit Metric"
                                : "Create Metric"}

                        </h5>

                        <small className="text-muted">

                            {editingMetric
                                ? "Update the metric information."
                                : "Add a new forecasting metric."}

                        </small>

                    </div>


                    <button
                        type="button"
                        className="btn-close"
                        onClick={handleCloseForm}
                        disabled={saving}
                    ></button>

                </div>


                {/* Modal Body */}

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
                                    value={formData.tenant_id}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />

                            </div>


                            {/* Metric Name */}

                            <div className="col-md-6">

                                <label
                                    htmlFor="metricName"
                                    className="form-label fw-semibold"
                                >
                                    Metric Name
                                </label>

                                <input
                                    id="metricName"
                                    name="name"
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter metric name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* Code */}

                            <div className="col-md-6">

                                <label
                                    htmlFor="metricCode"
                                    className="form-label fw-semibold"
                                >
                                    Code
                                </label>

                                <input
                                    id="metricCode"
                                    name="code"
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter metric code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* Unit */}

                            <div className="col-md-6">

                                <label
                                    htmlFor="metricUnit"
                                    className="form-label fw-semibold"
                                >
                                    Unit
                                </label>

                                <input
                                    id="metricUnit"
                                    name="unit"
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. kWh, %, °C"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* Category */}

                            <div className="col-md-6">

                                <label
                                    htmlFor="metricCategory"
                                    className="form-label fw-semibold"
                                >
                                    Category
                                </label>

                                <input
                                    id="metricCategory"
                                    name="category"
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter metric category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            {/* Status - Edit Only */}

                            {editingMetric && (

                                <div className="col-md-6">

                                    <label className="form-label fw-semibold d-block">
                                        Status
                                    </label>

                                    <div className="form-check form-switch mt-2">

                                        <input
                                            id="metricActive"
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={handleActiveChange}
                                        />

                                        <label
                                            className="form-check-label"
                                            htmlFor="metricActive"
                                        >

                                            {formData.is_active
                                                ? "Active"
                                                : "Inactive"}

                                        </label>

                                    </div>

                                </div>

                            )}


                            {/* Description */}

                            <div className="col-12">

                                <label
                                    htmlFor="metricDescription"
                                    className="form-label fw-semibold"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="metricDescription"
                                    name="description"
                                    className="form-control"
                                    rows="4"
                                    placeholder="Enter metric description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                ></textarea>

                            </div>

                        </div>


                        {/* Modal Footer */}

                        <div className="modal-footer px-0 pb-0 mt-4">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCloseForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>


                            {/* Delete - Edit Mode Only */}

                            {editingMetric && (

                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={handleDelete}
                                    disabled={saving}
                                >

                                    <i className="bi bi-trash me-2"></i>

                                    Delete

                                </button>

                            )}


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

                                        Saving...
                                    </>

                                ) : (

                                    <>
                                        <i className="bi bi-check-circle me-2"></i>

                                        {editingMetric
                                            ? "Update Metric"
                                            : "Create Metric"}

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

export default ForecastMetrics;