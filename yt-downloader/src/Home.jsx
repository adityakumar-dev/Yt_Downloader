import axios from "axios";
import { useState } from "react";
import { CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
function App() {
    const [input, setInput] = useState("");
    const [responseData, setResponseData] = useState(null);
    const [isSearching, setSearching] = useState(false);
    const navigate = useNavigate();

    const searchDetails = async () => {
        setSearching(true);
        try {
            const response = await axios.post('http://localhost:4000/info/', { url: input });
            if (response.status === 200) {
                setResponseData(response.data);
                console.log(response.data); // Fixed the typo from response.bata to response.data
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setSearching(false);
        }
    };
    const handleDownload = async (url, title, format_id, type, duration) => {
        navigate('/download', {
            state: {
                url,
                title,
                format_id,
                type,
                duration,
                thumbnail: responseData.thumbnail

            }
        });
    };

    const handleChange = (e) => {
        setInput(e.target.value);
    };

    return (
        <div className="container mt-5">
            <div className="display-1 text-center mb-5">YouTube Downloader</div>
            <div className="row justify-content-center">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-12 d-flex flex-column flex-md-row align-items-center">
                        <div className="input-group mb-4 mb-md-0">
                            <input
                                className="form-control form-control-lg"
                                type="text"
                                onChange={handleChange}
                                value={input}
                                name="userLink"
                                placeholder="YouTube link"
                            />
                        </div>
                        <button onClick={searchDetails} className="btn btn-primary btn-lg ms-3">
                            Search
                        </button>
                    </div>
                </div>

                {responseData && <>
                    <img src={responseData.thumbnail} className="img-fluid mt-5" />
                </>}
                <div className="my-5 d-flex justify-content-center align-items-center">
                    {isSearching && <CircularProgress />}
                    {responseData && (
                        <>
                            <div className="row">


                                {responseData.bestVideoFormats.map(dt => {
                                    return <>

                                        <div className="container">


                                            <div className="display-6 text-center">
                                                {responseData.title}
                                            </div>
                                            <div className="row justify-content-center mt-5">
                                                <div className="col-3 col-md-1 mb-4">
                                                    {dt.duration}
                                                </div>

                                                <div className="col-3 col-md-1 mb-4">
                                                    {dt.quality}
                                                </div>

                                                <div className="col-3 col-md-1 mb-4">
                                                    {dt.type}
                                                </div>

                                                <button onClick={() => {

                                                    handleDownload(dt.url, responseData.title, dt.itag, dt.type, dt.duration)
                                                }} className="btn btn-primary btn-lg ms-3">
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                })}
                            </div>

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
