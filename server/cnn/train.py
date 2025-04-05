# train.py
import os
import numpy as np
import tensorflow as tf
from model import create_model

def load_data():
    """
    Load and preprocess the MNIST dataset.
    Returns training and test datasets.
    """
    mnist = tf.keras.datasets.mnist
    (x_train, y_train), (x_test, y_test) = mnist.load_data()
    
    x_train, x_test = x_train / 255.0, x_test / 255.0
    
    x_train = x_train.reshape(x_train.shape[0], 28, 28, 1)
    x_test = x_test.reshape(x_test.shape[0], 28, 28, 1)
    
    return (x_train, y_train), (x_test, y_test)

def train_model(save_path='./saved_model/digit_model.h5'):
    """
    Train the CNN model on MNIST dataset and save it.
    
    Args:
        save_path: Path where the trained model will be saved
    
    Returns:
        The trained model
    """
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    (x_train, y_train), (x_test, y_test) = load_data()
    
    model = create_model()
    
    model.summary()
    
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=3,
        restore_best_weights=True
    )
    
    history = model.fit(
        x_train, y_train,
        epochs=10,
        batch_size=128,
        validation_data=(x_test, y_test),
        callbacks=[early_stopping]
    )
    
    loss, accuracy = model.evaluate(x_test, y_test, verbose=2)
    print(f"Model accuracy: {accuracy:.4f}")
    
    model.save(save_path)
    print(f"Model saved to {save_path}")
    
    return model, history

if __name__ == "__main__":
    model, history = train_model()