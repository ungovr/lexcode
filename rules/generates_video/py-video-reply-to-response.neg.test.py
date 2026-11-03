# lexcode-expect: 0
# Video generation that only the team sees, and lookalikes that generate nothing.
import subprocess

from fastapi import FastAPI
from openai import OpenAI
from sqlalchemy.orm import Session

app = FastAPI()
client = OpenAI()


def main():
    # bin/render_teaser.py: a producer runs it by hand and opens the file.
    job = client.videos.create_and_poll(model="sora-2", prompt="Slow pan across a harbor at dawn")
    print("job", job.id, job.status)
    content = client.videos.download_content(job.id)
    with open("scripts/out/teaser.mp4", "wb") as fh:
        fh.write(content.read())


@app.post("/videos")
def register_video(body: dict, db: Session):
    # A video table with a create method is not the generation API.
    row = db.videos.create(title=body["title"], url=body["url"], owner_id=body["owner_id"])
    return {"id": row.id}


@app.post("/trim")
def trim(body: dict):
    # Trimming footage a person shot is not generating video.
    subprocess.run(["ffmpeg", "-ss", "3", "-t", "10", "-i", body["path"], "/tmp/trimmed.mp4"], check=True)
    return {"ok": True}


if __name__ == "__main__":
    main()
