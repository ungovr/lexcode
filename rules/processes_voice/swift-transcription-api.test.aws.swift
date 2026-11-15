// lexcode-expect: 7
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

    func dictatedNote(name: String, bucket: String) async throws {
        _ = try await client.startMedicalTranscriptionJob(input: StartMedicalTranscriptionJobInput(medicalTranscriptionJobName: name, outputBucketName: bucket))
    }

    func clinicalNote(name: String, uri: String) async throws {
        _ = try await client.startMedicalScribeJob(input: StartMedicalScribeJobInput(medicalScribeJobName: name))
    }

    // Call Analytics: a call between an agent and a customer, transcribed.
    func analyzeCall(name: String) async throws {
        _ = try await client.startCallAnalyticsJob(input: StartCallAnalyticsJobInput(callAnalyticsJobName: name))
    }

    func live(audio: AsyncThrowingStream<TranscribeStreamingClientTypes.AudioStream, Error>) async throws {
        let output = try await streaming.startStreamTranscription(
            input: StartStreamTranscriptionInput(audioStream: audio, languageCode: .enUs, mediaEncoding: .pcm, mediaSampleRateHertz: 16_000)
        )
        print(output)
    }

    func liveClinical(audio: AsyncThrowingStream<TranscribeStreamingClientTypes.AudioStream, Error>) async throws {
        _ = try await streaming.startMedicalStreamTranscription(input: StartMedicalStreamTranscriptionInput(audioStream: audio, languageCode: .enUs))
    }

    func analyzeLiveCall(audio: AsyncThrowingStream<TranscribeStreamingClientTypes.AudioStream, Error>) async throws {
        _ = try await streaming
            .startCallAnalyticsStreamTranscription(input: StartCallAnalyticsStreamTranscriptionInput(audioStream: audio, languageCode: .enUs))
    }
}
