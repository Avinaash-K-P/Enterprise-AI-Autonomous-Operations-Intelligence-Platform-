import { useState } from "react";
import { toast } from "react-toastify";

import { uploadDataset } from "../../services/datasetService"; 

function DatasetUpload() {

    const [metricId, setMetricId] = useState("");
    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);


    const handleFileChange = (e) => {

        const selectedFile = e.target.files[0];

        if (!selectedFile) {
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setResult(null);
    };


    const handleUpload = async (e) => {

        e.preventDefault();

        if (!metricId) {
            toast.error("Please enter a Metric ID.");
            return;
        }

        if (!file) {
            toast.error("Please select a dataset file.");
            return;
        }

        setLoading(true);
        setResult(null);

        try {

            const response = await uploadDataset(
                Number(metricId),
                file
            );

            setResult(response);

            toast.success(
                response.message || "Dataset uploaded successfully."
            );

            // Clear form after successful upload
            setMetricId("");
            setFile(null);

            // Reset file input
            e.target.reset();

        } catch (error) {

            console.error(
                "Dataset upload failed:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Dataset upload failed. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };


    return (
        <div className="container-fluid">

            {/* Page Header */}

            <div className="mb-4">

                <h2 className="fw-bold">
                    Dataset Upload
                </h2>

                <p className="text-muted">
                    Upload time-series data for a specific metric.
                </p>

            </div>


            <div className="row">

                <div className="col-lg-8">

                    <div className="card shadow-sm border-0">

                        <div className="card-body p-4">

                            <h5 className="fw-bold mb-4">
                                Upload Dataset
                            </h5>


                            <form onSubmit={handleUpload}>

                                {/* Metric ID */}

                                <div className="mb-4">

                                    <label
                                        htmlFor="metricId"
                                        className="form-label fw-semibold"
                                    >
                                        Metric ID
                                    </label>

                                    <input
                                        id="metricId"
                                        type="number"
                                        className="form-control"
                                        placeholder="Enter metric ID"
                                        value={metricId}
                                        onChange={(e) =>
                                            setMetricId(e.target.value)
                                        }
                                        min="1"
                                        required
                                    />

                                    <div className="form-text">
                                        Enter the metric ID associated
                                        with this dataset.
                                    </div>

                                </div>


                                {/* Dataset File */}

                                <div className="mb-4">

                                    <label
                                        htmlFor="datasetFile"
                                        className="form-label fw-semibold"
                                    >
                                        Dataset File
                                    </label>

                                    <input
                                        id="datasetFile"
                                        type="file"
                                        className="form-control"
                                        onChange={handleFileChange}
                                        required
                                    />

                                    <div className="form-text">
                                        Select the time-series dataset
                                        file to upload.
                                    </div>

                                </div>


                                {/* Selected File */}

                                {file && (

                                    <div className="alert alert-light border">

                                        <div className="d-flex align-items-center">

                                            <i className="bi bi-file-earmark-text fs-3 me-3"></i>

                                            <div>

                                                <div className="fw-semibold">
                                                    {file.name}
                                                </div>

                                                <small className="text-muted">
                                                    {(file.size / 1024).toFixed(2)} KB
                                                </small>

                                            </div>

                                        </div>

                                    </div>

                                )}


                                {/* Upload Button */}

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >

                                    {loading ? (

                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>

                                            Uploading...
                                        </>

                                    ) : (

                                        <>
                                            <i className="bi bi-cloud-upload me-2"></i>
                                            Upload Dataset
                                        </>

                                    )}

                                </button>

                            </form>

                        </div>

                    </div>

                </div>


                {/* Upload Information */}

                <div className="col-lg-4 mt-4 mt-lg-0">

                    <div className="card shadow-sm border-0">

                        <div className="card-body p-4">

                            <h5 className="fw-bold mb-3">
                                Upload Information
                            </h5>

                            <div className="mb-3">

                                <i className="bi bi-info-circle text-primary me-2"></i>

                                <span>
                                    Select the metric associated
                                    with your dataset.
                                </span>

                            </div>

                            <div className="mb-3">

                                <i className="bi bi-file-earmark-text text-primary me-2"></i>

                                <span>
                                    Upload your time-series dataset
                                    file.
                                </span>

                            </div>

                            <div>

                                <i className="bi bi-database-check text-success me-2"></i>

                                <span>
                                    The system will process valid
                                    records and skip invalid or
                                    duplicate records.
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* Upload Result */}

            {result && (

                <div className="row mt-4">

                    <div className="col-lg-8">

                        <div className="card shadow-sm border-0">

                            <div className="card-body p-4">

                                <h5 className="fw-bold mb-3">
                                    Upload Result
                                </h5>


                                <div className="alert alert-success">

                                    <i className="bi bi-check-circle me-2"></i>

                                    {result.message}

                                </div>


                                <div className="row g-3">

                                    {/* Inserted */}

                                    <div className="col-md-6">

                                        <div className="border rounded p-3">

                                            <div className="text-muted">
                                                Inserted Records
                                            </div>

                                            <h3 className="fw-bold text-success mb-0">
                                                {result.inserted_count}
                                            </h3>

                                        </div>

                                    </div>


                                    {/* Skipped */}

                                    <div className="col-md-6">

                                        <div className="border rounded p-3">

                                            <div className="text-muted">
                                                Skipped Records
                                            </div>

                                            <h3 className="fw-bold text-warning mb-0">
                                                {result.skipped_count}
                                            </h3>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default DatasetUpload;