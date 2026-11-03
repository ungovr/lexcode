# lexcode-expect: 5
import posthog
from amplitude import Amplitude, BaseEvent
from fastapi import FastAPI, Request, Response
from mixpanel import Mixpanel
import segment.analytics as analytics

posthog.project_api_key = "phc_example"
mp = Mixpanel("project-token")
amp = Amplitude("api-key")
analytics.write_key = "segment-key"

app = FastAPI()


@app.middleware("http")
async def visitor_cookie(request: Request, call_next):
    # Hands every first-time visitor a two-year id so their visits can be joined up.
    response: Response = await call_next(request)
    if "visitor_id" not in request.cookies:
        response.set_cookie("visitor_id", "v-123", max_age=63072000)
    return response


def record_signup(user_id: str, plan: str) -> None:
    posthog.capture(user_id, "signed_up", {"plan": plan})
    mp.track(user_id, "Signed up", {"plan": plan})
    amp.track(BaseEvent(event_type="Signed up", user_id=user_id))
    analytics.track(user_id, "Signed up", {"plan": plan})
