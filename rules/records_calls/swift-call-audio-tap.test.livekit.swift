// lexcode-expect: 2
import AVFoundation
import LiveKit

// A LiveKit room participant's audio handed to the app's own renderer.
final class RemoteAudioCapture: NSObject, AudioRenderer, RoomDelegate {
    func room(_ room: Room, participant: RemoteParticipant, didSubscribeTrack publication: RemoteTrackPublication) {
        guard let track = publication.track as? RemoteAudioTrack else { return }
        track.add(audioRenderer: self)
    }

    func attach(to publication: RemoteTrackPublication) async throws {
        try await publication.set(subscribed: true)
        guard let track = publication.track as? RemoteAudioTrack else { return }
        await track.add(audioRenderer: self)
    }

    func render(pcmBuffer: AVAudioPCMBuffer) {
        print(pcmBuffer.frameLength)
    }
}
