// lexcode-expect: 0
// Running a LiveKit room without recording it: tokens, room admin, and an egress
// that records a web page (a slide deck) rather than the people on the call.
import { AccessToken, EgressClient, RoomServiceClient } from 'livekit-server-sdk';

const rooms = new RoomServiceClient(process.env.LIVEKIT_URL!, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
const egress = new EgressClient(process.env.LIVEKIT_URL!, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

export async function joinToken(roomName: string, identity: string): Promise<string> {
  const token = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, { identity });
  token.addGrant({ roomJoin: true, room: roomName });
  return token.toJwt();
}

export async function closeRoom(roomName: string): Promise<void> {
  await rooms.deleteRoom(roomName);
}

export async function listParticipants(roomName: string): Promise<string[]> {
  const participants = await rooms.listParticipants(roomName);
  return participants.map((p) => p.identity);
}

export async function stopRecording(egressId: string): Promise<void> {
  await egress.stopEgress(egressId);
}

export async function captureSlideDeck(url: string): Promise<string> {
  const info = await egress.startWebEgress(url, { file: { filepath: 'slides/deck.mp4' } });
  return info.egressId;
}
