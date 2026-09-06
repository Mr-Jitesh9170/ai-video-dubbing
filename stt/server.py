from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import tempfile
import os

app = FastAPI()

print("Loading Whisper model...")

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)

print("Whisper model loaded successfully")


@app.get("/health")
def health():
    return {
        "success": True,
        "message": "STT service is running"
    }


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):

    temp_path = None

    try:
        suffix = os.path.splitext(file.filename)[1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            temp_file.write(await file.read())
            temp_path = temp_file.name

        print("🎙️ Transcribing:", file.filename)

        segments, info = model.transcribe(
            temp_path,
            beam_size=5
        )

        text = " ".join(
            segment.text.strip()
            for segment in segments
        ).strip()

        print("✅ Transcription completed")
        print("Language:", info.language)
        print("Text:", text)

        return {
            "success": True,
            "language": info.language,
            "text": text
        }

    except Exception as error:

        print("❌ Transcription failed:", str(error))

        return {
            "success": False,
            "message": str(error)
        }

    finally:

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)