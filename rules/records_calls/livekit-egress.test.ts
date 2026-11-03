// lexcode-expect: 3
// Recording a LiveKit room with the server SDK: egress writes the call to a file.
import { EgressClient, EncodedFileOutput, EncodedFileType } from 'livekit-server-sdk';

const egress = new EgressClient(process.env.LIVEKIT_URL!, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

export async function recordRoom(roomName: string): Promise<string> {
  const output = new EncodedFileOutput({ fileType: EncodedFileType.MP4, filepath: `calls/${roomName}.mp4` });
  const info = await egress.startRoomCompositeEgress(roomName, { file: output }, { layout: 'speaker' });
  return info.egressId;
}

export async function recordParticipant(roomName: string, identity: string): Promise<string> {
  const info = await egress.startParticipantEgress(roomName, identity, { file: { filepath: `calls/${identity}.mp4` } });
  return info.egressId;
}

export async function recordTracks(roomName: string, audioTrackId: string, videoTrackId: string): Promise<string> {
  const info = await egress.startTrackCompositeEgress(roomName, { file: { filepath: 'calls/composite.mp4' } }, {
    audioTrackId,
    videoTrackId,
  });
  return info.egressId;
}
