import numpy as np
import tensorflow as tf
import cv2
from tf_keras_vis.gradcam import Gradcam
import lime
from lime import lime_image
from src.preprocess import advanced_preprocess

def generate_gradcam(model, image_path, class_idx):
    # Load and preprocess
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    preprocessed_img = advanced_preprocess(image_path)
    
    gradcam = Gradcam(model, clone=False)
    
    def loss(output):
        return output[0][class_idx]
    
    cam = gradcam(
        loss=loss,
        seed_input=np.expand_dims(preprocessed_img, axis=0),
        penultimate_layer=-1
    )
    
    # Process heatmap
    heatmap = cam[0]
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    
    # Resize original image to match heatmap if needed (though both should be 224)
    original_img = cv2.resize(cv2.imread(image_path), (224, 224))
    
    # Superimpose the heatmap on original image
    superimposed_img = cv2.addWeighted(original_img, 0.6, heatmap, 0.4, 0)
    return superimposed_img

def generate_lime_explanation(model, image_path):
    preprocessed_img = advanced_preprocess(image_path)
    
    explainer = lime_image.LimeImageExplainer()
    
    def predict_fn(images):
        return model.predict(images, verbose=0)
        
    explanation = explainer.explain_instance(
        preprocessed_img.astype('double'),
        predict_fn,
        top_labels=1,
        hide_color=0,
        num_samples=100
    )
    
    return explanation
