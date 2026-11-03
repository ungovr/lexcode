# lexcode-expect: 0
import logging

from fastapi import FastAPI, Request, Response
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="change-me", session_cookie="sid")
log = logging.getLogger(__name__)


@app.post("/login")
async def login(response: Response):
    # A first-party session cookie keeps one visit logged in.
    response.set_cookie("session", "token", httponly=True, secure=True, max_age=3600)
    response.set_cookie("csrf_token", "abc", httponly=False, samesite="strict")
    return {"ok": True}


@app.post("/preferences")
async def preferences(theme: str, response: Response):
    response.set_cookie("theme", theme, max_age=31536000)
    return {"theme": theme}


@app.exception_handler(Exception)
async def report(request: Request, exc: Exception):
    # Server-side error logging.
    log.exception("request failed: %s", request.url.path)
    return Response(status_code=500)


class Metrics:
    def track(self, name):
        return name

    def capture(self, name):
        return name


metrics = Metrics()
metrics.track("served")
metrics.capture("served")
