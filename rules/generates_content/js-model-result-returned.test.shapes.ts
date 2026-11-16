// lexcode-expect: 4
// Shapes the narrower sink has to keep (#13034): a model or chain built at module level and called in
// a function by the rarer method names, and an answer made at module level that a function returns.
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

const llm = new ChatOpenAI({ model: 'gpt-4o-mini' });
const chain = PromptTemplate.fromTemplate('Label this note: {note}').pipe(llm);

const welcome = await llm.invoke('Write a one-line welcome for new members.');

export function welcomeText() {
  return welcome.content;
}

export async function label(note: string) {
  return chain.run({ note });
}

export async function labelAll(notes: string[]) {
  return llm.predictMessages(notes);
}

export const trace = (question: string) => llm.streamLog(question);
