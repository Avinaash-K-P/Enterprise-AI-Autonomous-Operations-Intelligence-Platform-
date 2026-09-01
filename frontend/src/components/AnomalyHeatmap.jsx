import "/src/styles/anomaly.css";


function AnomalyHeatmap({ data = [] }) {

    /*
     * The backend response structure may be adjusted
     * after checking the actual API response.
     */

    const heatmapData = Array.isArray(data)
        ? data
        : data?.data || data?.results || [];


    // --------------------------------------------------
    // Get intensity class
    // --------------------------------------------------

    const getIntensityClass = (value) => {

        if (value === null || value === undefined) {
            return "heatmap-empty";
        }

        const score = Number(value);

        if (score >= 0.8) {
            return "heatmap-high";
        }

        if (score >= 0.5) {
            return "heatmap-medium";
        }

        if (score > 0) {
            return "heatmap-low";
        }

        return "heatmap-normal";
    };


    // --------------------------------------------------
    // Empty state
    // --------------------------------------------------

    if (heatmapData.length === 0) {

        return (

            <div className="card shadow-sm border-0 h-100">

                <div className="card-body">

                    <h5 className="fw-bold mb-1">
                        Anomaly Heatmap
                    </h5>

                    <p className="text-muted small mb-4">
                        Anomaly intensity across entities
                        and time periods.
                    </p>

                    <div className="text-center text-muted py-5">
                        No anomaly data available.
                    </div>

                </div>

            </div>
        );
    }


    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    return (

        <div className="card shadow-sm border-0">

            <div className="card-body">

                <div className="d-flex justify-content-between align-items-center mb-3">

                    <div>

                        <h5 className="fw-bold mb-1">
                            Anomaly Heatmap
                        </h5>

                        <p className="text-muted small mb-0">
                            Anomaly intensity across
                            entities and time.
                        </p>

                    </div>

                </div>


                <div className="heatmap-container">

                    {heatmapData.map((item, index) => {

                        const value =
                            item.anomaly_score ??
                            item.score ??
                            item.value ??
                            0;


                        const entity =
                            item.entity_name ??
                            item.entity_id ??
                            `Entity ${index + 1}`;


                        const timestamp =
                            item.timestamp ??
                            item.date ??
                            "";


                        return (

                            <div
                                key={index}
                                className={`heatmap-cell ${getIntensityClass(value)}`}
                                title={`${entity} | ${timestamp} | Score: ${value}`}
                            >

                                <span className="heatmap-value">
                                    {Number(value).toFixed(2)}
                                </span>

                            </div>

                        );

                    })}

                </div>


                {/* Legend */}

                <div className="d-flex align-items-center gap-3 mt-4">

                    <small className="text-muted">
                        Anomaly Intensity:
                    </small>

                    <div className="d-flex align-items-center gap-1">

                        <span className="heatmap-legend heatmap-normal"></span>
                        <small>Normal</small>

                    </div>

                    <div className="d-flex align-items-center gap-1">

                        <span className="heatmap-legend heatmap-low"></span>
                        <small>Low</small>

                    </div>

                    <div className="d-flex align-items-center gap-1">

                        <span className="heatmap-legend heatmap-medium"></span>
                        <small>Medium</small>

                    </div>

                    <div className="d-flex align-items-center gap-1">

                        <span className="heatmap-legend heatmap-high"></span>
                        <small>High</small>

                    </div>

                </div>

            </div>

        </div>
    );
}


export default AnomalyHeatmap;

