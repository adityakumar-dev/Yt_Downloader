const express = require("express");
const cors = require("cors");
const { spawn, exec } = require("child_process");
const { URL, format } = require('url');
const youtubedl = require('youtube-dl-exec');
const app = express();
const PORT = process.env.PORT || 4000;
// const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 1024 * 1024 * 1024; // 1GB default

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World");
});

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
}

const getInfo = async (url) => {
    return new Promise((resolve, reject) => {
        console.log("Writing data")
        const child = spawn('yt-dlp', ['-J', url]);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            console.log("Writing data")
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

                console.log(typeof (info))
                console.log(info.duration)
                const allFormats = info.formats.map(format => {
                    const audioBitrate = format.abr !== null ? format.abr : 0;
                    const videoBitrate = format.vbr !== null ? format.vbr : 0;



                    return {
                        'url': url,
                        itag: format.format_id,
                        quality: format.format_note,
                        type: format.ext,
                        audioBitrate,
                        videoBitrate,
                        durationTotal: info.duration,
                        duration: formatDuration(info.duration),
                        isVideo: format.vcodec !== "none",
                        isAudio: format.acodec !== "none",
                    }
                });


                const audioFormats = allFormats.filter(format => (format.isAudio && format.quality !== undefined && format.quality !== 'Default'));
                const bestVideoFormats = allFormats
                    .filter(format => format.isVideo && format.type === 'mp4' && format.videoBitrate !== 0 && format.quality)
                    .reduce((acc, format) => {
                        const existing = acc.find(f => f.quality === format.quality);
                        if (!existing || format.videoBitrate > existing.videoBitrate) {
                            acc = acc.filter(f => f.quality !== format.quality);
                            acc.push(format);
                        }
                        return acc;
                    }, []);
                // const tempFormats = allFormats.filter(format => ((format.abr !== null && format.vbr !== null) && format.abr > 0 && format.vbr > 0));
                resolve({ title: info.title, thumbnail: info.thumbnail || null, bestVideoFormats, audioFormats });
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
    console.log(url)
    if (!url || !isValidUrl(url)) {
        return res.status(400).json({ message: "Invalid URL provided" });
    }

    try {
        console.log("request /info")
        const { title, audioFormats, thumbnail, bestVideoFormats } = await getInfo(url);
        res.json({ title, thumbnail, audioFormats, bestVideoFormats, });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve video information" });
    }
});


app.get('/download', async (req, res) => {
    const { url, title, format_id, type } = req.query;
    console.log(`${url} ${title} ${format_id}`)
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
        const args = [

            '-vU', '-f', `${format_id}+bestaudio`,
            '--verbose',
            '-o', '-',
            url
        ];
        res.header('Content-Disposition', `attachment; filename="${safeTitle}.${type}"`);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');

        const child = spawn(command, args);

        child.stdout.on('data', (chunk) => {

            res.write(chunk);

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