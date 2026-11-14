# lexcode-expect: 3
# Shapes the narrower sink has to keep (#13034): a model built at module level and called in a
# function by one of the rarer method names, async for, and a lambda. This rule has no sink for an
# answer made at module level that a function returns (see the rule's header).
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")


def label(note: str):
    return llm.predict_messages([note]).content


async def stream_answer(question: str):
    async for chunk in llm.astream(question):
        yield chunk.content


ask = lambda question: llm.invoke(question)
