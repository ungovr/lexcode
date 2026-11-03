# lexcode-expect: 4
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import SQLModel

app = FastAPI()


# A sign-up request: the person gives an email address.
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12)


class InviteRequest(BaseModel):
    invitee: Optional[EmailStr] = None
    role: str = "member"


class ContactForm(BaseModel):
    reply_to: EmailStr = Field(description="Where the answer should be sent")
    message: str


# A table model shares its fields with the request models.
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True


@app.post("/signup")
def signup(body: SignupRequest):
    return {"ok": True}
