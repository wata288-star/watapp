// WebRTC接続を管理するユーティリティ

// 無料のSTUNサーバー（NAT越えに必要）
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const createPeerConnection = (
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onTrack: (stream: MediaStream) => void,
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
): RTCPeerConnection => {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      onTrack(event.streams[0]);
    }
  };

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => {
      onConnectionStateChange(pc.connectionState);
    };
  }

  return pc;
};

export const getUserMedia = async (
  video: boolean = true,
  audio: boolean = true
): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: video
        ? {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          }
        : false,
      audio: audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
          }
        : false,
    });
    return stream;
  } catch (error) {
    console.error("メディアデバイスへのアクセスに失敗:", error);
    throw error;
  }
};

export const createOffer = async (
  pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> => {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
};

export const createAnswer = async (
  pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> => {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
};
