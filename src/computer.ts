import { PrismaClient } from "@prisma/client";
import { WebSocket } from "ws";

class Computer {
  private prisma: PrismaClient;
  private ws: WebSocket;
  isOnline: boolean;
  token: string;

  constructor(prisma: PrismaClient, ws: WebSocket, token: string) {
    console.log("New computer registered!");
    this.prisma = prisma;
    this.ws = ws;
    this.isOnline = true;
    this.token = token;

    this.ws.on("close", () => {
      console.log("Computer closed connection.");
      this.isOnline = false;
    });
  }

  async ping() {
    return new Promise<boolean>((resolve, reject) => {
      this.ws.once("ping", () => {
        return resolve(true);
      });

      setTimeout(() => {
        this.isOnline = false;
        resolve(false);
      }, 5000);
    });
  }
}

export { Computer };
