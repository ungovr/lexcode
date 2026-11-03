# lexcode-expect: 2
# InsightFace with its recognition model: each detected face comes back with an
# embedding that can be compared with others.
import insightface
from insightface.app import FaceAnalysis

analysis = FaceAnalysis(name="buffalo_l", providers=["CUDAExecutionProvider"])
analysis.prepare(ctx_id=0)


def embeddings_for(image):
    return [face.normed_embedding for face in analysis.get(image)]


def embedding_qualified(image):
    app = insightface.app.FaceAnalysis(name="antelopev2")
    app.prepare(ctx_id=-1)
    return app.get(image)[0].embedding
