import os
import uuid
import base64
import subprocess
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import aiofiles
import asyncio

PREDICT_SCRIPT = os.path.join("cnn", "predict.py")
PYTHON_EXECUTABLE = "python"
os.makedirs("temp_images", exist_ok=True)
if not os.path.isfile(PREDICT_SCRIPT):
    print(f"ERROR: Prediction script not found at {PREDICT_SCRIPT}")


app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

class ImageData(BaseModel):
    imageDataUrl: str 

@app.post("/predict/")
async def predict_image(image_data: ImageData):
    """
    Receives a base64 encoded image Data URL, saves it temporarily,
    runs the prediction script, and returns the prediction.
    """
    try:
        header, encoded = image_data.imageDataUrl.split(",", 1)
        file_ext = header.split("/")[1].split(";")[0] if '/' in header else 'png' 
        image_bytes = base64.b64decode(encoded)

        temp_filename = f"{uuid.uuid4()}.{file_ext}"
        temp_image_path = os.path.join("temp_images", temp_filename)

        async with aiofiles.open(temp_image_path, "wb") as temp_file:
            await temp_file.write(image_bytes)

        if not os.path.isfile(PREDICT_SCRIPT):
             raise HTTPException(status_code=500, detail=f"Prediction script not found at {PREDICT_SCRIPT}")

        command = [PYTHON_EXECUTABLE, PREDICT_SCRIPT, temp_image_path]

        print(f"Running command: {' '.join(command)}")

        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )

        stdout, stderr = await process.communicate()

        stdout_str = stdout.decode().strip()
        stderr_str = stderr.decode().strip()

        if process.returncode != 0:
            print(f"Prediction script error (stderr): {stderr_str}")
            raise HTTPException(status_code=500, detail=f"Prediction script failed: {stderr_str}")

        if not stdout_str:
             print(f"Prediction script error: No output received (stderr: {stderr_str})")
             raise HTTPException(status_code=500, detail="Prediction script returned no output.")

        prediction = stdout_str
        print(f"Prediction successful: {prediction}")

        try:
            os.remove(temp_image_path)
        except OSError as e:
            print(f"Warning: Could not remove temporary file {temp_image_path}: {e}")

        return {"prediction": prediction}

    except ValueError as e:
         print(f"Error decoding base64 string: {e}")
         raise HTTPException(status_code=400, detail=f"Invalid image data format: {e}")
    except FileNotFoundError as e:
         print(f"Error running script: {e}")
         raise HTTPException(status_code=500, detail=f"Prediction script execution failed: {e}")
    except subprocess.CalledProcessError as e:
        print(f"Prediction script error (CalledProcessError): {e.stderr}")
        raise HTTPException(status_code=500, detail=f"Prediction script failed: {e.stderr}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
     
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {e}")




@app.get("/")
def read_root():
    return {"message": "QuickMath Backend is running!"}