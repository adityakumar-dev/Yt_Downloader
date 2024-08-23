import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './Home';
import DownloadComponent from './Download';

function MainRouter() {
  return (
    <Router>
      <Routes>
        {/* Main app route */}
        <Route path="/" element={<App />} />

        {/* Download route */}
        <Route path="/download" element={<DownloadComponent />} />
      </Routes>
    </Router>
  );
}

export default MainRouter;
