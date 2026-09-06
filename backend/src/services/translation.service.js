const translateText = async ({
    text,
    sourceLanguage,
    targetLanguage
}) => {

    if (!text) {
        throw new Error("Text is required");
    }

    console.log("🌐 Translation service started");

    console.log(
        "Languages:",
        `${sourceLanguage} → ${targetLanguage}`
    );

    console.log(
        "Text:",
        text
    );

    const response = await fetch(
        "http://translation:8001/translate",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text,
                sourceLanguage,
                targetLanguage
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Translation service returned HTTP ${response.status}`
        );
    }

    const result = await response.json();

    if (!result.success) {

        throw new Error(
            result.message ||
            "Translation failed"
        );
    }

    console.log(
        "✅ Translation completed"
    );

    console.log(
        "Translated text:",
        result.text
    );

    return {
        text: result.text,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage
    };
};


module.exports = {
    translateText
};