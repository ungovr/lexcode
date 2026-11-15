// lexcode-expect: 0
import Foundation

// The app's own methods with Rekognition's names, in a file without AWSRekognition: a card game
// that compares the faces of playing cards.
final class Deck {
    func compareFaces(input: (String, String)) -> Bool { input.0 == input.1 }
    func searchFaces(input: String) -> [String] { [input] }
    func indexFaces(input: [String]) {}
}

final class Game {
    let deck = Deck()

    func play() {
        _ = deck.compareFaces(input: ("king", "queen"))
        _ = deck.searchFaces(input: "jack")
        deck.indexFaces(input: ["ace"])
    }
}
