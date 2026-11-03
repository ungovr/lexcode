# lexcode-expect: 3
from django.urls import path
from fastapi import APIRouter
from flask import Flask, render_template, request

from . import views

app = Flask(__name__)
router = APIRouter()


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        return create_account(request.form)
    return render_template("signup.html")


@router.post("/api/auth/register")
async def register(payload: RegistrationIn):
    return await accounts.create(payload)


urlpatterns = [
    path("accounts/signup/", views.signup, name="signup"),
    path("accounts/login/", views.login_view, name="login"),
]
