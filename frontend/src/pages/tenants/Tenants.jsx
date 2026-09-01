import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    getTenants,
    createTenant,
    updateTenant,
    deleteTenant,
} from "../../services/tenantService";

function Tenant() {

    const [tenants, setTenants] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingTenant, setEditingTenant] = useState(null);

    const [formData, setFormData] = useState({
        organization_name: "",
        industry: "",
        email: "",
        phone: "",
        status: "active",
    });


    // ==================================================
    // GET TENANTS
    // ==================================================

    const fetchTenants = async () => {

        try {

            setLoading(true);

            const data = await getTenants();

            console.log("GET /tenants response:", data);

            /*
             * If your backend returns:
             *
             * {
             *     message: "...",
             *     data: [...]
             * }
             *
             * use:
             *
             * setTenants(data.data);
             *
             * If it directly returns an array:
             *
             * setTenants(data);
             */

            setTenants(
                Array.isArray(data)
                    ? data
                    : data.data || []
            );

        } catch (error) {

            console.error(
                "Failed to fetch tenants:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to load tenants."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        fetchTenants();

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
    // CREATE TENANT
    // ==================================================

    const handleCreate = () => {

        setEditingTenant(null);

        setFormData({
            organization_name: "",
            industry: "",
            email: "",
            phone: "",
            status: "active",
        });

        setShowForm(true);
    };


    // ==================================================
    // EDIT TENANT
    // ==================================================

    const handleEdit = (tenant) => {

        setEditingTenant(tenant);

        setFormData({
            organization_name:
                tenant.organization_name ?? "",

            industry:
                tenant.industry ?? "",

            email:
                tenant.email ?? "",

            phone:
                tenant.phone ?? "",

            status:
                tenant.status ?? "active",
        });

        setShowForm(true);
    };


    // ==================================================
    // CLOSE MODAL
    // ==================================================

    const handleCloseForm = () => {

        setShowForm(false);

        setEditingTenant(null);

        setFormData({
            organization_name: "",
            industry: "",
            email: "",
            phone: "",
            status: "active",
        });
    };


    // ==================================================
    // CREATE / UPDATE TENANT
    // ==================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setSaving(true);

        try {

            if (editingTenant) {

                // ======================================
                // UPDATE
                // ======================================

                const payload = {
                    organization_name:
                        formData.organization_name,

                    industry:
                        formData.industry || null,

                    email:
                        formData.email || null,

                    phone:
                        formData.phone || null,

                    status:
                        formData.status || null,
                };

                const response = await updateTenant(
                    editingTenant.id,
                    payload
                );

                toast.success(
                    response.message ||
                    "Tenant updated successfully."
                );

            } else {

                // ======================================
                // CREATE
                // ======================================

                const payload = {
                    organization_name:
                        formData.organization_name,

                    industry:
                        formData.industry || null,

                    email:
                        formData.email || null,

                    phone:
                        formData.phone || null,
                };

                const response = await createTenant(
                    payload
                );

                toast.success(
                    response.message ||
                    "Tenant created successfully."
                );
            }

            handleCloseForm();

            await fetchTenants();

        } catch (error) {

            console.error(
                "Tenant operation failed:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Tenant operation failed."
            );

        } finally {

            setSaving(false);

        }
    };


    // ==================================================
    // DELETE TENANT
    // ==================================================

    const handleDelete = async () => {

        if (!editingTenant) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${editingTenant.organization_name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setSaving(true);

            const response = await deleteTenant(
                editingTenant.id
            );

            toast.success(
                response.message ||
                "Tenant deleted successfully."
            );

            handleCloseForm();

            await fetchTenants();

        } catch (error) {

            console.error(
                "Failed to delete tenant:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to delete tenant."
            );

        } finally {

            setSaving(false);

        }
    };


    return (
        <div className="container-fluid">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Tenants
                    </h2>

                    <p className="text-muted mb-0">
                        Manage organizations and tenant information.
                    </p>

                </div>


                <button
                    className="btn btn-primary"
                    onClick={handleCreate}
                    disabled={saving}
                >

                    <i className="bi bi-plus-circle me-2"></i>

                    Create Tenant

                </button>

            </div>


            {/* ==================================================
                TENANTS TABLE
            ================================================== */}

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <h5 className="fw-bold mb-0">
                            Tenant List
                        </h5>

                        <span className="text-muted">
                            Total: {tenants.length}
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
                                Loading tenants...
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
                                            Organization
                                        </th>

                                        <th>
                                            Industry
                                        </th>

                                        <th>
                                            Email
                                        </th>

                                        <th>
                                            Phone
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

                                    {tenants.length === 0 ? (

                                        <tr>

                                            <td
                                                colSpan="7"
                                                className="text-center text-muted py-5"
                                            >

                                                <i className="bi bi-building fs-2 d-block mb-2"></i>

                                                No tenants available.

                                            </td>

                                        </tr>

                                    ) : (

                                        tenants.map((tenant) => (

                                            <tr key={tenant.id}>

                                                <td>
                                                    {tenant.id}
                                                </td>

                                                <td className="fw-semibold">
                                                    {tenant.organization_name}
                                                </td>

                                                <td>
                                                    {tenant.industry || "-"}
                                                </td>

                                                <td>
                                                    {tenant.email || "-"}
                                                </td>

                                                <td>
                                                    {tenant.phone || "-"}
                                                </td>

                                                <td>

                                                    {tenant.status === "active" ? (

                                                        <span className="badge bg-success">
                                                            Active
                                                        </span>

                                                    ) : (

                                                        <span className="badge bg-secondary">
                                                            {tenant.status || "Inactive"}
                                                        </span>

                                                    )}

                                                </td>

                                                <td className="text-center">

                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() =>
                                                            handleEdit(tenant)
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


            {/* ==================================================
                CREATE / EDIT MODAL
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


                            {/* Modal Header */}

                            <div className="modal-header">

                                <div>

                                    <h5 className="modal-title fw-bold mb-1">

                                        {editingTenant
                                            ? "Edit Tenant"
                                            : "Create Tenant"}

                                    </h5>

                                    <small className="text-muted">

                                        {editingTenant
                                            ? "Update the tenant information."
                                            : "Add a new organization tenant."}

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


                                        {/* Organization Name */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="organizationName"
                                                className="form-label fw-semibold"
                                            >
                                                Organization Name
                                            </label>

                                            <input
                                                id="organizationName"
                                                name="organization_name"
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter organization name"
                                                value={
                                                    formData.organization_name
                                                }
                                                onChange={handleChange}
                                                minLength="2"
                                                maxLength="150"
                                                required
                                            />

                                        </div>


                                        {/* Industry */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="industry"
                                                className="form-label fw-semibold"
                                            >
                                                Industry
                                            </label>

                                            <input
                                                id="industry"
                                                name="industry"
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. Automotive"
                                                value={
                                                    formData.industry
                                                }
                                                onChange={handleChange}
                                                maxLength="100"
                                            />

                                        </div>


                                        {/* Email */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="email"
                                                className="form-label fw-semibold"
                                            >
                                                Email
                                            </label>

                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                className="form-control"
                                                placeholder="organization@example.com"
                                                value={
                                                    formData.email
                                                }
                                                onChange={handleChange}
                                            />

                                        </div>


                                        {/* Phone */}

                                        <div className="col-md-6">

                                            <label
                                                htmlFor="phone"
                                                className="form-label fw-semibold"
                                            >
                                                Phone
                                            </label>

                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                className="form-control"
                                                placeholder="Enter phone number"
                                                value={
                                                    formData.phone
                                                }
                                                onChange={handleChange}
                                                maxLength="30"
                                            />

                                        </div>


                                        {/* Status - Edit Only */}

                                        {editingTenant && (

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
                                                >

                                                    <option value="active">
                                                        Active
                                                    </option>

                                                    <option value="inactive">
                                                        Inactive
                                                    </option>

                                                    <option value="suspended">
                                                        Suspended
                                                    </option>

                                                </select>

                                            </div>

                                        )}

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

                                        {editingTenant && (

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

                                                    {editingTenant
                                                        ? "Update Tenant"
                                                        : "Create Tenant"}

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

export default Tenant;

