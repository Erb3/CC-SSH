import { PrismaClient } from "@prisma/client";
import { WebSocket } from "ws";

class Computer {
  private prisma: PrismaClient;
  private ws: WebSocket;
  isOnline: boolean;
  token: string;

  constructor(prisma: PrismaClient, ws: WebSocket, token: string) {
    this.prisma = prisma;
    this.ws = ws;
    this.isOnline = true;
    this.token = token;
  }
}

export { Computer };
