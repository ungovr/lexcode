# lexcode-expect: 4
from google import genai
from google.genai import types
from openai import AsyncOpenAI, OpenAI
from together import Together

client = OpenAI()
aclient = AsyncOpenAI()
gemini = genai.Client()
together = Together()


def start_fine_tune(training_file_id: str):
    # Hosted fine-tuning of a vendor model on data the app collected.
    job = client.fine_tuning.jobs.create(training_file=training_file_id, model="gpt-4o-mini-2024-07-18")
    return job.id


async def start_fine_tune_async(training_file_id: str):
    job = await aclient.fine_tuning.jobs.create(
        training_file=training_file_id,
        model="gpt-4.1-mini-2025-04-14",
        method={"type": "supervised"},
    )
    return job.id


def tune_gemini(dataset):
    tuned = gemini.tunings.tune(
        base_model="gemini-2.5-flash",
        training_dataset=dataset,
        config=types.CreateTuningJobConfig(epoch_count=3, tuned_model_display_name="support-tuned"),
    )
    return tuned.name


def tune_open_model(file_id: str):
    return together.fine_tuning.create(training_file=file_id, model="meta-llama/Meta-Llama-3.1-8B-Instruct-Reference")
