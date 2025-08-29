// ---------------- CONFIGURAÇÃO ----------------
const signalingServer = new WebSocket("https://github.com/AdenilzaDiniz/clinica-online.git");
let localStream, peerConnection;
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

let currentUser = "";
let targetUser = "";

// ---------------- LOGIN ----------------
signalingServer.onmessage = async (msg) => {
  const data = JSON.parse(msg.data);

  switch (data.type) {
    case "offer":
      await handleOffer(data.offer, data.from);
      break;
    case "answer":
      await handleAnswer(data.answer);
      break;
    case "candidate":
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
      break;
    case "leave":
      endCall();
      break;
  }
};

// Enviar mensagem ao servidor
function send(message) {
  signalingServer.send(JSON.stringify({ ...message, from: currentUser }));
}

// ---------------- VÍDEO CHAMADA ----------------
async function startCall() {
  currentUser = localStorage.getItem("currentUser");
  targetUser = prompt("Digite o usuário com quem deseja iniciar a chamada:");

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;

  peerConnection = new RTCPeerConnection(servers);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      send({ type: "candidate", candidate: event.candidate, to: targetUser });
    }
  };

  peerConnection.ontrack = (event) => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  send({ type: "offer", offer, to: targetUser });
}

async function handleOffer(offer, from) {
  targetUser = from;

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;

  peerConnection = new RTCPeerConnection(servers);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      send({ type: "candidate", candidate: event.candidate, to: targetUser });
    }
  };

  peerConnection.ontrack = (event) => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  send({ type: "answer", answer, to: targetUser });
}

async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

function endCall() {
  send({ type: "leave", to: targetUser });
  if (localStream) localStream.getTracks().forEach(track => track.stop());
  if (peerConnection) peerConnection.close();
  document.getElementById("localVideo").srcObject = null;
  document.getElementById("remoteVideo").srcObject = null;
  peerConnection = null;
  targetUser = "";
}

