# Diabetic Retinopathy Detection using Hybrid Deep Learning

An explainable hybrid deep learning model (EfficientNet-B0 + ResNet18) for automatic detection of Diabetic Retinopathy using retinal fundus images. Features Grad-CAM and LIME for explainability deployed via a Flask web application.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Prepare datasets inside the `dataset` folder** with the following structure:
   ```
   dataset/
   ├── train/
   │   ├── No_DR/
   │   ├── Mild/
   │   ├── Moderate/
   │   ├── Severe/
   │   └── Proliferative/
   ├── val/
   │   └── (same structure as train)
   └── test/
       └── (same structure as train)
   ```

3. **Run training:**
   ```bash
   python src/train.py
   ```

4. **Run web app:**
   ```bash
   python app/main.py
   ```
   Then open http://localhost:5000 in your browser.
