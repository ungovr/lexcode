# lexcode-expect: 0
from django.urls import path
from fastapi import APIRouter
from flask import Flask

from . import views

app = Flask(__name__)
router = APIRouter()


@app.route("/admin/users/new", methods=["GET", "POST"])
def admin_new_user():
    return render_admin_form()


@router.post("/login")
async def login(payload: LoginIn):
    return await sessions.create(payload)


@router.post("/vehicles/register")
async def register_vehicle(payload: VehicleIn):
    return await fleet.add(payload)


@router.get("/registry/search")
async def search_registry(q: str):
    return await registry.search(q)


urlpatterns = [
    path("invitations/accept/", views.accept_invitation),
    path("dashboard/", views.dashboard),
]
