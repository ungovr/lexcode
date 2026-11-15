// lexcode-expect: 4
import AWSChimeSDKMediaPipelines
import AWSConnect
import AWSTranscribe
import AWSTranscribeStreaming

// Server-side Swift (a Lambda or Vapor handler) driving AWS call services.
struct ContactCenter {
    let pipelines: ChimeSDKMediaPipelinesClient
    let connect: ConnectClient
    let transcribe: TranscribeClient
    let streaming: TranscribeStreamingClient

    func captureMeeting(meetingArn: String, bucketArn: String) async throws {
        _ = try await pipelines.createMediaCapturePipeline(input: CreateMediaCapturePipelineInput(
            sinkArn: bucketArn,
            sinkType: .s3Bucket,
            sourceArn: meetingArn,
            sourceType: .chimesdkMeeting
        ))
    }

    func recordContact(instanceId: String, contactId: String) async throws {
        _ = try await connect.startContactRecording(input: StartContactRecordingInput(
            contactId: contactId, initialContactId: contactId, instanceId: instanceId,
            voiceRecordingConfiguration: ConnectClientTypes.VoiceRecordingConfiguration(voiceRecordingTrack: .all)
        ))
    }

    func analyzeCall(name: String, uri: String) async throws {
        _ = try await transcribe.startCallAnalyticsJob(input: StartCallAnalyticsJobInput(callAnalyticsJobName: name))
    }

    func analyzeLiveCall(audio: AsyncThrowingStream<TranscribeStreamingClientTypes.AudioStream, Error>) async throws {
        _ = try await streaming
            .startCallAnalyticsStreamTranscription(input: StartCallAnalyticsStreamTranscriptionInput(audioStream: audio, languageCode: .enUs))
    }
}
