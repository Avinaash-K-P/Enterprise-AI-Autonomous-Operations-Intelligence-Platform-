import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
    getDashboardKPIs,
    getModelPerformance,
    getEntityComparison
     
} from "../../services/dashboardService";
import HistoricalVsPredictedChart from "../../components/HistoricalVsPredictedChart";
import ModelPerformanceChart from "../../components/ModelPerformanceChart";
import EntityComparisonChart from "../../components/EntityComparisonChart";
import AnomalyHeatmap from "../../components/AnomalyHeatmap";

function Dashboard() {

    const [kpis, setKpis] = useState(null);

    const [modelPerformance, setModelPerformance] = useState([]);
    const [entityComparison, setEntityComparison] = useState([]);

    const [loading, setLoading] = useState(true);


    // ==================================================
    // FETCH DASHBOARD DATA
    // ==================================================

    useEffect(() => {

        const fetchDashboardData = async () => {

            try {

                setLoading(true);


                const [
                    kpiResponse,
                    modelPerformanceResponse,
                    entityComparisonResponse,
                ] = await Promise.all([

                    getDashboardKPIs(),

                    getModelPerformance(),

                    getEntityComparison(),

                ]);


                // ------------------------------------------
                // KPI DATA
                // ------------------------------------------

                setKpis(
                    kpiResponse.data
                        ? kpiResponse.data
                        : kpiResponse
                );


                // ------------------------------------------
                // MODEL PERFORMANCE
                // ------------------------------------------

                setModelPerformance(
                    modelPerformanceResponse.data
                        ? modelPerformanceResponse.data
                        : modelPerformanceResponse
                );


                // ------------------------------------------
                // ENTITY COMPARISON
                // ------------------------------------------

                setEntityComparison(
                    entityComparisonResponse.data
                        ? entityComparisonResponse.data
                        : entityComparisonResponse
                );


            } catch (error) {

                console.error(
                    "Failed to fetch dashboard data:",
                    error
                );


                toast.error(
                    error.response?.data?.detail ||
                    "Failed to load dashboard data."
                );


            } finally {

                setLoading(false);

            }

        };


        fetchDashboardData();

    }, []);


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (

            <div className="text-center py-5">

                <div
                    className="spinner-border"
                    role="status"
                >

                    <span className="visually-hidden">
                        Loading...
                    </span>

                </div>

                <p className="mt-2">
                    Loading dashboard...
                </p>

            </div>
        );
    }


    // ==================================================
    // ERROR
    // ==================================================

    if (!kpis) {

        return (

            <div className="alert alert-danger">
                Unable to load dashboard data.
            </div>

        );
    }


    return (
        <div>

            {/* Dashboard Header */}

            <div className="mb-4">

                <h2 className="fw-bold">
                    Dashboard
                </h2>

                <p className="text-muted mb-0">
                    Overview of your AI-powered operations.
                </p>

            </div>


            {/* KPI Cards */}

            <div className="row g-4">

                {/* Total Forecast Results */}

                <div className="col-xl-4 col-md-6">

                    <div className="card h-100 shadow-sm border-0">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-muted mb-2">
                                        Total Forecast Results
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {kpis.total_forecast_results}
                                    </h3>
                                </div>

                                <div className="fs-1 text-primary">
                                    <i className="bi bi-graph-up"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Average Predicted Value */}

                <div className="col-xl-4 col-md-6">

                    <div className="card h-100 shadow-sm border-0">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-muted mb-2">
                                        Average Predicted Value
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {Number(
                                            kpis.average_predicted_value
                                        ).toFixed(2)}
                                    </h3>
                                </div>

                                <div className="fs-1 text-success">
                                    <i className="bi bi-bar-chart-line"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Estimated Savings */}

                <div className="col-xl-4 col-md-6">

                    <div className="card h-100 shadow-sm border-0">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-muted mb-2">
                                        Estimated Savings
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {Number(
                                            kpis.total_estimated_savings
                                        ).toFixed(2)}
                                    </h3>
                                </div>

                                <div className="fs-1 text-success">
                                    <i className="bi bi-currency-dollar"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Active Recommendations */}

                <div className="col-xl-4 col-md-6">

                    <div className="card h-100 shadow-sm border-0">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-muted mb-2">
                                        Active Recommendations
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {kpis.active_recommendations}
                                    </h3>
                                </div>

                                <div className="fs-1 text-warning">
                                    <i className="bi bi-lightbulb"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Failure Probability */}

                <div className="col-xl-4 col-md-6">

                    <div className="card h-100 shadow-sm border-0">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-muted mb-2">
                                        Avg. Failure Probability
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {Number(
                                            kpis.average_failure_probability
                                        ).toFixed(2)}
                                    </h3>
                                </div>

                                <div className="fs-1 text-danger">
                                    <i className="bi bi-exclamation-triangle"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Performance Degradation */}

                <div className="col-xl-4 col-md-6">

                    <div className="card h-100 shadow-sm border-0">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>
                                    <p className="text-muted mb-2">
                                        Avg. Performance Degradation
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {Number(
                                            kpis.average_performance_degradation
                                        ).toFixed(2)}
                                    </h3>
                                </div>

                                <div className="fs-1 text-danger">
                                    <i className="bi bi-speedometer"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>
        
        {/* Historical vs Predicted Chart */}
        <HistoricalVsPredictedChart />    

        
        <div className="row g-4 mt-1">
                                            
            {/* Model Performance */}
                                            
            <div className="col-lg-6">
                                            
                <ModelPerformanceChart
                    data={modelPerformance}
                />
        
            </div>
                                            
                                            
            {/* Entity Comparison */}
                                            
            <div className="col-lg-6">
                                            
                <EntityComparisonChart
                    data={entityComparison}
                />
        
            </div>
                                            
        </div>                                

        <AnomalyHeatmap/>                                     

        </div>
    );
}

export default Dashboard;