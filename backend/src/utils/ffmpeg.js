const { execFile } = require("child_process");

const runFFmpeg = (args) => {
    return new Promise((resolve, reject) => {
        console.log("🎬 Running FFmpeg:");
        console.log("ffmpeg", args.join(" "));

        execFile(
            "ffmpeg",
            args,
            (error, stdout, stderr) => {
                if (error) {
                    console.error("❌ FFmpeg failed:");
                    console.error(stderr);

                    return reject(error);
                }

                console.log("✅ FFmpeg completed");

                resolve({
                    stdout,
                    stderr
                });
            }
        );
    });
};

module.exports = {
    runFFmpeg
}; 