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


function EntityComparisonChart({ data = [] }) {

    // Handle possible API response wrappers
    const chartData = Array.isArray(data)
        ? data
        : data?.data || data?.results || [];


    return (
        <div className="card shadow-sm border-0 h-100">

            <div className="card-body">

                <h5 className="fw-bold mb-1">
                    Entity Comparison
                </h5>

                <p className="text-muted small mb-4">
                    Compare metric values across facilities
                    and devices.
                </p>


                {chartData.length === 0 ? (

                    <div className="text-center text-muted py-5">
                        No entity comparison data available.
                    </div>

                ) : (

                    <div style={{ width: "100%", height: 350 }}>

                        <ResponsiveContainer>
                            <BarChart data={chartData}>

                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="entity_id"
                                    tick={{ fontSize: 12 }}
                                />

                                <YAxis />

                                <Tooltip />

                                <Legend />

                                <Bar
                                    dataKey="value"
                                    name="Value"
                                />

                            </BarChart>

                        </ResponsiveContainer>

                    </div>

                )}

            </div>

        </div>
    );
}


export default EntityComparisonChart;

