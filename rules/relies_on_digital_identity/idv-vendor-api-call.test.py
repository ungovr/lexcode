# lexcode-expect: 2
import os

import requests


def start_sumsub_applicant(external_user_id: str) -> dict:
    # Creates an applicant for know-your-customer checks.
    reply = requests.post(
        "https://api.sumsub.com/resources/applicants?levelName=basic-kyc-level",
        json={"externalUserId": external_user_id},
        headers={"X-App-Token": os.environ["SUMSUB_TOKEN"]},
        timeout=20,
    )
    return reply.json()


def yoti_age_estimate(image_b64: str) -> dict:
    reply = requests.post(
        "https://api.yoti.com/ai/v1/age",
        json={"img": image_b64},
        headers={"Authorization": "Bearer " + os.environ["YOTI_KEY"]},
        timeout=20,
    )
    return reply.json()
