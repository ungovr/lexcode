# lexcode-expect: 12
# One function per call this rule's sinks list (#13034), in each form that reaches it: returned from
# a def, from inside `async with` in an async def, as a lambda's body, and set at module level and
# returned by a function. A sink entry that stops matching drops a match here.
import asyncio

import openai
from google import genai
from openai import OpenAI

client = OpenAI()
gclient = genai.Client()
LOCK = asyncio.Lock()
Q = "A lighthouse at dawn"


def d1(q):
    return client.images.generate(model="gpt-image-1", prompt=q)


async def a1(q):
    async with LOCK:
        return client.images.generate(model="gpt-image-1", prompt=q)


l1 = lambda q: client.images.generate(model="gpt-image-1", prompt=q)


M1 = client.images.generate(model="gpt-image-1", prompt=Q)


def m1():
    return M1


def d2(q):
    return gclient.models.generate_images(model="imagen-4.0-generate-001", prompt=q)


async def a2(q):
    async with LOCK:
        return gclient.models.generate_images(model="imagen-4.0-generate-001", prompt=q)


l2 = lambda q: gclient.models.generate_images(model="imagen-4.0-generate-001", prompt=q)


M2 = gclient.models.generate_images(model="imagen-4.0-generate-001", prompt=Q)


def m2():
    return M2


def d3(q):
    return openai.Image.create(prompt=q)


async def a3(q):
    async with LOCK:
        return openai.Image.create(prompt=q)


l3 = lambda q: openai.Image.create(prompt=q)


M3 = openai.Image.create(prompt=Q)


def m3():
    return M3
