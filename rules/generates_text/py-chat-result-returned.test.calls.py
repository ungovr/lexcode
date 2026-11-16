# lexcode-expect: 20
# One function per call this rule's sinks list (#13034), in each form that reaches it: returned from
# a def, from inside `async with` in an async def, as a lambda's body, and set at module level and
# returned by a function. A sink entry that stops matching drops a match here.
import asyncio

import anthropic
import litellm
import ollama
import openai
from openai import OpenAI

client = OpenAI()
claude = anthropic.Anthropic()
LOCK = asyncio.Lock()
Q = "Write a haiku about the sea."


def d1(q):
    return client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


async def a1(q):
    async with LOCK:
        return client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


l1 = lambda q: client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


M1 = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": Q}])


def m1():
    return M1


def d2(q):
    return claude.messages.create(model="claude-sonnet-4-5", max_tokens=300, messages=[{"role": "user", "content": q}])


async def a2(q):
    async with LOCK:
        return claude.messages.create(model="claude-sonnet-4-5", max_tokens=300, messages=[{"role": "user", "content": q}])


l2 = lambda q: claude.messages.create(model="claude-sonnet-4-5", max_tokens=300, messages=[{"role": "user", "content": q}])


M2 = claude.messages.create(model="claude-sonnet-4-5", max_tokens=300, messages=[{"role": "user", "content": Q}])


def m2():
    return M2


def d3(q):
    return litellm.completion(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


async def a3(q):
    async with LOCK:
        return litellm.completion(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


l3 = lambda q: litellm.completion(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


M3 = litellm.completion(model="gpt-4o-mini", messages=[{"role": "user", "content": Q}])


def m3():
    return M3


def d4(q):
    return openai.ChatCompletion.create(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


async def a4(q):
    async with LOCK:
        return openai.ChatCompletion.create(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


l4 = lambda q: openai.ChatCompletion.create(model="gpt-4o-mini", messages=[{"role": "user", "content": q}])


M4 = openai.ChatCompletion.create(model="gpt-4o-mini", messages=[{"role": "user", "content": Q}])


def m4():
    return M4


def d5(q):
    return ollama.chat(model="llama3.2", messages=[{"role": "user", "content": q}])


async def a5(q):
    async with LOCK:
        return ollama.chat(model="llama3.2", messages=[{"role": "user", "content": q}])


l5 = lambda q: ollama.chat(model="llama3.2", messages=[{"role": "user", "content": q}])


M5 = ollama.chat(model="llama3.2", messages=[{"role": "user", "content": Q}])


def m5():
    return M5
