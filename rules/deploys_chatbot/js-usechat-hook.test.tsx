// lexcode-expect: 2
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

// The chat window of the support widget: the visitor types, the model answers, and the
// hook keeps the whole exchange so each new turn is sent with what came before.
export function SupportChat() {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({ api: '/api/chat' });

  return (
    <section aria-label="Support chat">
      <ul>
        {messages.map((m) => (
          <li key={m.id} data-role={m.role}>
            {m.parts.map((part, i) => (part.type === 'text' ? <span key={i}>{part.text}</span> : null))}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} placeholder="Ask a question" disabled={status !== 'ready'} />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}

export function Panel() {
  const [open, setOpen] = useState(false);
  const chat = useChat();
  return (
    <aside>
      <button onClick={() => setOpen(!open)}>Help</button>
      {open && <pre>{JSON.stringify(chat.messages.length)}</pre>}
    </aside>
  );
}
