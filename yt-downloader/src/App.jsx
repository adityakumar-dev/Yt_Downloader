import axios from "axios";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";

function App() {
  const [input, setInput] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [isSearching, setSearching] = useState(false);
  const searchDetails = async () => {
    setSearching(true);
    try {
      const response = await axios.post('http://localhost:4000/info/', { url: input });
      if (response.status === 200) {
        setResponseData(response.data);
        console.log(response.bata)
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
  };



  return (
    <div className="container mt-5">
      <div className="display-1 text-center mb-5">YouTube Downloader</div>
      <div className="row justify-content-center">
        <div className="col-md-8 ">
          <div className="input-group mb-4">
            <input
              className="form-control form-control-lg mb-3"
              type="text"
              onChange={handleChange}
              value={input}
              name="userLink"
              placeholder="YouTube link"
            />
            <button onClick={searchDetails} className="btn btn-primary btn-lg ms-3">
              Search
            </button>
          </div>

          <div className="my-5">
            {isSearching && <CircularProgress />}
            {responseData && (
              <div className="display-5">
                {responseData.title}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
