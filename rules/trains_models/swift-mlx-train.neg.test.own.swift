// lexcode-expect: 0
import Foundation

// The app's own names, in a file that imports none of MLX's modules: a settings store that
// "updates" a model object with changed fields, and a training-plan screen for a fitness app.
final class Store {
    func update(model: [String: String], gradients: [String: String]) {}
}

enum LoRATrain {
    static func train(model: String, train: [String], validate: [String], optimizer: String) throws {}
}

func valueAndGrad(model: String, _ f: (String) -> Int) -> Int { f(model) }

final class Screen {
    func save(store: Store) throws {
        store.update(model: ["name": "x"], gradients: [:])
        try LoRATrain.train(model: "plan", train: [], validate: [], optimizer: "steady")
        _ = valueAndGrad(model: "plan") { $0.count }
    }
}
