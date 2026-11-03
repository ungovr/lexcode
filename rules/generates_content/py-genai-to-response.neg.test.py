# lexcode-expect: 0
# Model calls whose output stays with the team that runs them, and lookalikes that call no model.
import logging

from fastapi import FastAPI
from google import genai
from langchain_openai import ChatOpenAI
from sqlalchemy import text

app = FastAPI()
llm = ChatOpenAI(model="gpt-4o-mini")
client = genai.Client()
log = logging.getLogger("triage")


def main():
    # bin/triage.py: an engineer runs it and reads the terminal.
    out = llm.invoke("Group these support tickets by theme for the team meeting.")
    print(out.content)
    response = client.models.generate_content(model="gemini-2.5-flash", contents="List the three biggest risks in this roadmap.")
    with open("scripts/out/risks.md", "w") as fh:
        fh.write(response.text)
    log.info("risks: %s", response.text)


# Routes that call no model, and an invoke that is not LangChain.
class JobRunner:
    def invoke(self, name):
        return {"name": name, "ran": True}


@app.post("/jobs/{name}")
def run_job(name: str):
    return JobRunner().invoke(name)


@app.get("/pages/{page_id}")
def page(page_id: int, db):
    # Content a person wrote, which the app only reads back, is not generated content.
    row = db.execute(text("select body from pages where id = :id"), {"id": page_id}).first()
    return {"body": row[0]}


if __name__ == "__main__":
    main()
