# lexcode-expect: 4
# Shapes the narrower sink has to keep (#13034): async with and async for, a lambda, and a result
# set at module level that a function returns.
import anthropic
import litellm
from openai import OpenAI

client = OpenAI()
claude = anthropic.AsyncAnthropic()

GREETING = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Write a one-line greeting for the home page."}],
)


def greeting() -> str:
    return GREETING.choices[0].message.content


async def stream_reply(prompt: str):
    async with claude.messages.stream(
        model="claude-sonnet-4-5", max_tokens=400, messages=[{"role": "user", "content": prompt}]
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def first_words(prompt: str):
    stream = await client.chat.completions.create(
        model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}], stream=True
    )
    async for chunk in stream:
        return chunk.choices[0].delta.content


ask = lambda prompt: litellm.completion(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}])
