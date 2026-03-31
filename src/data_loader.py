import os
import math
import cv2
import numpy as np
from tensorflow.keras.utils import Sequence
from src.config import IMG_SIZE, BATCH_SIZE, AUGMENTATION
from src.preprocess import advanced_preprocess

class SafeDataGenerator(Sequence):
    """A thread-safe purely Python-based Sequence generator that avoids Keras ImageDataGenerator PyFunc threading deadlocks on Windows."""
    def __init__(self, directory, batch_size=BATCH_SIZE, img_size=IMG_SIZE, is_training=False):
        self.directory = directory
        self.batch_size = batch_size
        self.img_size = img_size
        self.is_training = is_training
        
        self.class_names = ['No_DR', 'Mild', 'Moderate', 'Severe', 'Proliferative']
        self.class_indices = {name: i for i, name in enumerate(self.class_names)}
        self.temp_filepaths = {name: [] for name in self.class_names}
        for class_name in self.class_names:
            class_dir = os.path.join(self.directory, class_name)
            if not os.path.exists(class_dir):
                continue
            for img_name in os.listdir(class_dir):
                if img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                    self.temp_filepaths[class_name].append(os.path.join(class_dir, img_name))
        
        self.filepaths = []
        self.labels = []
        
        if self.is_training:
            target_size = 3000
            for class_name in self.class_names:
                paths = self.temp_filepaths[class_name]
                if not paths: continue
                # Random oversampling / undersampling to balance batches
                sampled_paths = np.random.choice(paths, target_size, replace=(len(paths) < target_size)).tolist()
                self.filepaths.extend(sampled_paths)
                self.labels.extend([self.class_indices[class_name]] * target_size)
        else:
            for class_name in self.class_names:
                paths = self.temp_filepaths[class_name]
                self.filepaths.extend(paths)
                self.labels.extend([self.class_indices[class_name]] * len(paths))
                    
        self.indexes = np.arange(len(self.filepaths))
        if self.is_training:
            np.random.shuffle(self.indexes)

    def __len__(self):
        return math.ceil(len(self.filepaths) / self.batch_size)

    def _augment_image(self, img):
        if np.random.rand() < 0.5:
            img = cv2.flip(img, 1)
        if np.random.rand() < 0.25:
            img = cv2.flip(img, 0)
            
        h, w = img.shape[:2]
        
        # Rotation
        if np.random.rand() < 0.35:
            angle = float(np.random.uniform(-15, 15))
            matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
            img = cv2.warpAffine(img, matrix, (w, h), borderMode=cv2.BORDER_REFLECT)
            
        # Zoom / Scale
        if np.random.rand() < 0.3:
            scale = np.random.uniform(0.9, 1.1)
            matrix = cv2.getRotationMatrix2D((w / 2, h / 2), 0, scale)
            img = cv2.warpAffine(img, matrix, (w, h), borderMode=cv2.BORDER_REFLECT)

        # Translation / Shift
        if np.random.rand() < 0.3:
            tx = np.random.uniform(-0.1 * w, 0.1 * w)
            ty = np.random.uniform(-0.1 * h, 0.1 * h)
            matrix = np.float32([[1, 0, tx], [0, 1, ty]])
            img = cv2.warpAffine(img, matrix, (w, h), borderMode=cv2.BORDER_REFLECT)

        # Color
        if np.random.rand() < 0.4:
            brightness = np.random.uniform(0.8, 1.2)
            img = np.clip(img.astype(np.float32) * brightness, 0, 255).astype(np.uint8)
        if np.random.rand() < 0.3:
            contrast = np.random.uniform(0.85, 1.15)
            mean = np.mean(img, axis=(0, 1), keepdims=True)
            img = np.clip((img.astype(np.float32) - mean) * contrast + mean, 0, 255).astype(np.uint8)
            
        return img

    def __getitem__(self, idx):
        batch_indexes = self.indexes[idx * self.batch_size:(idx + 1) * self.batch_size]
        batch_filepaths = [self.filepaths[i] for i in batch_indexes]
        batch_labels = [self.labels[i] for i in batch_indexes]

        X = np.empty((len(batch_filepaths), *self.img_size, 3), dtype=np.float32)
        y = np.zeros((len(batch_filepaths), len(self.class_names)), dtype=np.float32)

        for i, filepath in enumerate(batch_filepaths):
            img = cv2.imread(filepath)
            if img is None:
                continue
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            if self.is_training and AUGMENTATION:
                img = self._augment_image(img)
            img = advanced_preprocess(img, is_bgr=False)
            X[i,] = img
            y[i, batch_labels[i]] = 1.0

        return X, y

    def on_epoch_end(self):
        if self.is_training:
            np.random.shuffle(self.indexes)
