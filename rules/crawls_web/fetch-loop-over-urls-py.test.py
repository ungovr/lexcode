# lexcode-expect: 5
import asyncio

import aiohttp
import httpx
import requests


def pull_pages(urls):
    pages = []
    for url in urls:
        reply = requests.get(url, timeout=10)
        pages.append(reply.text)
    return pages


def pull_all(urls):
    with httpx.Client() as client:
        return [client.get(u).text for u in urls]


async def pull_async(urls):
    async with aiohttp.ClientSession() as session:
        for link in urls:
            async with session.get(link) as resp:
                print(await resp.text())


async def pull_httpx(urls):
    async with httpx.AsyncClient() as client:
        return await asyncio.gather(*[client.get(u) for u in urls])


def head_each(urls):
    for u in urls:
        requests.head(u, allow_redirects=True)
