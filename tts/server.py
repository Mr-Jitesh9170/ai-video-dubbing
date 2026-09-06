from fastapi import FastAPI
from pydantic import BaseModel
from pathlib import Path
import subprocess
import uuid


app = FastAPI()


MODEL_PATH = Path(
    "/models/en_US-lessac-medium.onnx"
)

SHARED_DIRECTORY = Path("/shared")

SHARED_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True
)


print("=================================", flush=True)
print("🔊 Starting Piper TTS service", flush=True)
print("Model:", MODEL_PATH, flush=True)
print("=================================", flush=True)


if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Piper model not found: {MODEL_PATH}"
    )


print("✅ Piper model found", flush=True)


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


@app.get("/health")
def health():

    return {
        "success": True,
        "message": "TTS service is running"
    }


@app.post("/synthesize")
def synthesize(request: TTSRequest):

    output_path = None

    try:

        text = request.text.strip()

        if not text:
            return {
                "success": False,
                "message": "Text is required"
            }

        if request.language != "en":
            return {
                "success": False,
                "message": "Currently only English TTS is supported"
            }

        print("=================================", flush=True)
        print("🔊 TTS synthesis started", flush=True)
        print("Text:", text, flush=True)
        print("=================================", flush=True)

        filename = f"{uuid.uuid4().hex}.wav"

        output_path = (
            SHARED_DIRECTORY / filename
        )

        command = [
            "piper",
            "--model",
            str(MODEL_PATH),
            "--output_file",
            str(output_path)
        ]

        print(
            "Running:",
            " ".join(command),
            flush=True
        )

        result = subprocess.run(
            command,
            input=text,
            text=True,
            capture_output=True
        )

        if result.returncode != 0:

            print(
                "❌ Piper failed:",
                result.stderr,
                flush=True
            )

            raise RuntimeError(
                result.stderr
                or "Piper synthesis failed"
            )

        if not output_path.exists():

            raise RuntimeError(
                "Piper did not create output WAV"
            )

        file_size = output_path.stat().st_size

        if file_size <= 44:

            raise RuntimeError(
                "Piper generated an empty WAV file"
            )

        print(
            "✅ TTS synthesis completed",
            flush=True
        )

        print(
            "Output:",
            output_path,
            flush=True
        )

        print(
            "Size:",
            file_size,
            "bytes",
            flush=True
        )

        return {

            "success": True,

            "language": request.language,

            "text": text,

            "audioPath": f"/shared/{filename}",

            "size": file_size
        }

    except Exception as error:

        print(
            "❌ TTS synthesis failed:",
            str(error),
            flush=True
        )

        if output_path and output_path.exists():

            try:
                output_path.unlink()
            except Exception:
                pass

        return {

            "success": False,

            "message": str(error)
        }