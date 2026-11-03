# lexcode-expect: 3
import numpy as np
import tensorflow as tf
from tensorflow import keras


def build_and_train(X: np.ndarray, y: np.ndarray):
    model = keras.Sequential(
        [
            keras.layers.Input(shape=(X.shape[1],)),
            keras.layers.Dense(64, activation="relu"),
            keras.layers.Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
    history = model.fit(X, y, epochs=20, batch_size=32, validation_split=0.1)
    model.save("model.keras")
    return history


def functional_model(train_ds):
    inputs = keras.Input(shape=(28, 28, 1))
    x = keras.layers.Conv2D(16, 3, activation="relu")(inputs)
    x = keras.layers.GlobalAveragePooling2D()(x)
    outputs = keras.layers.Dense(10)(x)
    net = keras.Model(inputs, outputs)
    net.compile(loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True), optimizer=keras.optimizers.Adam())
    net.fit(train_ds, epochs=5)
    return net


class Recommender:
    def __init__(self):
        self.net = tf.keras.Sequential([tf.keras.layers.Dense(8), tf.keras.layers.Dense(1)])

    def learn(self, X, y):
        self.net.compile(optimizer="sgd", loss="mse")
        return self.net.fit(X, y, epochs=3, verbose=0)
