# lexcode-expect: 3
from fastapi import FastAPI
from openai import OpenAI

app = FastAPI()
client = OpenAI()


def render_cover(title: str) -> str:
    # A helper hands the generated picture to its caller. Where it goes is not
    # visible here, so the match is a signal.
    result = client.images.generate(model="gpt-image-1", prompt=f"Book cover for {title}")
    return result.data[0].b64_json


def render_icon(name: str):
    result = client.images.generate(model="dall-e-3", prompt=f"Flat icon of {name}")
    return {"name": name, "url": result.data[0].url}


def render_many(names):
    for name in names:
        result = client.images.generate(model="dall-e-3", prompt=f"Sticker of {name}")
        yield result.data[0].url


@app.post("/cover")
def cover(body: dict):
    # This route answers the request itself, so the evidence rule owns it.
    result = client.images.generate(model="gpt-image-1", prompt=body["prompt"])
    return {"image": result.data[0].b64_json}
