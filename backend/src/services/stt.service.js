const WhisperProvider = require("../providers/stt/whisper.provider");

const sttProvider = new WhisperProvider();

const transcribeAudio = async (audioPath) => {
    if (!audioPath) {
        throw new Error("Audio path is required");
    }

    console.log("🎙️ STT service started");
    console.log("Audio:", audioPath);

    const result = await sttProvider.transcribe(audioPath);

    console.log("📝 Transcript received");
    console.log("Text:", result.text);
    
    return result;
};

module.exports = {
    transcribeAudio
};