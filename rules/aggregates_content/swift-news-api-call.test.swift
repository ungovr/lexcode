// lexcode-expect: 4
import Foundation
import Vapor

/// A digest that pulls headlines from news APIs.
struct NewsService {
    let apiKey: String

    func topHeadlines() async throws -> Data {
        let url = URL(string: "https://newsapi.org/v2/top-headlines?country=us&apiKey=\(apiKey)")!
        return try await URLSession.shared.data(from: url).0
    }

    func guardian(query: String) async throws -> Data {
        var components = URLComponents(string: "https://content.guardianapis.com/search")!
        components.queryItems = [URLQueryItem(name: "q", value: query)]
        return try await URLSession.shared.data(from: components.url!).0
    }

    static let topStories = "https://api.nytimes.com/svc/topstories/v2/home.json"

    func server(req: Request) async throws -> ClientResponse {
        try await req.client.get(
            URI(string: "https://gnews.io/api/v4/top-headlines?lang=en")
        )
    }
}
