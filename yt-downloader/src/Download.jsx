import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

function DownloadComponent() {
    const { state } = useLocation();
    const downloadIntiated = useRef(true);

    useEffect(() => {
        if (!downloadIntiated.current) return;
        const downloadFile = async () => {
            try {
                const downloadUrl = new URL('http://localhost:4000/download');
                downloadUrl.searchParams.append('url', state.url);
                downloadUrl.searchParams.append('title', state.title);
                downloadUrl.searchParams.append('format_id', state.format_id);
                downloadUrl.searchParams.append('type', state.type);

                window.open(downloadUrl.toString(), '_blank');
            } catch (error) {
                console.error('Error downloading file:', error);
            }
        };

        downloadFile();
        downloadIntiated.current = false;
    }, [state]);
    return (
        <div className='container-fluid vh-100'>
            <div className='d-flex flex-column justify-content-center align-items-center h-100'>

                <h1>Downloading... </h1>
                <h3>{state.title}</h3>
                <img src={state.thumbnail} />
            </div>
        </div>
    );
}

export default DownloadComponent;
