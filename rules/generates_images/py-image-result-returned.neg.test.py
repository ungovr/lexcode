# lexcode-expect: 0
# Image generation that only the team sees, and lookalikes that call no image model.
import base64
import io

from fastapi import FastAPI
from fastapi.responses import Response
from openai import OpenAI
from PIL import Image, ImageDraw

app = FastAPI()
client = OpenAI()


def main():
    # bin/make_hero.py: a designer runs it once and opens the file.
    result = client.images.generate(model="gpt-image-1", prompt="Soft watercolor skyline, no text", size="1536x1024")
    png = base64.b64decode(result.data[0].b64_json)
    with open("scripts/out/hero-draft.png", "wb") as fh:
        fh.write(png)
    print("wrote draft, bytes:", len(png))


@app.get("/og")
def og_card(title: str):
    # An Open Graph card drawn with Pillow, no model involved.
    img = Image.new("RGB", (1200, 630), "#0b3d5c")
    ImageDraw.Draw(img).text((60, 60), title, fill="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@app.post("/thumbnail")
async def thumbnail(body: bytes):
    # Resizing a picture a person uploaded is not generating one.
    img = Image.open(io.BytesIO(body))
    img.thumbnail((256, 256))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


if __name__ == "__main__":
    main()
