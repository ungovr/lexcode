// lexcode-expect: 3
import AWSTranscribe
import AWSTranscribeStreaming

// Amazon Transcribe through the AWS SDK for Swift, from a Vapor or Lambda handler.
struct TranscribeJobs {
    let client: TranscribeClient
    let streaming: TranscribeStreamingClient

    func submit(name: String, uri: String) async throws {
        _ = try await client.startTranscriptionJob(input: StartTranscriptionJobInput(
            languageCode: .enUs,
            media: TranscribeClientTypes.Media(mediaFileUri: uri),
            transcriptionJobName: name
        ))
    }

    func clinicalNote(name: String, uri: String) async throws {
        _ = try await client.startMedicalScribeJob(input: StartMedicalScribeJobInput(medicalScribeJobName: name))
    }

    func live(audio: AsyncThrowingStream<TranscribeStreamingClientTypes.AudioStream, Error>) async throws {
        let output = try await streaming.startStreamTranscription(
            input: StartStreamTranscriptionInput(audioStream: audio, languageCode: .enUs, mediaEncoding: .pcm, mediaSampleRateHertz: 16_000)
        )
        print(output)
    }
}
