const synthesizeSpeech = async ({
    text,
    language
}) => {

    if (!text) {
        throw new Error("Text is required");
    }

    console.log("🔊 TTS service started");

    console.log(
        "Language:",
        language
    );

    console.log(
        "Text:",
        text
    );

    const response = await fetch(
        "http://tts:8002/synthesize",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text,
                language
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `TTS service returned HTTP ${response.status} `
        );
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(
            result.message ||
            "TTS synthesis failed"
        );
    }

    console.log(
        "✅ TTS synthesis completed"
    );

    console.log(
        "TTS audio path:",
        result.audioPath
    );

    return {
        audioPath: result.audioPath,
        language: result.language,
        text: result.text,
        size: result.size
    };
};

module.exports = {
    synthesizeSpeech
}; 