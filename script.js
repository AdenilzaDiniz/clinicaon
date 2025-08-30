// ⚡ URL do servidor de sinalização no Render
const SERVER_URL = "wss://clinicaon.onrender.com";
const signalingServer = new WebSocket(SERVER_URL);

let localStream;
let peerConnection;

async function connect() {
  const username = document.getElementById("username").value;
  if (!username) {
    alert("Digite um nome de usuário!");
    return;
  }
  alert("Conectado como " + username);
}

async function startCall() {
  const target = document.getElementById("target").value;
  if (!target) {
    alert("Digite o nome de quem deseja chamar!");
    return;
  }

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById("localVideo").srcObject = localStream;

  peerConnection = new RTCPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  signalingServer.send(JSON.stringify({ type: "offer", offer, to: target }));
}

