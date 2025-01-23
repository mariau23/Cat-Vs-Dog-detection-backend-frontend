from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tensorflow import keras
import numpy as np
import tensorflow as tf
from PIL import Image
import io

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React app
app.mount("/static", StaticFiles(directory="env/react/my-vite-react-app/dist", html=True), name="static")

# Load the model
model = keras.models.load_model('c:\\python2024\\cnn model\\save_at_33.keras')  # using horizontal flipping

class PredictionResponse(BaseModel):
    probability_cat: float = None  # Default None to handle cases where we don't want to show it
    probability_dog: float = None  # Default None to handle cases where we don't want to show it
    valid_classification: bool
    message: str = None

def image_to_array(image_bytes: bytes, target_size=(180, 180)) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes))
    image = image.resize(target_size)  # Resize to match model's input size
    image_array = np.array(image)
    
    # Check if the image is grayscale and convert it to RGB
    if len(image_array.shape) == 2:
        image_array = np.stack([image_array] * 3, axis=-1)
    
    # Ensure the image has 3 channels
    if image_array.shape[-1] != 3:
        raise ValueError("Image must have 3 color channels (RGB).")
    
    image_array = np.expand_dims(image_array, axis=0)
    return image_array

@app.post("/predict/", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    try:
        img_array = image_to_array(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

    predictions = model.predict(img_array)
    score = float(tf.keras.activations.sigmoid(predictions[0][0]))

    # Define a confidence threshold
    confidence_threshold = 0.7  
    if score < confidence_threshold and score > 1 - confidence_threshold:
        response = PredictionResponse(
            valid_classification=False,
            # message="This image does not appear to be a cat or a dog. Please try with a different image."
            message="Bhai Uper label Dkh Kar Image Dalo.. Kaha sai Cat Ya Dog ki image hai?"
        )
    else:
        response = PredictionResponse(
            probability_cat=100 * (1 - score),
            probability_dog=100 * score,
            valid_classification=True
        )
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
