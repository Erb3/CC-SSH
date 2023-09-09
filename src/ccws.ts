import { PrismaClient } from "@prisma/client";
import { Server, createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Computer } from "./computer";

class CCWS {
  wss: WebSocketServer;
  httpServer: Server;
  prisma: PrismaClient;
  computers: { [id: string]: Computer };

  constructor(prisma: PrismaClient, computers: { [id: string]: Computer }) {
    this.httpServer = createServer();
    this.prisma = prisma;
    this.computers = computers;

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
        this.computers[req.headers.authorization || "INTERNAL-SERVER-ERROR"] =
          new Computer(
            prisma,
            ws,
            req.headers.authorization || "INTERNAL-SERVER-ERROR"
          );
      });
    });

    this.httpServer.listen(8008, "0.0.0.0", () => {
      console.log("CC Websocket server started!");
    });
  }
}

export { CCWS };
