// lexcode-expect: 3
import Foundation
import MLX
import MLXNN
import MLXOptimizers
import MLXLLM
import MLXLMCommon

// Training with MLX on the device: a gradient step that updates a network's weights, and a LoRA
// fine-tune of a language model on the app's own examples, awaited.
final class Trainer {
    func step(model: Module, x: MLXArray, y: MLXArray, loss: @escaping (Module, MLXArray, MLXArray) -> MLXArray) {
        let optimizer = SGD(learningRate: 0.1)
        let lossAndGrad = valueAndGrad(model: model, loss)
        let (_, grads) = lossAndGrad(model, x, y)
        optimizer.update(model: model, gradients: grads)
        eval(model, optimizer)
    }

    func fineTune(context: ModelContext, train: [String], valid: [String]) async throws {
        let optimizer = Adam(learningRate: 1e-5)
        try await Self.run {
            try LoRATrain.train(
                model: context.model, train: train, validate: valid, optimizer: optimizer,
                tokenizer: context.tokenizer,
                parameters: LoRATrain.Parameters()
            ) { progress in
                print(progress)
                return .more
            }
        }
    }

    static func run(_ body: @escaping () throws -> Void) async throws {
        try body()
    }
}
