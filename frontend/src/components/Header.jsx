import { useState } from "react";
import { jwtDecode } from "jwt-decode"
import { useNavigate } from "react-router-dom";

function Header() {

    const navigate = useNavigate();

    const [showMenu, setShowMenu] = useState(false);

    const token = localStorage.getItem("access_token");

    let username = "User";

    if (token) {
        try {
            const decoded = jwtDecode(token);
            username = decoded.username || "User";
        } catch (error) {
            console.error("Invalid token:", error);
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");

        window.location.href = "/";
    };

    return (
        <header className="dashboard-header">

            <div className="header-left">
                <h4 className="mb-0">
                    Enterprise AI Autonomous Operations Platform
                </h4>
            </div>

            <div className="header-right">

                <span className="welcome-text">
                    Welcome, {username}
                </span>

                <div className="user-menu">

                    <button
                        className="user-button"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <i className="bi bi-person-circle"></i>
                        <i className="bi bi-chevron-down"></i>
                    </button>

                    {showMenu && (
                        <div className="user-dropdown">

                            <button
                                onClick={() => {
                                    window.location.href = "/profile";
                                }}
                            >
                                <i className="bi bi-person"></i>
                                Profile
                            </button>

                            <button onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right"></i>
                                Logout
                            </button>

                        </div>
                    )}

                </div>

            </div>

        </header>
    );
}

export default Header;