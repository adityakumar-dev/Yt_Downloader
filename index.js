const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 4000;
// const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 1024 * 1024 * 1024; // 1GB default

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World");
});

// Function to get video info
const getInfo = async (url) => {
    return new Promise((resolve, reject) => {
        const child = spawn('yt-dlp', ['-J', url]);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data;
        });

        child.stderr.on('data', (data) => {
            stderr += data;
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp process exited with code ${code}`);
                return reject(new Error(`yt-dlp Error: ${stderr}`));
            }
            try {
                const info = JSON.parse(stdout);
                const allFormats = info.formats.map(format => ({
                    itag: format.format_id,
                    quality: format.format_note,
                    type: format.ext,
                    audioBitrate: format.abr,
                    videoBitrate: format.vbr,
                    isVideo: format.vcodec !== "none",
                    isAudio: format.acodec !== "none",
                }));
                const videoAndAudioFormats = allFormats.filter(format => (format.isVideo || format.isAudio) && format.quality !== undefined && format.quality !== 'Default');
                resolve({ title: info.title, videoAndAudioFormats });
            } catch (e) {
                console.error("Error parsing yt-dlp output: " + e);
                reject(new Error("Error parsing yt-dlp output: " + e));
            }
        });
    });
};

const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

app.post("/info", async (req, res) => {
    const { url } = req.body;

    if (!url || !isValidUrl(url)) {
        return res.status(400).json({ message: "Invalid URL provided" });
    }

    try {
        const { title, videoAndAudioFormats } = await getInfo(url);
        res.json({ title, videoAndAudioFormats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve video information" });
    }
});

app.post('/download', async (req, res) => {
    const { url, title, format_id, type } = req.body;

    if (!url || !isValidUrl(url)) {
        return res.status(400).json({ message: "Invalid URL provided" });
    }

    if (!format_id || !type) {
        return res.status(400).json({ message: "format_id and type are required" });
    }

    try {
        console.log("Processing download...");

        const safeTitle = title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'downloaded_video';
        const command = `yt-dlp`;
        const args = ['-f', format_id, '--no-part', '--output', '-', url];

        res.header('Content-Disposition', `attachment; filename="${safeTitle}.${type}"`);
        res.header('Content-Type', 'application/octet-stream');

        const child = spawn(command, args);

        // let downloadedSize = 0;
        child.stdout.on('data', (chunk) => {
            // downloadedSize += chunk.length;
            // if (downloadedSize > MAX_FILE_SIZE) {
            //     child.kill();
            //     res.end();
            // } else {
            res.write(chunk);
            // }
        });

        child.stderr.on('data', (data) => {
            console.error(`yt-dlp error: ${data.toString()}`);
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp process exited with code ${code}`);
                if (!res.headersSent) {
                    res.status(500).json({ message: "Failed to download video" });
                }
            } else {
                console.log('Download completed successfully.');
                res.end();
            }
        });

    } catch (e) {
        console.error(e);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to download video" });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});