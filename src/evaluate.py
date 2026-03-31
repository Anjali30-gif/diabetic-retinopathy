import os
import sys
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.models import load_model

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from src.config import VAL_DIR, MODEL_SAVE_PATH, CLASSES, CLASS_WEIGHTS
from src.data_loader import SafeDataGenerator
from src.model import focal_loss

def evaluate_model():
    print(f"Loading best model from: {MODEL_SAVE_PATH}")
    if not os.path.exists(MODEL_SAVE_PATH):
        print("Model file not found. Have you trained it yet?")
        return

    # Load model with custom metrics/losses
    try:
        model = load_model(MODEL_SAVE_PATH, custom_objects={'loss': focal_loss()})
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load model: {e}")
        return

    val_gen = SafeDataGenerator(VAL_DIR, is_training=False, batch_size=16)
    
    y_true = []
    y_pred_probs = []
    
    print("Running predictions on the validation set...")
    # SafeDataGenerator yields (X, y)
    for i in range(len(val_gen)):
        sys.stdout.write(f"\rPredicting batch {i+1}/{len(val_gen)}")
        sys.stdout.flush()
        X, y = val_gen[i]
        preds = model.predict(X, verbose=0)
        y_true.extend(np.argmax(y, axis=1))
        y_pred_probs.extend(preds)
    
    print("\n\nEvaluation Complete.")
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    print("\n--- Classification Report ---")
    print(classification_report(y_true, y_pred, target_names=CLASSES))
    
    print("\n--- Confusion Matrix ---")
    cm = confusion_matrix(y_true, y_pred)
    # Print a nice padded confusion matrix
    col_width = max(len(c) for c in CLASSES) + 2
    header = "".ljust(col_width) + "".join([c.ljust(col_width) for c in CLASSES])
    print(header)
    for i, row_class in enumerate(CLASSES):
        row_str = row_class.ljust(col_width)
        for j in range(len(CLASSES)):
            row_str += str(cm[i][j]).ljust(col_width)
        print(row_str)

if __name__ == "__main__":
    evaluate_model()
