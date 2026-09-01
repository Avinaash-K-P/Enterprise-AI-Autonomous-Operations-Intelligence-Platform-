import { NavLink } from "react-router-dom";

function Sidebar() {

const navigationItems = [
    {
        name: "Dashboard",
        path: "/dashboard",
        icon: "bi-speedometer2",
    },

    {
        name: "Dataset Upload",
        path: "/dataset-upload",
        icon: "bi-database-add",
    },

    {
        name: "Forecast Models",
        path: "/forecast-models",
        icon: "bi-cpu",
    },

    {
        name: "Forecast Runs",
        path: "/forecast-runs",
        icon: "bi-play-circle",
    },

    {
        name: "Anomaly",
        path: "/anomaly",
        icon: "bi-exclamation-triangle",
    },

    {
        name: "Root Cause",
        path: "/root-cause",
        icon: "bi-diagram-2",
    },

    {
        name: "Optimization",
        path: "/optimization",
        icon: "bi-sliders2",
    },

    {
        name: "Scenarios",
        path: "/scenarios",
        icon: "bi-bezier2",
    },

    {
        name: "Tenants",
        path: "/tenants",
        icon: "bi-buildings",
    },

    {
        name: "Metrics",
        path: "/forecast-metrics",
        icon: "bi-bar-chart-line",
    },

    {
        name: "Downloads",
        path: "/downloads",
        icon: "bi-cloud-download",
    },
];


    return (
        <aside className="dashboard-sidebar">

            <nav>

                {navigationItems.map((item) => (

                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""}`
                        }
                    >

                        <i className={`bi ${item.icon}`}></i>

                        <span>{item.name}</span>

                    </NavLink>

                ))}

            </nav>

        </aside>
    );
}

export default Sidebar;