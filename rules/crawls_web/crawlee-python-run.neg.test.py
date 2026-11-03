# lexcode-expect: 0
import asyncio
import subprocess

import httpx


class TaskRunner:
    """Runs queued local jobs. Has a run method, and nothing to do with crawling."""

    def __init__(self):
        self.jobs = []

    def add_requests(self, jobs):
        self.jobs.extend(jobs)

    def run(self):
        for job in self.jobs:
            job()


runner = TaskRunner()
runner.add_requests([lambda: print("one")])
runner.run()


async def own_api(ids):
    # The project's own API on loopback, one call per id, with a built URL.
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        return [await client.get(f"/api/items/{i}") for i in ids]


def build():
    subprocess.run(["make", "build"], check=True)


asyncio.run(own_api([1, 2, 3]))
