import { useState } from "react";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

import { toast } from "react-toastify";

import { getHistoricalVsPredicted } from "../services/dashboardService"; 

function HistoricalVsPredictedChart() {

    const [metricId, setMetricId] = useState("");
    const [entityType, setEntityType] = useState("");
    const [entityId, setEntityId] = useState("");
    const [runId, setRunId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [chartData, setChartData] = useState([]);
    const [metadata, setMetadata] = useState(null);

    const [loading, setLoading] = useState(false);


    const handleLoadChart = async (e) => {

        e.preventDefault();

        if (!metricId || !entityType || !entityId) {

            toast.error(
                "Metric ID, Entity Type and Entity ID are required."
            );

            return;
        }

        setLoading(true);

        try {

            const params = {
                metric_id: Number(metricId),
                entity_type: entityType,
                entity_id: Number(entityId),
            };


            /*
             * Add optional parameters only
             * when the user provides them.
             */

            if (runId) {
                params.run_id = Number(runId);
            }

            if (startDate) {
                params.start_date = startDate;
            }

            if (endDate) {
                params.end_date = endDate;
            }


            const data = await getHistoricalVsPredicted(params);


            /*
             * Store metadata
             */

            setMetadata({
                metric_id: data.metric_id,
                entity_type: data.entity_type,
                entity_id: data.entity_id,
                run_id: data.run_id,
            });


            /*
             * Convert historical data
             */

            const historicalData = (data.historical || []).map(
                (item) => ({
                    timestamp: item.timestamp,
                    historical: item.value,
                    predicted: null,
                    lower_bound: null,
                    upper_bound: null,
                })
            );


            /*
             * Convert predicted data
             */

            const predictedData = (data.predicted || []).map(
                (item) => ({
                    timestamp: item.timestamp,
                    historical: null,
                    predicted: item.predicted_value,
                    lower_bound: item.lower_bound,
                    upper_bound: item.upper_bound,
                })
            );


            /*
             * Combine both datasets
             */

            const combinedData = [
                ...historicalData,
                ...predictedData,
            ];


            /*
             * Sort by timestamp
             */

            combinedData.sort(
                (a, b) =>
                    new Date(a.timestamp) -
                    new Date(b.timestamp)
            );


            setChartData(combinedData);

        } catch (error) {

            console.error(
                "Failed to fetch historical vs predicted data:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to load historical and predicted data."
            );

            setChartData([]);
            setMetadata(null);

        } finally {

            setLoading(false);

        }
    };


    return (
        <div className="card shadow-sm border-0 mt-4">

            <div className="card-body">

                <div className="mb-4">

                    <h5 className="fw-bold mb-1">
                        Historical vs Predicted
                    </h5>

                    <p className="text-muted mb-0">
                        Compare historical measurements with
                        forecast predictions.
                    </p>

                </div>


                {/* Filters */}

                <form onSubmit={handleLoadChart}>

                    <div className="row g-3">

                        {/* Metric ID */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Metric ID
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                value={metricId}
                                onChange={(e) =>
                                    setMetricId(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Entity Type */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Entity Type
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. vehicle"
                                value={entityType}
                                onChange={(e) =>
                                    setEntityType(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Entity ID */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Entity ID
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                value={entityId}
                                onChange={(e) =>
                                    setEntityId(e.target.value)
                                }
                                required
                            />

                        </div>


                        {/* Run ID */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Run ID
                            </label>

                            <input
                                type="number"
                                className="form-control"
                                placeholder="Optional"
                                value={runId}
                                onChange={(e) =>
                                    setRunId(e.target.value)
                                }
                            />

                        </div>


                        {/* Start Date */}

                        <div className="col-md-4">

                            <label className="form-label">
                                Start Date
                            </label>

                            <input
                                type="datetime-local"
                                className="form-control"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                            />

                        </div>


                        {/* End Date */}

                        <div className="col-md-4">

                            <label className="form-label">
                                End Date
                            </label>

                            <input
                                type="datetime-local"
                                className="form-control"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(e.target.value)
                                }
                            />

                        </div>


                        {/* Load Button */}

                        <div className="col-12">

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >

                                {loading
                                    ? "Loading..."
                                    : "Load Chart"}

                            </button>

                        </div>

                    </div>

                </form>


                {/* Metadata */}

                {metadata && (

                    <div className="row mt-4 mb-3">

                        <div className="col-md-3">
                            <small className="text-muted">
                                Metric ID
                            </small>

                            <div className="fw-semibold">
                                {metadata.metric_id}
                            </div>
                        </div>


                        <div className="col-md-3">
                            <small className="text-muted">
                                Entity Type
                            </small>

                            <div className="fw-semibold">
                                {metadata.entity_type}
                            </div>
                        </div>


                        <div className="col-md-3">
                            <small className="text-muted">
                                Entity ID
                            </small>

                            <div className="fw-semibold">
                                {metadata.entity_id}
                            </div>
                        </div>


                        <div className="col-md-3">
                            <small className="text-muted">
                                Run ID
                            </small>

                            <div className="fw-semibold">
                                {metadata.run_id ?? "N/A"}
                            </div>
                        </div>

                    </div>

                )}


                {/* Chart */}

                {chartData.length > 0 && (

                    <ResponsiveContainer
                        width="100%"
                        height={400}
                    >

                        <LineChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 10,
                                bottom: 10,
                            }}
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                            />

                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(value) =>
                                    new Date(
                                        value
                                    ).toLocaleDateString()
                                }
                            />

                            <YAxis />

                            <Tooltip
                                labelFormatter={(value) =>
                                    new Date(
                                        value
                                    ).toLocaleString()
                                }
                            />

                            <Legend />


                            <Line
                                type="monotone"
                                dataKey="historical"
                                name="Historical"
                                stroke="#0d6efd"
                                strokeWidth={2}
                                dot={false}
                            />


                            <Line
                                type="monotone"
                                dataKey="predicted"
                                name="Predicted"
                                stroke="#198754"
                                strokeWidth={2}
                                dot={false}
                            />


                            <Line
                                type="monotone"
                                dataKey="lower_bound"
                                name="Lower Bound"
                                stroke="#ffc107"
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                                dot={false}
                            />


                            <Line
                                type="monotone"
                                dataKey="upper_bound"
                                name="Upper Bound"
                                stroke="#dc3545"
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                                dot={false}
                            />

                        </LineChart>

                    </ResponsiveContainer>

                )}


                {!loading &&
                    chartData.length === 0 &&
                    metadata === null && (
                        <div className="text-center text-muted py-5">
                            Enter the required parameters and
                            click "Load Chart".
                        </div>
                    )}

            </div>

        </div>
    );
}

export default HistoricalVsPredictedChart;