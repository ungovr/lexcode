# lexcode-expect: 0
# Model calls whose output stays with the team that runs them, and lookalikes that call no model.
import json
import logging
import sys

import anthropic
import requests
from fastapi import FastAPI
from openai import OpenAI
from sqlalchemy import text

app = FastAPI()
client = OpenAI()
claude = anthropic.Anthropic()
log = logging.getLogger("digest")


def main():
    # bin/weekly_digest.py: a maintainer runs it and reads the terminal.
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Summarize this week's open issues for the maintainers."}],
    )
    summary = completion.choices[0].message.content
    print(summary)
    with open("scripts/out/digest.md", "w") as fh:
        fh.write(summary)
    log.info("digest written: %s", summary[:80])


def explain_failure(trace: str) -> None:
    msg = claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        messages=[{"role": "user", "content": "Explain this failure for the on-call engineer:\n" + trace}],
    )
    note = msg.content[0].text
    requests.post("https://hooks.slack.com/services/T000/B000/XXXX", json={"text": note}, timeout=10)
    sys.stderr.write(note)


def label_rows(rows):
    # The model's labels are written to an internal table the team queries.
    labels = []
    for row in rows:
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "One word label for: " + row["title"]}],
        )
        labels.append(r.choices[0].message.content)
    json.dump(labels, open("scripts/out/labels.json", "w"))


# Routes that call no model.
@app.get("/health")
def health():
    return {"ok": True}


@app.get("/posts")
def posts(db):
    rows = db.execute(text("select id, title from posts"))
    return [dict(r) for r in rows]


@app.post("/survey")
def survey(body: dict, db):
    # A survey table with a create method is not the Responses API.
    row = db.responses.create(survey_id=body["survey_id"], answers=body["answers"])
    return {"id": row.id}


if __name__ == "__main__":
    main()
