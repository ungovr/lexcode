# lexcode-expect: 0
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr, Field
from pydantic_settings import BaseSettings

app = FastAPI()


# The app's own support address, read from the environment at startup.
class Settings(BaseSettings):
    support_email: EmailStr = "help@example.org"
    sender: EmailStr = Field(default="no-reply@example.org")
    database_url: str = "sqlite:///local.db"


# A request model with names and text only.
class FeedbackRequest(BaseModel):
    name: str
    display_name: str | None = None
    message: str = Field(min_length=10)


# A fixed address given as a default inside a response model.
class Branding(BaseModel):
    contact: EmailStr = "press@example.org"
    title: str = "Example"


# Validation helper with no model around it.
def check(address: str) -> bool:
    return "@" in address
