// lexcode-expect: 0
import Foundation
import MLX
import MLXNN
import MLXLLM
import MLXLMCommon

// Running a model someone else trained with MLX: loading a language model and generating text,
// and a forward pass of a network with its weights loaded from a file. No gradient step.
final class LocalModel {
    func answer(prompt: String) async throws -> String {
        let container = try await LLMModelFactory.shared.loadContainer(configuration: .init(id: "mlx-community/Qwen3-4B-4bit"))
        let session = ChatSession(container)
        return try await session.respond(to: prompt)
    }

    func forward(model: Module & UnaryLayer, x: MLXArray) -> MLXArray {
        let y = model(x)
        eval(y)
        return y
    }
}
