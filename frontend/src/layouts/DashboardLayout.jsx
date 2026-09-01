import { Outlet } from "react-router-dom";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

import "/src/styles/layout.css"

function DashboardLayout() {

    return (
        <div className="dashboard-layout">

            <Header />

            <div className="dashboard-body">

                <Sidebar />

                <main className="dashboard-content">

                    <Outlet />

                </main>

            </div>

            <Footer />

        </div>
    );
}

export default DashboardLayout;