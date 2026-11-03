# lexcode-expect: 0
from django.db import models
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlmodel import Field, SQLModel

SUPPORT_EMAIL = "help@example.org"


class Base(DeclarativeBase):
    pass


# A name or display name alone is not a strong token.
class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
    display_name = Column(String(80))
    slug = Column(String(80), unique=True)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(40))


class Note(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    body: str = Field(default="")


class Project(models.Model):
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    archived = models.BooleanField(default=False)


# A test factory sets attributes on instances; it declares no column.
def make_customer(**overrides):
    values = {"email": "demo@example.org", "phone": "555-0100"}
    values.update(overrides)
    return values


# A validator with no storage behind it.
def looks_like_email(value: str) -> bool:
    return "@" in value and "." in value.split("@")[-1]


# Plain class attributes and a constant, not model fields.
class Mailer:
    email = SUPPORT_EMAIL
    phone = "555-0100"
