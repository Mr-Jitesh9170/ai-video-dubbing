from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


app = FastAPI()

MODEL_NAME = "Helsinki-NLP/opus-mt-hi-en"


print("=================================")
print("🌐 Loading translation model...")
print("Model:", MODEL_NAME)
print("=================================")


tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME
)


print("✅ Translation model loaded successfully")


class TranslationRequest(BaseModel):
    text: str
    sourceLanguage: str = "hi"
    targetLanguage: str = "en"


@app.get("/health")
def health():

    return {
        "success": True,
        "message": "Translation service is running"
    }


@app.post("/translate")
def translate(request: TranslationRequest):

    try:

        text = request.text.strip()

        if not text:

            return {
                "success": False,
                "message": "Text is required"
            }


        if (
            request.sourceLanguage != "hi"
            or request.targetLanguage != "en"
        ):

            return {
                "success": False,
                "message": "Currently only hi → en is supported"
            }


        print("=================================")
        print("🌐 Translation started")
        print("Source:", request.sourceLanguage)
        print("Target:", request.targetLanguage)
        print("Text:", text)
        print("=================================")


        inputs = tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True
        )


        outputs = model.generate(
            **inputs,
            max_length=512
        )


        translated_text = tokenizer.decode(
            outputs[0],
            skip_special_tokens=True
        )


        print("✅ Translation completed")
        print("Translated:", translated_text)


        return {
            "success": True,
            "sourceLanguage": request.sourceLanguage,
            "targetLanguage": request.targetLanguage,
            "text": translated_text
        }


    except Exception as error:

        print(
            "❌ Translation failed:",
            str(error)
        )

        return {
            "success": False,
            "message": str(error)
        }