const WebSocket = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let clients = {};

wss.on("connection", (ws) => {
  console.log("Novo cliente conectado");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    switch (data.type) {
      case "login":
        clients[data.name] = ws;
        ws.name = data.name;
        console.log(`Usuário logado: ${data.name}`);
        break;

      case "offer":
      case "answer":
      case "candidate":
        if (clients[data.to]) {
          clients[data.to].send(JSON.stringify(data));
        }
        break;

      case "leave":
        if (clients[data.to]) {
          clients[data.to].send(JSON.stringify({ type: "leave" }));
        }
        break;
    }
  });

  ws.on("close", () => {
    console.log("Cliente saiu:", ws.name);
    delete clients[ws.name];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor de sinalização rodando na porta ${PORT}`));
