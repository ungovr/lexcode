# lexcode-expect: 4
import logging

from fastapi import FastAPI, Request
from flask import Flask, request as flask_request
from sqlalchemy import text

app = FastAPI()
flask_app = Flask(__name__)
logger = logging.getLogger(__name__)


# Writes the visitor's address into the access log.
@app.middleware("http")
async def access_log(request: Request, call_next):
    logger.info("request from %s to %s", request.client.host, request.url.path)
    return await call_next(request)


# Stores the forwarded address with each signup.
@app.post("/signup")
async def signup(request: Request, db):
    forwarded = request.headers.get("x-forwarded-for")
    await db.execute(
        text("INSERT INTO signups (email, ip) VALUES (:email, :ip)"),
        {"email": "a@example.org", "ip": forwarded},
    )
    return {"ok": True}


# Flask: the remote address is kept on a visit record.
@flask_app.route("/hit")
def hit():
    address = flask_request.remote_addr
    Visit.objects.create(address=address)
    return "", 204


# Django-style META lookup written to the log.
def track(request):
    ip = request.META.get("REMOTE_ADDR")
    logger.warning("login attempt from %s", ip)
