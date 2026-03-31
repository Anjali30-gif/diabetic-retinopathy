import cv2
# Critical fix: Disable OpenCV multithreading to stop the PyFunc Python GIL crash during Keras DataGenerator prefetching on Windows.
cv2.setNumThreads(0)
import numpy as np
from src.config import IMG_SIZE

def advanced_preprocess(image_path_or_array, is_bgr=False):
    # Safely load the image and strictly enforce RGB format
    if isinstance(image_path_or_array, str):
        img = cv2.imread(image_path_or_array)
        if img is None:
            raise ValueError(f"Could not read image: {image_path_or_array}")
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    else:
        # Keras generators yield float32 in [0, 255] which crashes OpenCV CLAHE
        img = image_path_or_array.copy()
        if is_bgr:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
    if img.dtype != np.uint8:
        img = np.clip(img, 0, 255).astype(np.uint8)

    # 1. Resize to 224x224 (model input)
    img = cv2.resize(img, IMG_SIZE)
    
    # 2. Gaussian Blur (from original paper)
    img = cv2.GaussianBlur(img, (5, 5), 0)
    
    # 3. Contrast Limited Adaptive Histogram Equalization (CLAHE on L channel of LAB)
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    img = cv2.merge([l, a, b])
    img = cv2.cvtColor(img, cv2.COLOR_LAB2RGB)  # Convert back to RGB
    
    # 4. Normalize using ImageNet statistics for transfer learning
    img = img.astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img = (img - mean) / std
    
    return img
