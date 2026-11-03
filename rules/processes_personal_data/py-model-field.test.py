# lexcode-expect: 7
from django.db import models
from sqlalchemy import Column, Date, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlmodel import Field, SQLModel


class Base(DeclarativeBase):
    pass


# SQLAlchemy, classic style.
class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True)
    display_name = Column(String(80))
    email = Column(String(255), unique=True, nullable=False)
    phone_number = Column(String(32))
    date_of_birth = Column(Date)


# SQLAlchemy 2.0 typed style.
class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True)
    nickname: Mapped[str] = mapped_column(String(40))
    ip_address: Mapped[str] = mapped_column(String(45))


# SQLModel.
class Subscriber(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    topic: str
    email: str = Field(index=True)


# Django.
class Resident(models.Model):
    full_name = models.CharField(max_length=120)
    contact = models.EmailField()
    ssn = models.CharField(max_length=11, blank=True)
