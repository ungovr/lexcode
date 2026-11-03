# lexcode-expect: 1
from setuptools import find_packages, setup

setup(
    name="shared-core",
    version="0.1.0",
    packages=find_packages(),
    install_requires=["asyncpg>=0.29.0"],
    python_requires=">=3.11",
    description="Helpers shared by the services in this repository",
)
