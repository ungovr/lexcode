// lexcode-expect: 0
// A route-shaped call on an app's own types in a file that imports neither Vapor nor Hummingbird: a
// notification center's post and a key-value store's get.
import Foundation

final class EventBus {
    func post(_ name: String, payload: [String: String] = [:]) {}
}

final class Settings {
    func get(_ key: String) -> String? { nil }
}

func onboard(bus: EventBus, settings: Settings) {
    bus.post("register", payload: ["step": "1"])
    _ = settings.get("signup")
}
