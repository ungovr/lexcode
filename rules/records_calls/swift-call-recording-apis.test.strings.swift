// lexcode-expect: 6
import Foundation

// Call and meeting recordings reached over HTTP, whichever client sends the request.
struct RecordingEndpoints {
    let accountSID: String

    func callRecordings(callSID: String) -> URL {
        URL(string: "https://api.twilio.com/2010-04-01/Accounts/\(accountSID)/Calls/\(callSID)/Recordings.json")!
    }

    func videoRoomForm(name: String) -> [URLQueryItem] {
        [URLQueryItem(name: "UniqueName", value: name),
         URLQueryItem(name: "RecordParticipantsOnConnect", value: "true")]
    }

    func zoomRecordings(meetingID: String) -> URL {
        URL(string: "https://api.zoom.us/v2/meetings/\(meetingID)/recordings")!
    }

    func userRecordings(session: URLSession) async throws -> Data {
        let (data, _) = try await session.data(from: URL(string: "https://api.zoom.us/v2/users/me/recordings")!)
        return data
    }

    let recallBots = URL(string: "https://us-east-1.recall.ai/api/v1/bot/")!
    let meetingBaaS = URL(string: "https://api.meetingbaas.com/bots")!
}
