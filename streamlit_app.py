import streamlit as st
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import cv2
import os

st.set_page_config(page_title="Diabetic Retinopathy Detection", layout="centered")

# ==================== CONFIG ====================
MODEL_PATH = "best_dr_model.h5"  # YOUR MODEL FILENAME
DEVICE = torch.device("cpu")
CLASSES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"]

# ==================== YOUR HYBRID MODEL ====================
class HybridModel(nn.Module):
    def __init__(self, num_classes=5):
        super(HybridModel, self).__init__()
        self.efficientnet = models.efficientnet_b0(pretrained=False)
        self.efficientnet.classifier = nn.Identity()
        self.resnet = models.resnet18(pretrained=False)
        self.resnet.fc = nn.Identity()
        self.classifier = nn.Sequential(
            nn.Linear(1280 + 512, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x):
        ef_out = self.efficientnet(x)
        res_out = self.resnet(x)
        combined = torch.cat((ef_out, res_out), dim=1)
        return self.classifier(combined)

# ==================== LOAD MODEL ====================
@st.cache_resource
def load_model():
    with st.spinner("Loading AI model... (one time)"):
        model = HybridModel(num_classes=5)
        
        if os.path.exists(MODEL_PATH):
            try:
                model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
            except Exception as e:
                st.error(f"Error loading model: {e}")
                st.error("Model might be Keras format (.h5) but code expects PyTorch (.pth)")
                st.stop()
        else:
            st.error(f"Model file '{MODEL_PATH}' not found in repository!")
            st.stop()
            
        model.to(DEVICE)
        model.eval()
        return model

# ==================== MAIN APP ====================
def main():
    st.title("?? Diabetic Retinopathy Detection")
    st.markdown("**Hybrid Deep Learning** (EfficientNet-B0 + ResNet18)")
    st.markdown("---")
    
    try:
        model = load_model()
        st.success("? Model loaded successfully!")
    except Exception as e:
        st.error(f"Failed to load model: {e}")
        return
    
    uploaded_file = st.file_uploader(
        "?? Upload a retinal fundus image", 
        type=["jpg", "jpeg", "png"]
    )
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file).convert("RGB")
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Original Image")
            st.image(image, use_container_width=True)
        
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        img_tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        with st.spinner("?? Analyzing image..."):
            with torch.no_grad():
                outputs = model(img_tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]
                predicted_class = torch.argmax(probabilities).item()
        
        with col2:
            st.subheader("Prediction")
            st.markdown(f"## {CLASSES[predicted_class]}")
            
            st.markdown("**Confidence Scores:**")
            for i, cls in enumerate(CLASSES):
                conf = float(probabilities[i]) * 100
                st.progress(int(conf), text=f"{cls}: {conf:.1f}%")
        
        st.markdown("---")
        st.subheader("?? Grad-CAM Visualization")
        
        try:
            gradcam_img = generate_gradcam(img_tensor, model, predicted_class)
            st.image(gradcam_img, caption="Regions the model focused on", use_container_width=True)
        except Exception as e:
            st.warning(f"Grad-CAM unavailable: {e}")

# ==================== GRAD-CAM ====================
def generate_gradcam(image_tensor, model, target_class):
    activations = []
    gradients = []
    
    target_layer = model.efficientnet.features[-1][-1]
    
    def forward_hook(m, inp, out):
        activations.append(out)
    
    def backward_hook(m, grad_in, grad_out):
        gradients.append(grad_out[0])
    
    handle1 = target_layer.register_forward_hook(forward_hook)
    handle2 = target_layer.register_full_backward_hook(backward_hook)
    
    output = model(image_tensor)
    model.zero_grad()
    one_hot = torch.zeros_like(output)
    one_hot[0, target_class] = 1
    output.backward(gradient=one_hot, retain_graph=True)
    
    grads = gradients[0]
    acts = activations[0]
    pooled_grads = torch.mean(grads, dim=[0, 2, 3])
    
    for i in range(acts.shape[1]):
        acts[0, i, :, :] *= pooled_grads[i]
    
    heatmap = torch.mean(acts, dim=1).squeeze()
    heatmap = np.maximum(heatmap.detach().cpu().numpy(), 0)
    heatmap /= np.max(heatmap) if np.max(heatmap) > 0 else 1
    
    handle1.remove()
    handle2.remove()
    
    img = image_tensor.squeeze().permute(1, 2, 0).cpu().numpy()
    img = img * np.array([0.229, 0.224, 0.225]) + np.array([0.485, 0.456, 0.406])
    img = np.clip(img, 0, 1)
    
    heatmap = cv2.resize(heatmap, (img.shape[1], img.shape[0]))
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    
    superimposed = heatmap * 0.4 + (img * 255).astype(np.uint8)
    superimposed = np.clip(superimposed, 0, 255).astype(np.uint8)
    
    return Image.fromarray(superimposed)

if __name__ == "__main__":
    main()