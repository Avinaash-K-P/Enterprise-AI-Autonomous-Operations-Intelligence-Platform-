import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";


function ModelPerformanceChart({ data = [] }) {

    // Handle possible API response wrappers
    const chartData = Array.isArray(data)
        ? data
        : data?.data || data?.results || [];


    return (
        <div className="card shadow-sm border-0 h-100">

            <div className="card-body">

                <h5 className="fw-bold mb-1">
                    Model Performance
                </h5>

                <p className="text-muted small mb-4">
                    Comparison of forecasting model performance.
                </p>


                {chartData.length === 0 ? (

                    <div className="text-center text-muted py-5">
                        No model performance data available.
                    </div>

                ) : (

                    <div style={{ width: "100%", height: 350 }}>

                        <ResponsiveContainer>
                            <BarChart data={chartData}>

                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="model_type"
                                    tick={{ fontSize: 12 }}
                                />

                                <YAxis />

                                <Tooltip />

                                <Legend />

                                <Bar
                                    dataKey="accuracy"
                                    name="Accuracy"
                                />

                                <Bar
                                    dataKey="mae"
                                    name="MAE"
                                />

                                <Bar
                                    dataKey="rmse"
                                    name="RMSE"
                                />

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                )}

            </div>

        </div>
    );
}


export default ModelPerformanceChart;

