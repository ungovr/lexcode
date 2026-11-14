# lexcode-expect: 126
# One function per call this rule's sinks list (#13034), in each form that reaches it: returned from
# a def, from inside `async with` in an async def. A sink entry that stops matching drops a match
# here.
import asyncio

import langchain_community.chat_models as lc
import langchain_openai
from google import genai
from langchain.chat_models import init_chat_model

llm = langchain_openai.ChatOpenAI(model="gpt-4o-mini")
gm = genai.GenerativeModel("gemini-2.5-flash")
LOCK = asyncio.Lock()


def d1(q):
    return ChatOpenAI(model=q)


async def a1(q):
    async with LOCK:
        return ChatOpenAI(model=q)


def d2(q):
    return AzureChatOpenAI(model=q)


async def a2(q):
    async with LOCK:
        return AzureChatOpenAI(model=q)


def d3(q):
    return ChatAnthropic(model=q)


async def a3(q):
    async with LOCK:
        return ChatAnthropic(model=q)


def d4(q):
    return ChatGoogleGenerativeAI(model=q)


async def a4(q):
    async with LOCK:
        return ChatGoogleGenerativeAI(model=q)


def d5(q):
    return ChatVertexAI(model=q)


async def a5(q):
    async with LOCK:
        return ChatVertexAI(model=q)


def d6(q):
    return ChatGroq(model=q)


async def a6(q):
    async with LOCK:
        return ChatGroq(model=q)


def d7(q):
    return ChatMistralAI(model=q)


async def a7(q):
    async with LOCK:
        return ChatMistralAI(model=q)


def d8(q):
    return ChatOllama(model=q)


async def a8(q):
    async with LOCK:
        return ChatOllama(model=q)


def d9(q):
    return ChatBedrockConverse(model=q)


async def a9(q):
    async with LOCK:
        return ChatBedrockConverse(model=q)


def d10(q):
    return ChatBedrock(model=q)


async def a10(q):
    async with LOCK:
        return ChatBedrock(model=q)


def d11(q):
    return ChatCohere(model=q)


async def a11(q):
    async with LOCK:
        return ChatCohere(model=q)


def d12(q):
    return ChatTogetherAI(model=q)


async def a12(q):
    async with LOCK:
        return ChatTogetherAI(model=q)


def d13(q):
    return ChatFireworks(model=q)


async def a13(q):
    async with LOCK:
        return ChatFireworks(model=q)


def d14(q):
    return ChatDeepSeek(model=q)


async def a14(q):
    async with LOCK:
        return ChatDeepSeek(model=q)


def d15(q):
    return ChatXAI(model=q)


async def a15(q):
    async with LOCK:
        return ChatXAI(model=q)


def d16(q):
    return ChatPerplexity(model=q)


async def a16(q):
    async with LOCK:
        return ChatPerplexity(model=q)


def d17(q):
    return ChatNVIDIA(model=q)


async def a17(q):
    async with LOCK:
        return ChatNVIDIA(model=q)


def d18(q):
    return ChatHuggingFace(model=q)


async def a18(q):
    async with LOCK:
        return ChatHuggingFace(model=q)


def d19(q):
    return lc.ChatOpenAI(model=q)


async def a19(q):
    async with LOCK:
        return lc.ChatOpenAI(model=q)


def d20(q):
    return lc.AzureChatOpenAI(model=q)


async def a20(q):
    async with LOCK:
        return lc.AzureChatOpenAI(model=q)


def d21(q):
    return lc.ChatAnthropic(model=q)


async def a21(q):
    async with LOCK:
        return lc.ChatAnthropic(model=q)


def d22(q):
    return lc.ChatGoogleGenerativeAI(model=q)


async def a22(q):
    async with LOCK:
        return lc.ChatGoogleGenerativeAI(model=q)


def d23(q):
    return lc.ChatVertexAI(model=q)


async def a23(q):
    async with LOCK:
        return lc.ChatVertexAI(model=q)


def d24(q):
    return lc.ChatGroq(model=q)


async def a24(q):
    async with LOCK:
        return lc.ChatGroq(model=q)


def d25(q):
    return lc.ChatMistralAI(model=q)


async def a25(q):
    async with LOCK:
        return lc.ChatMistralAI(model=q)


def d26(q):
    return lc.ChatOllama(model=q)


async def a26(q):
    async with LOCK:
        return lc.ChatOllama(model=q)


def d27(q):
    return lc.ChatBedrockConverse(model=q)


async def a27(q):
    async with LOCK:
        return lc.ChatBedrockConverse(model=q)


def d28(q):
    return lc.ChatBedrock(model=q)


async def a28(q):
    async with LOCK:
        return lc.ChatBedrock(model=q)


def d29(q):
    return lc.ChatCohere(model=q)


async def a29(q):
    async with LOCK:
        return lc.ChatCohere(model=q)


def d30(q):
    return lc.ChatTogetherAI(model=q)


async def a30(q):
    async with LOCK:
        return lc.ChatTogetherAI(model=q)


def d31(q):
    return lc.ChatFireworks(model=q)


async def a31(q):
    async with LOCK:
        return lc.ChatFireworks(model=q)


def d32(q):
    return lc.ChatDeepSeek(model=q)


async def a32(q):
    async with LOCK:
        return lc.ChatDeepSeek(model=q)


def d33(q):
    return lc.ChatXAI(model=q)


async def a33(q):
    async with LOCK:
        return lc.ChatXAI(model=q)


def d34(q):
    return lc.ChatPerplexity(model=q)


async def a34(q):
    async with LOCK:
        return lc.ChatPerplexity(model=q)


def d35(q):
    return lc.ChatNVIDIA(model=q)


async def a35(q):
    async with LOCK:
        return lc.ChatNVIDIA(model=q)


def d36(q):
    return lc.ChatHuggingFace(model=q)


async def a36(q):
    async with LOCK:
        return lc.ChatHuggingFace(model=q)


def d37(q):
    return init_chat_model(q)


async def a37(q):
    async with LOCK:
        return init_chat_model(q)


def d38(q):
    return gm.generate_content(q)


async def a38(q):
    async with LOCK:
        return gm.generate_content(q)


def d39(q):
    return gm.generate_content_async(q)


async def a39(q):
    async with LOCK:
        return gm.generate_content_async(q)


def d40(q):
    return gm.generate_content_stream(q)


async def a40(q):
    async with LOCK:
        return gm.generate_content_stream(q)


def d41(q):
    return llm.invoke(q)


async def a41(q):
    async with LOCK:
        return llm.invoke(q)


def d42(q):
    return llm.ainvoke(q)


async def a42(q):
    async with LOCK:
        return llm.ainvoke(q)


def d43(q):
    return llm.stream(q)


async def a43(q):
    async with LOCK:
        return llm.stream(q)


def d44(q):
    return llm.astream(q)


async def a44(q):
    async with LOCK:
        return llm.astream(q)


def d45(q):
    return llm.astream_events(q)


async def a45(q):
    async with LOCK:
        return llm.astream_events(q)


def d46(q):
    return llm.astream_log(q)


async def a46(q):
    async with LOCK:
        return llm.astream_log(q)


def d47(q):
    return llm.batch(q)


async def a47(q):
    async with LOCK:
        return llm.batch(q)


def d48(q):
    return llm.abatch(q)


async def a48(q):
    async with LOCK:
        return llm.abatch(q)


def d49(q):
    return llm.predict(q)


async def a49(q):
    async with LOCK:
        return llm.predict(q)


def d50(q):
    return llm.apredict(q)


async def a50(q):
    async with LOCK:
        return llm.apredict(q)


def d51(q):
    return llm.predict_messages(q)


async def a51(q):
    async with LOCK:
        return llm.predict_messages(q)


def d52(q):
    return llm.apredict_messages(q)


async def a52(q):
    async with LOCK:
        return llm.apredict_messages(q)


def d53(q):
    return llm.generate(q)


async def a53(q):
    async with LOCK:
        return llm.generate(q)


def d54(q):
    return llm.agenerate(q)


async def a54(q):
    async with LOCK:
        return llm.agenerate(q)


def d55(q):
    return llm.generate_prompt(q)


async def a55(q):
    async with LOCK:
        return llm.generate_prompt(q)


def d56(q):
    return llm.agenerate_prompt(q)


async def a56(q):
    async with LOCK:
        return llm.agenerate_prompt(q)


def d57(q):
    return llm.call_as_llm(q)


async def a57(q):
    async with LOCK:
        return llm.call_as_llm(q)


def d58(q):
    return llm.run(q)


async def a58(q):
    async with LOCK:
        return llm.run(q)


def d59(q):
    return llm.arun(q)


async def a59(q):
    async with LOCK:
        return llm.arun(q)


def d60(q):
    return llm.apply(q)


async def a60(q):
    async with LOCK:
        return llm.apply(q)


def d61(q):
    return llm.aapply(q)


async def a61(q):
    async with LOCK:
        return llm.aapply(q)


def d62(q):
    return llm.transform(q)


async def a62(q):
    async with LOCK:
        return llm.transform(q)


def d63(q):
    return llm.atransform(q)


async def a63(q):
    async with LOCK:
        return llm.atransform(q)
