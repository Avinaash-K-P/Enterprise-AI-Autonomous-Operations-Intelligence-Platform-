import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getMyProfile } from "../../services/authService";
import "../../styles/profile.css";


function Profile() {

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);


    // ==================================================
    // FETCH PROFILE
    // ==================================================

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const response = await getMyProfile();

                setProfile(response.data.data);

            } catch (error) {

                console.error(
                    "Failed to fetch profile:",
                    error
                );

                toast.error(
                    error.response?.data?.detail ||
                    "Failed to load profile."
                );

            } finally {

                setLoading(false);

            }

        };


        fetchProfile();

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
                    Loading profile...
                </p>

            </div>

        );

    }


    // ==================================================
    // ERROR
    // ==================================================

    if (!profile) {

        return (

            <div className="alert alert-danger">
                Unable to load profile.
            </div>

        );

    }


    // ==================================================
    // PROFILE UI
    // ==================================================

    return (

        <div className="profile-page">

            <div className="profile-card card shadow-sm border-0">

                {/* ------------------------------------------
                    PROFILE HEADER
                ------------------------------------------ */}

                <div className="profile-header">

                    <div className="profile-avatar">

                        <i className="bi bi-person-fill"></i>

                    </div>

                    <h3 className="mt-3 mb-1">
                        My Profile
                    </h3>

                    <p className="text-muted mb-0">
                        Account information
                    </p>

                </div>


                {/* ------------------------------------------
                    PROFILE DETAILS
                ------------------------------------------ */}

                <div className="profile-details">

                    <div className="profile-item">

                        <div className="profile-icon">

                            <i className="bi bi-person"></i>

                        </div>

                        <div>

                            <small className="text-muted">
                                Username
                            </small>

                            <div className="fw-semibold">
                                {profile.username}
                            </div>

                        </div>

                    </div>


                    <div className="profile-item">

                        <div className="profile-icon">

                            <i className="bi bi-envelope"></i>

                        </div>

                        <div>

                            <small className="text-muted">
                                Email
                            </small>

                            <div className="fw-semibold">
                                {profile.email}
                            </div>

                        </div>

                    </div>


                    <div className="profile-item">

                        <div className="profile-icon">

                            <i className="bi bi-shield-check"></i>

                        </div>

                        <div>

                            <small className="text-muted">
                                Role
                            </small>

                            <div>

                                <span className="badge bg-primary">
                                    {profile.role}
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default Profile;

