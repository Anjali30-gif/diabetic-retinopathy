import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0, ResNet50
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Concatenate, Dropout, Input
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from src.config import IMG_SIZE, NUM_CLASSES, CLASS_WEIGHTS, LEARNING_RATE

def build_hybrid_model(freeze_backbones=True):
    input_tensor = Input(shape=(IMG_SIZE[0], IMG_SIZE[1], 3))
    
    # Branch 1: EfficientNet-B0 (compound scaling, efficient feature extraction)
    efficient = EfficientNetB0(
        weights='imagenet',
        include_top=False,
        input_tensor=input_tensor
    )
    efficient.trainable = not freeze_backbones
    x1 = GlobalAveragePooling2D()(efficient.output)
    
    # Branch 2: ResNet50 (residual connections, gradient flow)
    resnet = ResNet50(
        weights='imagenet',
        include_top=False,
        input_tensor=input_tensor
    )
    resnet.trainable = not freeze_backbones
    x2 = GlobalAveragePooling2D()(resnet.output)
    
    # Feature Fusion (Concatenation captures complementary features)
    merged = Concatenate()([x1, x2])
    
    # Classification Head
    x = Dense(512, activation='relu')(merged)
    x = Dropout(0.5)(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    output = Dense(NUM_CLASSES, activation='softmax', name='dr_classification')(x)
    
    model = Model(inputs=input_tensor, outputs=output)
    return model

def focal_loss(gamma=2.0, alpha=CLASS_WEIGHTS):
    def loss(y_true, y_pred):
        epsilon = tf.keras.backend.epsilon()
        y_pred = tf.clip_by_value(y_pred, epsilon, 1. - epsilon)
        
        # Mapping alpha vector according to true class
        alpha_tensor = tf.constant([alpha.get(i, 1.0) for i in range(len(alpha))], dtype=tf.float32)
        
        # Focal loss calculation
        # focal_weight = alpha * y_true * (1-p)^gamma
        cross_entropy = -y_true * tf.math.log(y_pred)
        weight = alpha_tensor * y_true * tf.math.pow(1 - y_pred, gamma)
        loss_val = weight * cross_entropy
        
        return tf.reduce_mean(tf.reduce_sum(loss_val, axis=-1))
    return loss

def get_compiled_model(freeze_backbones=True, learning_rate=LEARNING_RATE):
    model = build_hybrid_model(freeze_backbones=freeze_backbones)
    model.compile(
        optimizer=Adam(learning_rate=learning_rate),
        loss=focal_loss(),
        metrics=[
            'accuracy', 
            tf.keras.metrics.Recall(class_id=3, name='recall_severe'), 
            tf.keras.metrics.Recall(class_id=4, name='recall_proliferative')
        ]
    )
    return model
