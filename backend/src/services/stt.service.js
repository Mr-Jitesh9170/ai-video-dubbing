const fs = require("fs");
const path = require("path");

const transcribeAudio = async (audioPath) => {
    if (!audioPath) {
        throw new Error("Audio path is required");
    }

    if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
    }

    console.log("🎙️ STT service started");
    console.log("Audio:", audioPath);

    const fileBuffer = fs.readFileSync(audioPath);

    const formData = new FormData();

    const filename = path.basename(audioPath);

    formData.append(
        "file",
        new Blob([fileBuffer], {
            type: "audio/wav"
        }),
        filename
    );

    console.log("📡 Sending audio to Python STT service...");

    const response = await fetch(
        "http://stt:8000/transcribe",
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error(
            `STT service returned HTTP ${response.status}`
        );
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(
            result.message || "STT transcription failed"
        );
    }

    console.log("✅ STT transcription completed");
    console.log("Language:", result.language);
    console.log("📝 Transcript:", result.text);

    return {
        text: result.text,
        language: result.language
    };
};

module.exports = {
    transcribeAudio
};