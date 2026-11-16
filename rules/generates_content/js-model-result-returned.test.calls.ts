// lexcode-expect: 102
// One function per call this rule's sinks list (#13034), in each form that reaches it: returned
// from a named function and from an anonymous callback, and set at module level and returned by a
// function. A sink entry that stops matching drops a match here.
import { ChatOpenAI } from '@langchain/openai';
import { initChatModel } from 'langchain/chat_models/universal';
import { GoogleGenerativeAI } from '@google/generative-ai';

const llm = new ChatOpenAI({ model: 'gpt-4o-mini' });
const gm = new GoogleGenerativeAI('key').getGenerativeModel({ model: 'gemini-2.5-flash' });
const Q = 'Explain tides.';

export async function n1(q: string) {
  const out = await new ChatOpenAI({ model: q });
  const text = out;
  return text;
}
export const c1 = retry(async function (q: string) {
  const out = await new ChatOpenAI({ model: q });
  const text = out;
  return text;
});
const m1Result = await new ChatOpenAI({ model: Q });
export function m1() {
  return m1Result;
}

export async function n2(q: string) {
  const out = await new AzureChatOpenAI({ model: q });
  const text = out;
  return text;
}
export const c2 = retry(async function (q: string) {
  const out = await new AzureChatOpenAI({ model: q });
  const text = out;
  return text;
});
const m2Result = await new AzureChatOpenAI({ model: Q });
export function m2() {
  return m2Result;
}

export async function n3(q: string) {
  const out = await new ChatAnthropic({ model: q });
  const text = out;
  return text;
}
export const c3 = retry(async function (q: string) {
  const out = await new ChatAnthropic({ model: q });
  const text = out;
  return text;
});
const m3Result = await new ChatAnthropic({ model: Q });
export function m3() {
  return m3Result;
}

export async function n4(q: string) {
  const out = await new ChatGoogleGenerativeAI({ model: q });
  const text = out;
  return text;
}
export const c4 = retry(async function (q: string) {
  const out = await new ChatGoogleGenerativeAI({ model: q });
  const text = out;
  return text;
});
const m4Result = await new ChatGoogleGenerativeAI({ model: Q });
export function m4() {
  return m4Result;
}

export async function n5(q: string) {
  const out = await new ChatVertexAI({ model: q });
  const text = out;
  return text;
}
export const c5 = retry(async function (q: string) {
  const out = await new ChatVertexAI({ model: q });
  const text = out;
  return text;
});
const m5Result = await new ChatVertexAI({ model: Q });
export function m5() {
  return m5Result;
}

export async function n6(q: string) {
  const out = await new ChatGroq({ model: q });
  const text = out;
  return text;
}
export const c6 = retry(async function (q: string) {
  const out = await new ChatGroq({ model: q });
  const text = out;
  return text;
});
const m6Result = await new ChatGroq({ model: Q });
export function m6() {
  return m6Result;
}

export async function n7(q: string) {
  const out = await new ChatMistralAI({ model: q });
  const text = out;
  return text;
}
export const c7 = retry(async function (q: string) {
  const out = await new ChatMistralAI({ model: q });
  const text = out;
  return text;
});
const m7Result = await new ChatMistralAI({ model: Q });
export function m7() {
  return m7Result;
}

export async function n8(q: string) {
  const out = await new ChatOllama({ model: q });
  const text = out;
  return text;
}
export const c8 = retry(async function (q: string) {
  const out = await new ChatOllama({ model: q });
  const text = out;
  return text;
});
const m8Result = await new ChatOllama({ model: Q });
export function m8() {
  return m8Result;
}

export async function n9(q: string) {
  const out = await new ChatBedrockConverse({ model: q });
  const text = out;
  return text;
}
export const c9 = retry(async function (q: string) {
  const out = await new ChatBedrockConverse({ model: q });
  const text = out;
  return text;
});
const m9Result = await new ChatBedrockConverse({ model: Q });
export function m9() {
  return m9Result;
}

export async function n10(q: string) {
  const out = await new ChatBedrock({ model: q });
  const text = out;
  return text;
}
export const c10 = retry(async function (q: string) {
  const out = await new ChatBedrock({ model: q });
  const text = out;
  return text;
});
const m10Result = await new ChatBedrock({ model: Q });
export function m10() {
  return m10Result;
}

export async function n11(q: string) {
  const out = await new ChatCohere({ model: q });
  const text = out;
  return text;
}
export const c11 = retry(async function (q: string) {
  const out = await new ChatCohere({ model: q });
  const text = out;
  return text;
});
const m11Result = await new ChatCohere({ model: Q });
export function m11() {
  return m11Result;
}

export async function n12(q: string) {
  const out = await new ChatTogetherAI({ model: q });
  const text = out;
  return text;
}
export const c12 = retry(async function (q: string) {
  const out = await new ChatTogetherAI({ model: q });
  const text = out;
  return text;
});
const m12Result = await new ChatTogetherAI({ model: Q });
export function m12() {
  return m12Result;
}

export async function n13(q: string) {
  const out = await new ChatFireworks({ model: q });
  const text = out;
  return text;
}
export const c13 = retry(async function (q: string) {
  const out = await new ChatFireworks({ model: q });
  const text = out;
  return text;
});
const m13Result = await new ChatFireworks({ model: Q });
export function m13() {
  return m13Result;
}

export async function n14(q: string) {
  const out = await new ChatDeepSeek({ model: q });
  const text = out;
  return text;
}
export const c14 = retry(async function (q: string) {
  const out = await new ChatDeepSeek({ model: q });
  const text = out;
  return text;
});
const m14Result = await new ChatDeepSeek({ model: Q });
export function m14() {
  return m14Result;
}

export async function n15(q: string) {
  const out = await new ChatXAI({ model: q });
  const text = out;
  return text;
}
export const c15 = retry(async function (q: string) {
  const out = await new ChatXAI({ model: q });
  const text = out;
  return text;
});
const m15Result = await new ChatXAI({ model: Q });
export function m15() {
  return m15Result;
}

export async function n16(q: string) {
  const out = await new ChatPerplexity({ model: q });
  const text = out;
  return text;
}
export const c16 = retry(async function (q: string) {
  const out = await new ChatPerplexity({ model: q });
  const text = out;
  return text;
});
const m16Result = await new ChatPerplexity({ model: Q });
export function m16() {
  return m16Result;
}

export async function n17(q: string) {
  const out = await new ChatNVIDIA({ model: q });
  const text = out;
  return text;
}
export const c17 = retry(async function (q: string) {
  const out = await new ChatNVIDIA({ model: q });
  const text = out;
  return text;
});
const m17Result = await new ChatNVIDIA({ model: Q });
export function m17() {
  return m17Result;
}

export async function n18(q: string) {
  const out = await new ChatHuggingFace({ model: q });
  const text = out;
  return text;
}
export const c18 = retry(async function (q: string) {
  const out = await new ChatHuggingFace({ model: q });
  const text = out;
  return text;
});
const m18Result = await new ChatHuggingFace({ model: Q });
export function m18() {
  return m18Result;
}

export async function n19(q: string) {
  const out = await initChatModel(q);
  const text = out;
  return text;
}
export const c19 = retry(async function (q: string) {
  const out = await initChatModel(q);
  const text = out;
  return text;
});
const m19Result = await initChatModel(Q);
export function m19() {
  return m19Result;
}

export async function n20(q: string) {
  const out = await gm.generateContent(q);
  const text = out;
  return text;
}
export const c20 = retry(async function (q: string) {
  const out = await gm.generateContent(q);
  const text = out;
  return text;
});
const m20Result = await gm.generateContent(Q);
export function m20() {
  return m20Result;
}

export async function n21(q: string) {
  const out = await gm.generateContentStream(q);
  const text = out;
  return text;
}
export const c21 = retry(async function (q: string) {
  const out = await gm.generateContentStream(q);
  const text = out;
  return text;
});
const m21Result = await gm.generateContentStream(Q);
export function m21() {
  return m21Result;
}

export async function n22(q: string) {
  const out = await llm.invoke(q);
  const text = out;
  return text;
}
export const c22 = retry(async function (q: string) {
  const out = await llm.invoke(q);
  const text = out;
  return text;
});
const m22Result = await llm.invoke(Q);
export function m22() {
  return m22Result;
}

export async function n23(q: string) {
  const out = await llm.stream(q);
  const text = out;
  return text;
}
export const c23 = retry(async function (q: string) {
  const out = await llm.stream(q);
  const text = out;
  return text;
});
const m23Result = await llm.stream(Q);
export function m23() {
  return m23Result;
}

export async function n24(q: string) {
  const out = await llm.streamEvents(q);
  const text = out;
  return text;
}
export const c24 = retry(async function (q: string) {
  const out = await llm.streamEvents(q);
  const text = out;
  return text;
});
const m24Result = await llm.streamEvents(Q);
export function m24() {
  return m24Result;
}

export async function n25(q: string) {
  const out = await llm.streamLog(q);
  const text = out;
  return text;
}
export const c25 = retry(async function (q: string) {
  const out = await llm.streamLog(q);
  const text = out;
  return text;
});
const m25Result = await llm.streamLog(Q);
export function m25() {
  return m25Result;
}

export async function n26(q: string) {
  const out = await llm.batch(q);
  const text = out;
  return text;
}
export const c26 = retry(async function (q: string) {
  const out = await llm.batch(q);
  const text = out;
  return text;
});
const m26Result = await llm.batch(Q);
export function m26() {
  return m26Result;
}

export async function n27(q: string) {
  const out = await llm.predict(q);
  const text = out;
  return text;
}
export const c27 = retry(async function (q: string) {
  const out = await llm.predict(q);
  const text = out;
  return text;
});
const m27Result = await llm.predict(Q);
export function m27() {
  return m27Result;
}

export async function n28(q: string) {
  const out = await llm.predictMessages(q);
  const text = out;
  return text;
}
export const c28 = retry(async function (q: string) {
  const out = await llm.predictMessages(q);
  const text = out;
  return text;
});
const m28Result = await llm.predictMessages(Q);
export function m28() {
  return m28Result;
}

export async function n29(q: string) {
  const out = await llm.generate(q);
  const text = out;
  return text;
}
export const c29 = retry(async function (q: string) {
  const out = await llm.generate(q);
  const text = out;
  return text;
});
const m29Result = await llm.generate(Q);
export function m29() {
  return m29Result;
}

export async function n30(q: string) {
  const out = await llm.generatePrompt(q);
  const text = out;
  return text;
}
export const c30 = retry(async function (q: string) {
  const out = await llm.generatePrompt(q);
  const text = out;
  return text;
});
const m30Result = await llm.generatePrompt(Q);
export function m30() {
  return m30Result;
}

export async function n31(q: string) {
  const out = await llm.call(q);
  const text = out;
  return text;
}
export const c31 = retry(async function (q: string) {
  const out = await llm.call(q);
  const text = out;
  return text;
});
const m31Result = await llm.call(Q);
export function m31() {
  return m31Result;
}

export async function n32(q: string) {
  const out = await llm.run(q);
  const text = out;
  return text;
}
export const c32 = retry(async function (q: string) {
  const out = await llm.run(q);
  const text = out;
  return text;
});
const m32Result = await llm.run(Q);
export function m32() {
  return m32Result;
}

export async function n33(q: string) {
  const out = await llm.apply(q);
  const text = out;
  return text;
}
export const c33 = retry(async function (q: string) {
  const out = await llm.apply(q);
  const text = out;
  return text;
});
const m33Result = await llm.apply(Q);
export function m33() {
  return m33Result;
}

export async function n34(q: string) {
  const out = await llm.transform(q);
  const text = out;
  return text;
}
export const c34 = retry(async function (q: string) {
  const out = await llm.transform(q);
  const text = out;
  return text;
});
const m34Result = await llm.transform(Q);
export function m34() {
  return m34Result;
}
