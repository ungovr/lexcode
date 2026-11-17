// lexcode-expect: 2
// A picture's address returned from a function that waits for a completion closure whose capture list is
// not exactly `[weak self]`: one capture of another kind, or two captures.
import Foundation
import OpenAI

final class PictureService {
    let openAI = OpenAI(apiToken: "token")

    func paint(_ query: ImagesQuery) -> URL? {
        var url: URL?
        openAI.images(query: query) { [unowned self] result in
            if case .success(let images) = result {
                url = URL(string: images.data.first?.url ?? "")
            }
        }
        return url
    }

    func paintAndWait(_ query: ImagesQuery) -> URL? {
        let semaphore = DispatchSemaphore(value: 0)
        var url: URL?
        openAI.imageVariations(query: query) { [weak self, semaphore] result in
            if case .success(let images) = result {
                url = URL(string: images.data.first?.url ?? "")
            }
            semaphore.signal()
        }
        semaphore.wait()
        return url
    }
}
