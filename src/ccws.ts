import { PrismaClient } from "@prisma/client";
import { Server, createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Computer } from "./computer";
import { SessionManager } from "./sessionManager";

class CCWS {
  wss: WebSocketServer;
  httpServer: Server;
  prisma: PrismaClient;
  sessionManager: SessionManager;

  constructor(prisma: PrismaClient, sessionManager: SessionManager) {
    this.httpServer = createServer();
    this.prisma = prisma;
    this.sessionManager = sessionManager;

    this.wss = new WebSocketServer({
      noServer: true,
    });

    this.httpServer.on("upgrade", async (req, socket, head) => {
      socket.on("error", (err) => console.error(err));
      if (!req.headers.authorization) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const computer = await this.prisma.computer.findUnique({
        where: {
          secret: req.headers.authorization,
        },
      });

      if (!computer || computer.secret !== req.headers.authorization) {
        socket.write("HTTP/1.1 498 Token expired/invalid\r\n\r\n");
        socket.destroy();
        return;
      }

      socket.removeAllListeners("error");

      this.wss.handleUpgrade(req, socket, head, (ws) => {
        this.wss.emit("connection", ws, req);
        console.log("Computers", this.sessionManager.computers);

        this.sessionManager.computers.set(
          computer.id,
          new Computer(
            prisma,
            ws,
            req.headers.authorization || "INTERNAL-SERVER-ERROR"
          )
        );
      });
    });

    this.httpServer.listen(8008, "0.0.0.0", () => {
      console.log("CC Websocket server started!");
    });
  }
}

export { CCWS };
