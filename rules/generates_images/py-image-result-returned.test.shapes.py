# lexcode-expect: 3
# Shapes the narrower sink has to keep (#13034): an async def, a lambda, and an image made at module
# level that a function returns.
from openai import AsyncOpenAI, OpenAI

client = OpenAI()
aclient = AsyncOpenAI()

HERO = client.images.generate(model="gpt-image-1", prompt="A lighthouse at dawn, flat illustration")


def hero_image():
    return HERO.data[0].b64_json


async def sticker(subject: str):
    result = await aclient.images.generate(model="gpt-image-1", prompt=f"A sticker of {subject}")
    if result.data:
        return result.data[0].b64_json


draw = lambda prompt: client.images.generate(model="gpt-image-1", prompt=prompt)
