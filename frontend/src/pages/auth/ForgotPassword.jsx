import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
    forgotPassword,
    resetPassword,
} from "../../services/authService";


function ForgotPassword() {

    const navigate = useNavigate();

    const [step, setStep] = useState(1);

    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);


    // ==================================================
    // STEP 1 - FORGOT PASSWORD
    // ==================================================

    const handleForgotPassword = async (e) => {

        e.preventDefault();

        if (!email.trim()) {

            toast.error("Please enter your email.");

            return;
        }

        try {

            setLoading(true);

            
    const response = await forgotPassword(email);

    const token = response.data?.reset_token;

    if (!token) {

        toast.error(
            "Reset token was not returned by the server."
        );

        return;
    }

    setResetToken(token);

    toast.success(
        response.data?.message ||
        "Reset token generated successfully."
    );

    setStep(2);

        } catch (error) {

            console.error(
                "Forgot password error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to process password reset request."
            );

        } finally {

            setLoading(false);

        }

    };


    // ==================================================
    // STEP 2 - RESET PASSWORD
    // ==================================================

    const handleResetPassword = async (e) => {

        e.preventDefault();

        if (!newPassword.trim()) {

            toast.error("Please enter a new password.");

            return;
        }

        if (!confirmPassword.trim()) {

            toast.error(
                "Please retype your new password."
            );

            return;
        }

        if (newPassword !== confirmPassword) {

            toast.error(
                "Passwords do not match."
            );

            return;
        }

        try {

            setLoading(true);

            const response = await resetPassword(
                resetToken,
                newPassword
            );

            toast.success(
                response.data?.message ||
                "Password reset successfully."
            );

            navigate("/");

        } catch (error) {

            console.error(
                "Reset password error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to reset password."
            );

        } finally {

            setLoading(false);

        }

    };


    // ==================================================
    // CANCEL
    // ==================================================

    const handleCancel = () => {

        navigate("/");

    };


    // ==================================================
    // UI
    // ==================================================

    return (

        <div className="login-bg">

            <div className="container d-flex justify-content-center align-items-center vh-100">

                <div
                    className="card shadow p-4"
                    style={{ width: "400px" }}
                >

                    {/* =====================================
                        STEP 1
                    ===================================== */}

                    {step === 1 && (

                        <>

                            <h3 className="text-center mb-2">
                                Forgot Password
                            </h3>

                            <p className="text-center text-muted mb-4">
                                Enter your registered email address.
                            </p>


                            <form
                                onSubmit={handleForgotPassword}
                            >

                                <div className="mb-3">

                                    <label className="form-label">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="Enter your email"
                                        required
                                    />

                                </div>


                                <div className="d-flex gap-2">

                                    <button
                                        type="submit"
                                        className="btn btn-primary flex-grow-1"
                                        disabled={loading}
                                    >

                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                />

                                                Processing...
                                            </>
                                        ) : (
                                            "Submit"
                                        )}

                                    </button>


                                    <button
                                        type="button"
                                        className="btn btn-secondary flex-grow-1"
                                        onClick={handleCancel}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </form>

                        </>

                    )}


                    {/* =====================================
                        STEP 2
                    ===================================== */}

                    {step === 2 && (

                        <>

                            <h3 className="text-center mb-2">
                                Reset Password
                            </h3>

                            <p className="text-center text-muted mb-4">
                                Enter your new password.
                            </p>


                            <form
                                onSubmit={handleResetPassword}
                            >

                                <div className="mb-3">

                                    <label className="form-label">
                                        New Password
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        placeholder="Enter new password"
                                        required
                                    />

                                </div>


                                <div className="mb-3">

                                    <label className="form-label">
                                        Retype Password
                                    </label>

                                    <input
                                        type="password"
                                        className="form-control"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        placeholder="Retype new password"
                                        required
                                    />

                                </div>


                                <div className="d-flex gap-2">

                                    <button
                                        type="submit"
                                        className="btn btn-primary flex-grow-1"
                                        disabled={loading}
                                    >

                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                />

                                                Resetting...
                                            </>
                                        ) : (
                                            "Submit"
                                        )}

                                    </button>


                                    <button
                                        type="button"
                                        className="btn btn-secondary flex-grow-1"
                                        onClick={handleCancel}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </form>

                        </>

                    )}

                </div>

            </div>

        </div>

    );

}


export default ForgotPassword;

