// lexcode-expect: 2
import AWSChimeSDKMediaPipelines
import AWSConnect

// Server-side Swift (a Lambda or Vapor handler) driving AWS call services.
struct ContactCenter {
    let pipelines: ChimeSDKMediaPipelinesClient
    let connect: ConnectClient

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
}
