# lexcode-expect: 0
# A chat endpoint that answers and keeps nothing, a contact form saved to a table,
# and a feedback row. Neither keeps a conversation.
from fastapi import FastAPI
from openai import OpenAI
from sqlalchemy.orm import Session

from .models import ContactRequest, Feedback
from .schemas import ChatRequest, ContactForm, FeedbackForm

app = FastAPI()
client = OpenAI()


@app.post("/chat")
async def chat(body: ChatRequest):
    # The turn goes to the model and back to the caller. No history is stored.
    reply = client.chat.completions.create(model="gpt-4o-mini", messages=[m.model_dump() for m in body.messages])
    return {"reply": reply.choices[0].message.content}


@app.post("/contact")
async def contact(form: ContactForm, session: Session):
    session.add(ContactRequest(email=form.email, subject=form.subject, message=form.message))
    session.commit()
    return {"received": True}


@app.post("/feedback")
async def feedback(form: FeedbackForm, db):
    await db.feedback.insert_one({"rating": form.rating, "comment": form.comment})
    return {"ok": True}


@app.post("/chat/count")
async def count(body: ChatRequest, session: Session):
    total = sum(len(m.content.split()) for m in body.messages)
    session.add(Feedback(rating=min(total, 5), comment="length check"))
    return {"words": total}
