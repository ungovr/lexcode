# lexcode-expect: 0
# Inference with models somebody else trained, and fits that are not models.
import joblib
import numpy as np
import torch
from openai import OpenAI
from scipy.optimize import curve_fit
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, MinMaxScaler, StandardScaler
from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline

client = OpenAI()


def score_rows(rows):
    # A model loaded from disk is only asked for predictions.
    model = joblib.load("models/churn.joblib")
    return model.predict_proba(rows)[:, 1]


def classify_ticket(text: str) -> str:
    tok = AutoTokenizer.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
    net = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased-finetuned-sst-2-english")
    net.eval()
    with torch.no_grad():
        logits = net(**tok(text, return_tensors="pt")).logits
    return net.config.id2label[int(logits.argmax())]


def embed(texts):
    encoder = pipeline("feature-extraction", model="sentence-transformers/all-MiniLM-L6-v2")
    return encoder(texts)


def normalize(X, y=None):
    # Fitting a scaler or an encoder learns column statistics, not a model.
    scaler = StandardScaler()
    scaler.fit(X)
    scaled = MinMaxScaler().fit(X).transform(X)
    labels = LabelEncoder().fit(y) if y is not None else None
    return scaler.transform(X), scaled, labels


def vectorize(docs):
    vec = TfidfVectorizer(stop_words="english")
    vec.fit(docs)
    return vec.transform(docs)


def project(X):
    return PCA(n_components=2).fit(X).transform(X)


def trend(xs, ys):
    # Curve fits and polynomial fits describe a measurement series.
    line = np.polyfit(xs, ys, 1)
    (a, b), _ = curve_fit(lambda x, a, b: a * np.exp(b * x), xs, ys, p0=(1.0, 0.1))
    return line, a, b


def ask(prompt: str) -> str:
    # Calling somebody else's model is not training one.
    reply = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}])
    return reply.choices[0].message.content


def attribution(model, x):
    # A backward pass for an explanation, with no optimizer step.
    x.requires_grad_(True)
    model(x).sum().backward()
    return x.grad.abs()
