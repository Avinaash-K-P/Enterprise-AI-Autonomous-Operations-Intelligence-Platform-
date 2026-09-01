import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";
import {toast} from "react-toastify";
import "/src/styles/auth.css";

function Register() {

    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");

    const handleRegister = async(e) => {
        e.preventDefault();

    try{

        const userData = {
            username,
            email,
            password,
            role
        };

        const response = await registerUser(userData);

        toast.success(response.data.message);

        navigate("/");

        } 

        catch (error) {

            toast.error(error.response?.data?.detail || "Registration failed");

        }

    };

    return (

    <div className="register-bg"> 

        <div className="container d-flex justify-content-center align-items-center vh-100">

            <div className="card shadow p-4" style={{ width: "400px" }}>

                <h3 className="text-center mb-3">Register</h3>

                <form onSubmit={handleRegister}>

                    <div className="mb-3">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Role</label>
                        <input
                            type="password"
                            className="form-control"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        />
                    </div>


                    <button className="btn btn-success w-100">
                        Register
                    </button>

                </form>

                <p className="text-center mt-3">
                    Already have an account?{" "}
                    <span
                        style={{ cursor: "pointer", color: "blue" }}
                        onClick={() => navigate("/")}
                    >
                        Login
                    </span>
                </p>

            </div>

        </div>

    </div>       
    );
}

export default Register;