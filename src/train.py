import os
import sys
import time

# Ensure project root is in path for linter/runtime
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

import numpy as np
from tensorflow.keras.callbacks import Callback, ModelCheckpoint, ReduceLROnPlateau, EarlyStopping
from src.config import TRAIN_DIR, VAL_DIR, MODEL_SAVE_PATH, EPOCHS, PATIENCE, MIN_LR, LEARNING_RATE, CLASS_WEIGHTS
from src.model import get_compiled_model
from src.data_loader import SafeDataGenerator

def get_callbacks():
    return [
        ModelCheckpoint(
            MODEL_SAVE_PATH,
            monitor='val_loss',
            save_best_only=True,
            save_weights_only=False,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=2,
            min_lr=MIN_LR,
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=PATIENCE,
            restore_best_weights=True,
            verbose=1
        )
    ]


class ETAReportingCallback(Callback):
    def on_train_begin(self, logs=None):
        self.train_start_time = time.time()
        self.current_epoch = 0
        self.epoch_start_time = None
        self.steps = 0

    def on_epoch_begin(self, epoch, logs=None):
        self.current_epoch = epoch
        self.epoch_start_time = time.time()
        self.steps = self.params.get('steps', 0)
        print(f"\nEpoch {epoch + 1}/{self.params.get('epochs', '?')} started ({self.steps} steps)")

    def on_train_batch_end(self, batch, logs=None):
        if not self.steps:
            return
        elapsed = time.time() - self.epoch_start_time
        completed = batch + 1
        avg_batch = elapsed / completed
        remaining = self.steps - completed
        eta_seconds = int(avg_batch * remaining)
        eta_str = time.strftime('%H:%M:%S', time.gmtime(eta_seconds))
        sys.stdout.write(f"\r  Batch {completed}/{self.steps} - ETA {eta_str}")
        sys.stdout.flush()

    def on_epoch_end(self, epoch, logs=None):
        elapsed = int(time.time() - self.epoch_start_time)
        elapsed_str = time.strftime('%H:%M:%S', time.gmtime(elapsed))
        print(f" - epoch duration {elapsed_str}")


def train_model():
    print("Initializing data loaders...")
    train_gen = SafeDataGenerator(TRAIN_DIR, is_training=True)
    val_gen = SafeDataGenerator(VAL_DIR, is_training=False)

    print("Building model architecture...")
    model = get_compiled_model(freeze_backbones=True, learning_rate=LEARNING_RATE)
    callbacks = get_callbacks() + [ETAReportingCallback()]

    warmup_epochs = min(5, max(2, EPOCHS // 6))
    print(f"Warm-up stage: training top layers for {warmup_epochs} epochs")
    model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=warmup_epochs,
        callbacks=callbacks,
        class_weight=CLASS_WEIGHTS,
        verbose=0
    )

    if EPOCHS > warmup_epochs:
        print("Fine-tuning stage: unfreezing backbone layers...")
        for layer in model.layers:
            layer.trainable = True

        model.compile(
            optimizer='adam',
            loss=model.loss,
            metrics=model.metrics,
        )

        model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=EPOCHS,
            initial_epoch=warmup_epochs,
            callbacks=callbacks,
            class_weight=CLASS_WEIGHTS,
            verbose=0
        )

    print("Training Completed.")


if __name__ == "__main__":
    train_model()
