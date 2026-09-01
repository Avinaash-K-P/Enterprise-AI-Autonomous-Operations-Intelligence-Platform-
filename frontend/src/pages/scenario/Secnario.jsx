import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    createScenario,
    getScenarios,
} from "../../services/scenarioService";


function Scenario() {

    // ==================================================
    // CREATE SCENARIO STATE
    // ==================================================

    const [runningScenarioId, setRunningScenarioId] = useState(null);

    const [scenarioForm, setScenarioForm] = useState({
        name: "",
        scenario_type: "",
        entity_type: "",
        entity_id: "",
        start_time: "",
        end_time: "",
        severity: "medium",
        input_parameters: "",
    });


    // ==================================================
    // SCENARIO LIST STATE
    // ==================================================

    const [scenarios, setScenarios] = useState([]);

    const [loading, setLoading] = useState(false);

    const [creating, setCreating] = useState(false);


    // ==================================================
    // FILTER STATE
    // ==================================================

    const [filters, setFilters] = useState({
        scenario_type: "",
        status_filter: "",
        entity_type: "",
        entity_id: "",
    });


    // ==================================================
    // MODAL STATE
    // ==================================================

    const [showCreateModal, setShowCreateModal] =
        useState(false);


    // ==================================================
    // HANDLE CREATE FORM INPUT
    // ==================================================

    const handleScenarioChange = (e) => {

        const { name, value } = e.target;

        setScenarioForm((previous) => ({
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
    // FETCH SCENARIOS
    // GET /simulations
    // ==================================================

    const fetchScenarios = async (customFilters = filters) => {

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
                await getScenarios(params);


            console.log(
                "GET /simulations response:",
                response
            );


            /*
             * Backend response is:
             *
             * [
             *   {
             *      id: ...,
             *      name: ...,
             *      ...
             *   }
             * ]
             *
             * But this also safely handles
             * an API response wrapped inside data.
             */

            if (Array.isArray(response)) {

                setScenarios(response);

            } else if (Array.isArray(response?.data)) {

                setScenarios(response.data);

            } else {

                setScenarios([]);
            }

        } catch (error) {

            console.error(
                "Failed to fetch scenarios:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to load scenarios."
            );

            setScenarios([]);

        } finally {

            setLoading(false);
        }
    };

// ==================================================
// RUN SCENARIO
// POST /simulations/{scenario_id}/run
// ==================================================

const handleRunScenario = async (scenarioId) => {

    if (!scenarioId) {
        toast.error("Invalid scenario ID.");
        return;
    }

    try {

        setRunningScenarioId(scenarioId);

        const response = await runScenario(scenarioId);

        console.log(
            "POST /simulations/{scenario_id}/run response:",
            response
        );

        toast.success(
            response?.data?.message ||
            "Scenario simulation completed successfully."
        );

        // Refresh scenario table
        await fetchScenarios();

    } catch (error) {

        console.error(
            "Failed to run scenario:",
            error
        );

        toast.error(
            error.response?.data?.detail ||
            error.response?.data?.message ||
            "Failed to run scenario."
        );

    } finally {

        setRunningScenarioId(null);
    }
};



    const handleCreateScenario = async (e) => {

        e.preventDefault();


        // -----------------------------
        // Basic validation
        // -----------------------------

        if (!scenarioForm.name.trim()) {

            toast.error("Scenario name is required.");

            return;
        }


        if (!scenarioForm.scenario_type.trim()) {

            toast.error("Scenario type is required.");

            return;
        }


        if (!scenarioForm.entity_type.trim()) {

            toast.error("Entity type is required.");

            return;
        }


        if (!scenarioForm.entity_id) {

            toast.error("Entity ID is required.");

            return;
        }


        // -----------------------------
        // Parse input parameters
        // -----------------------------

        let inputParameters = null;


        if (scenarioForm.input_parameters.trim()) {

            try {

                inputParameters = JSON.parse(
                    scenarioForm.input_parameters
                );

            } catch (error) {

                toast.error(
                    "Input Parameters must contain valid JSON."
                );

                return;
            }
        }


        // -----------------------------
        // Prepare payload
        // -----------------------------

        const payload = {

            name:
                scenarioForm.name.trim(),

            scenario_type:
                scenarioForm.scenario_type.trim(),

            entity_type:
                scenarioForm.entity_type.trim(),

            entity_id:
                Number(scenarioForm.entity_id),

            start_time:
                scenarioForm.start_time
                    ? new Date(
                          scenarioForm.start_time
                      ).toISOString()
                    : null,

            end_time:
                scenarioForm.end_time
                    ? new Date(
                          scenarioForm.end_time
                      ).toISOString()
                    : null,

            severity:
                scenarioForm.severity,

            input_parameters:
                inputParameters,
        };


        try {

            setCreating(true);


            const response =
                await createScenario(payload);


            console.log(
                "POST /simulations response:",
                response
            );


            toast.success(
                response?.data?.message ||
                response?.message ||
                "Scenario created successfully."
            );


            // Close modal

            setShowCreateModal(false);


            // Reset form

            setScenarioForm({
                name: "",
                scenario_type: "",
                entity_type: "",
                entity_id: "",
                start_time: "",
                end_time: "",
                severity: "medium",
                input_parameters: "",
            });


            // Refresh table

            await fetchScenarios();

        } catch (error) {

            console.error(
                "Failed to create scenario:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Failed to create scenario."
            );

        } finally {

            setCreating(false);
        }
    };


    // ==================================================
    // APPLY FILTERS
    // ==================================================

    const handleApplyFilters = async (e) => {

        e.preventDefault();

        await fetchScenarios(filters);
    };


    // ==================================================
    // CLEAR FILTERS
    // ==================================================

    const handleClearFilters = async () => {

        const emptyFilters = {
            scenario_type: "",
            status_filter: "",
            entity_type: "",
            entity_id: "",
        };


        setFilters(emptyFilters);

        await fetchScenarios(emptyFilters);
    };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        fetchScenarios();

    }, []);


    // ==================================================
    // JSX
    // ==================================================

    return (

        <div className="container-fluid">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Scenario Simulation
                    </h2>

                    <p className="text-muted mb-0">
                        Create and monitor enterprise
                        scenario simulations.
                    </p>

                </div>


                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                        setShowCreateModal(true)
                    }
                >
                    + Create Scenario
                </button>

            </div>


            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <h5 className="fw-bold mb-3">
                        Filter Scenarios
                    </h5>


                    <form
                        onSubmit={
                            handleApplyFilters
                        }
                    >

                        <div className="row g-3">


                            {/* Scenario Type */}

                            <div className="col-md-3">

                                <label className="form-label">
                                    Scenario Type
                                </label>

                                <input
                                    type="text"
                                    name="scenario_type"
                                    className="form-control"
                                    placeholder="Scenario type"
                                    value={
                                        filters.scenario_type
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                />

                            </div>


                            {/* Status */}

                            <div className="col-md-3">

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

                                    <option value="running">
                                        Running
                                    </option>

                                    <option value="completed">
                                        Completed
                                    </option>

                                    <option value="failed">
                                        Failed
                                    </option>

                                </select>

                            </div>


                            {/* Entity Type */}

                            <div className="col-md-3">

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

                            <div className="col-md-3">

                                <label className="form-label">
                                    Entity ID
                                </label>

                                <input
                                    type="number"
                                    name="entity_id"
                                    className="form-control"
                                    placeholder="Entity ID"
                                    min="1"
                                    value={
                                        filters.entity_id
                                    }
                                    onChange={
                                        handleFilterChange
                                    }
                                />

                            </div>


                            {/* Filter Buttons */}

                            <div className="col-12 d-flex justify-content-end gap-2">

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={
                                        handleClearFilters
                                    }
                                >
                                    Clear
                                </button>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Loading..."
                                        : "Apply Filters"}
                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* ==================================================
                SCENARIO TABLE
            ================================================== */}

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-3">

                        <div>

                            <h5 className="fw-bold mb-1">
                                Scenarios
                            </h5>

                            <small className="text-muted">
                                Available simulation scenarios.
                            </small>

                        </div>


                        <span className="badge bg-secondary">
                            {scenarios.length} Results
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

                            <p className="text-muted mt-2">
                                Loading scenarios...
                            </p>

                        </div>

                    ) : scenarios.length === 0 ? (

                        <div className="text-center text-muted py-5">

                            No scenarios found.

                        </div>

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>

                                        <th>ID</th>

                                        <th>Name</th>

                                        <th>Scenario Type</th>

                                        <th>Entity</th>

                                        <th>Severity</th>

                                        <th>Status</th>

                                        <th>Failure Probability</th>

                                        <th>Performance Degradation</th>

                                        <th>Predicted Savings</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {scenarios.map(
                                        (scenario) => (

                                            <tr
                                                key={
                                                    scenario.id
                                                }
                                            >

                                                <td>
                                                    {
                                                        scenario.id
                                                    }
                                                </td>


                                                <td>

                                                    <strong>
                                                        {
                                                            scenario.name
                                                        }
                                                    </strong>

                                                </td>


                                                <td>
                                                    {
                                                        scenario.scenario_type ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>

                                                    {
                                                        scenario.entity_type ||
                                                        "-"
                                                    }

                                                    {" #"}

                                                    {
                                                        scenario.entity_id ??
                                                        "-"
                                                    }

                                                </td>


                                                <td>

                                                    <span className="badge bg-warning text-dark">

                                                        {
                                                            scenario.severity ||
                                                            "-"
                                                        }

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="badge bg-secondary">

                                                        {
                                                            scenario.status ||
                                                            "-"
                                                        }

                                                    </span>

                                                </td>


                                                <td>
                                                    {
                                                        scenario.failure_probability ??
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        scenario.performance_degradation ??
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        scenario.predicted_savings ??
                                                        "-"
                                                    }
                                                </td>

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() =>
                                                            handleRunScenario(scenario.id)
                                                        }
                                                        disabled={
                                                            runningScenarioId === scenario.id
                                                        }
                                                    >
                                                    
                                                        {runningScenarioId === scenario.id ? (
                                                        
                                                            <>
                                                                <span
                                                                    className="spinner-border spinner-border-sm me-1"
                                                                    role="status"
                                                                ></span>

                                                                Running...
                                                            </>

                                                        ) : (
                                                        
                                                            "Run"
                                                        )}

                                                    </button>
                                                    
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
                CREATE SCENARIO MODAL
            ================================================== */}

            {showCreateModal && (

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
                                    Create Scenario
                                </h5>

                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() =>
                                        setShowCreateModal(
                                            false
                                        )
                                    }
                                    disabled={creating}
                                ></button>

                            </div>


                            {/* Modal Body */}

                            <form
                                onSubmit={
                                    handleCreateScenario
                                }
                            >

                                <div className="modal-body">

                                    <div className="row g-3">


                                        {/* Name */}

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">
                                                Scenario Name
                                            </label>

                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="Enter scenario name"
                                                value={
                                                    scenarioForm.name
                                                }
                                                onChange={
                                                    handleScenarioChange
                                                }
                                                required
                                                disabled={creating}
                                            />

                                        </div>


                                        {/* Scenario Type */}

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">
                                                Scenario Type
                                            </label>

                                            <input
                                                type="text"
                                                name="scenario_type"
                                                className="form-control"
                                                placeholder="e.g. stress_test"
                                                value={
                                                    scenarioForm.scenario_type
                                                }
                                                onChange={
                                                    handleScenarioChange
                                                }
                                                required
                                                disabled={creating}
                                            />

                                        </div>


                                        {/* Entity Type */}

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">
                                                Entity Type
                                            </label>

                                            <input
                                                type="text"
                                                name="entity_type"
                                                className="form-control"
                                                placeholder="e.g. device"
                                                value={
                                                    scenarioForm.entity_type
                                                }
                                                onChange={
                                                    handleScenarioChange
                                                }
                                                required
                                                disabled={creating}
                                            />

                                        </div>


                                        {/* Entity ID */}

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">
                                                Entity ID
                                            </label>

                                            <input
                                                type="number"
                                                name="entity_id"
                                                className="form-control"
                                                placeholder="Entity ID"
                                                min="1"
                                                value={
                                                    scenarioForm.entity_id
                                                }
                                                onChange={
                                                    handleScenarioChange
                                                }
                                                required
                                                disabled={creating}
                                            />

                                        </div>


                                        {/* Start Time */}

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">
                                                Start Time
                                            </label>

                                            <input
                                                type="datetime-local"
                                                name="start_time"
                                                className="form-control"
                                                value={
                                                    scenarioForm.start_time
                                                }
                                                onChange={
                                                    handleScenarioChange
                                                }
                                                disabled={creating}
                                            />

                                        </div>


                                        {/* End Time */}

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">
                                                End Time
                                            </label>

                                            <input
                                                type="datetime-local"
                                                name="end_time"
                                                className="form-control"
                                                value={
                                                    scenarioForm.end_time
                                                }
                                                onChange={
                                                    handleScenarioChange
                                                }
                                                disabled={creating}
                                            />

                                        </div>


                                        {/* Severity */}

                                        <div className="col-md-6">

                                            <label className="form-label fw-semibold">
                                                Severity
                                            </label>

                                            <select
                                                name="severity"
                                                className="form-select"
                                                value={
                                                    scenarioForm.severity
                                                }
                                                onChange={
                                                    handleScenarioChange
                                                }
                                                disabled={creating}
                                            >

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


                                        {/* Input Parameters */}

                                        <div className="col-12">

                                            <label className="form-label fw-semibold">
                                                Input Parameters
                                            </label>

                                            <textarea
                                                name="input_parameters"
                                                className="form-control"
                                                rows="6"
                                                placeholder={`{
  "temperature": 80,
  "load": 90
}`}
                                                value={
                                                    scenarioForm.input_parameters
                                                }
                                                onChange={
                                                    handleScenarioChange
                                                }
                                                disabled={creating}
                                            ></textarea>

                                            <small className="text-muted">
                                                Optional JSON object.
                                            </small>

                                        </div>

                                    </div>

                                </div>


                                {/* Modal Footer */}

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setShowCreateModal(
                                                false
                                            )
                                        }
                                        disabled={creating}
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating}
                                    >

                                        {creating ? (

                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                ></span>

                                                Creating...
                                            </>

                                        ) : (

                                            "Create Scenario"
                                        )}

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default Scenario;

