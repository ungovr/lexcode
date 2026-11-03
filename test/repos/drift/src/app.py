import llm
import whisper


def run(model, path, feed):
    whisper.load_model("base")
    llm.complete("hello")
    model.fit(path)
    feed.publish(path)
