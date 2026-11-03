# lexcode-expect: 2
from setuptools import find_packages, setup

with open("README.md", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="feedlint",
    version="1.3.0",
    description="Checks an RSS feed for common publishing mistakes",
    long_description=long_description,
    url="https://example.org/feedlint",
    packages=find_packages(exclude=["tests"]),
    install_requires=["lxml>=5.0"],
)

import setuptools

setuptools.setup(
    entry_points={"console_scripts": ["feedlint-extras=feedlint_extras.cli:main"]},
    packages=["feedlint_extras"],
    name="feedlint-extras",
    version="0.2.0",
)
