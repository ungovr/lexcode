# lexcode-expect: 0
import logging

from fastapi import FastAPI, HTTPException, Request

app = FastAPI()
logger = logging.getLogger(__name__)

ALLOWED = {"10.0.0.5", "10.0.0.6"}
_hits: dict[str, int] = {}


# The address is compared and discarded.
@app.middleware("http")
async def allow_list(request: Request, call_next):
    if request.client.host not in ALLOWED:
        raise HTTPException(status_code=403)
    return await call_next(request)


# The address is an in-memory rate-limit key and never written anywhere.
def rate_limit(request: Request, limit: int = 100) -> None:
    key = request.client.host
    _hits[key] = _hits.get(key, 0) + 1
    if _hits[key] > limit:
        raise HTTPException(status_code=429)


# Logging without the address.
@app.get("/health")
async def health(request: Request):
    logger.info("health check on %s", request.url.path)
    return {"ok": True}


# The server's own bind address and a literal loopback.
BIND_HOST = "0.0.0.0"
logger.info("listening on %s", BIND_HOST)
logger.info("probe from %s", "127.0.0.1")


# Forwarded protocol is not the person's address.
def scheme(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto", "http")
    logger.debug("proto %s", proto)
    return proto
