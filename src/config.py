import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset')
TRAIN_DIR = os.path.join(DATASET_DIR, 'train')
VAL_DIR = os.path.join(DATASET_DIR, 'val')
TEST_DIR = os.path.join(DATASET_DIR, 'test')

MODEL_SAVE_PATH = os.path.join(BASE_DIR, 'models', 'best_dr_model.h5')

# Set to False because we achieved balance through oversampling in the Data Generator
COMPUTE_CLASS_WEIGHTS = False

# Weights are set to 1.0 because the dataset is now balanced perfectly via oversampling
CLASS_WEIGHTS = {
    0: 1.0,      # No_DR 
    1: 1.0,      # Mild
    2: 1.0,      # Moderate 
    3: 1.0,      # Severe 
    4: 1.0       # Proliferative 
}

# Image parameters
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 30
LEARNING_RATE = 1e-4
PATIENCE = 6
MIN_LR = 1e-7
AUGMENTATION = True

# Class mappings
CLASSES = ['No_DR', 'Mild', 'Moderate', 'Severe', 'Proliferative']
NUM_CLASSES = len(CLASSES)
