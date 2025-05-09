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
import time 
from cnn.predict import load_model, predict_multiple_digits

start_time = time.time()

PREDICT_SCRIPT = os.path.join("cnn", "predict.py")
PYTHON_EXECUTABLE = "python"
os.makedirs("temp_images", exist_ok=True)
if not os.path.isfile(PREDICT_SCRIPT):
    print(f"ERROR: Prediction script not found at {PREDICT_SCRIPT}")


model=load_model()
app = FastAPI()


origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://quickmath-green.vercel.app",
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

        results=predict_multiple_digits(temp_image_path, model)
        try:
            os.remove(temp_image_path)
        except OSError as e:
            print(f"Warning: Could not remove temporary file {temp_image_path}: {e}")
        return {"predictions": results}

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