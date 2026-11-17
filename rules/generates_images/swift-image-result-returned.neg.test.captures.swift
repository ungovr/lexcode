// lexcode-expect: 0
// A function that waits for a completion closure with a capture list on a call that is not a model's: an
// app's own gallery client in a file that imports OpenAI.
import Foundation
import OpenAI

final class GalleryClient {
    func gallery(query: String, completion: @escaping (Result<URL, Error>) -> Void) {
        completion(.success(URL(fileURLWithPath: query)))
    }
}

final class GalleryService {
    let client = GalleryClient()

    func cover() -> URL? {
        let semaphore = DispatchSemaphore(value: 0)
        var url: URL?
        client.gallery(query: "cover") { [weak self, semaphore] result in
            if case .success(let found) = result { url = found }
            semaphore.signal()
        }
        semaphore.wait()
        return url
    }
}
