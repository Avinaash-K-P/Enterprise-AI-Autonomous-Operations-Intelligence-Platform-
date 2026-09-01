import { BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/analytics/Dashboard";
import DatasetUpload from "./pages/dataset/DatasetUpload";
import ForecastMetrics from "./pages/forecast/ForecastMetrics";
import Tenant from "./pages/tenants/Tenants";
import ForecastModel from "./pages/forecast/ForecastModel";
import ForecastRun from "./pages/forecast/ForecastRun";
import Anomaly from "./pages/anomaly/Anomaly";
import RootCause from "./pages/anomaly/RootCause";
import Optimization from "./pages/optimization/Optimization";
import Scenario from "./pages/scenario/Secnario";
import Reports from "./pages/downloads/Reports";
import Profile from "./pages/auth/profile";
import ForgotPassword from "./pages/auth/ForgotPassword";

function App() {


  return(  <BrowserRouter>
    
      <Routes>
        
        <Route path="/" element={<Login/>}></Route>

        <Route path="/register" element={<Register/>} ></Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<DashboardLayout />}>

            <Route
                path="/dashboard"
                element={<Dashboard />}
            />

            <Route
                path="/profile"
                element={<Profile />}
            />

            <Route
                path="/dataset-upload"
                element={<DatasetUpload />}
            />

            
            <Route
                path="/forecast-metrics"
                element={<ForecastMetrics />}
            />

            <Route
                path="/tenants"
                element={<Tenant />}
            />

            <Route
                path="/forecast-models"
                element={<ForecastModel />}
            />
            
            <Route
                path="/forecast-runs"
                element={<ForecastRun />}
            />

            <Route
                path="/anomaly"
                element={<Anomaly />}
            />

            <Route
                path="/root-cause"
                element={<RootCause/>}
            />

            
            <Route
                path="/optimization"
                element={<Optimization/>}
            />

                        
            <Route
                path="/scenarios"
                element={<Scenario/>}
            />

            <Route
                path="/downloads"
                element={<Reports/>}
            />

        </Route>

                {/* Unknown Route */}

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

    </Routes>            
    
    </BrowserRouter>
    )


}

export default App
