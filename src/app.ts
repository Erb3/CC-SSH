// CC-SSH
// Mozilla public license 2.0 - Erb3

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import {
  Server as SSHServer,
  Session as SSHSession,
  SessionAccept,
  SessionAcceptReject,
} from "ssh2";
import { Authenticator } from "./auth";
import { CCWS } from "./ccws";
import { Computer } from "./computer";
import { inspect } from "util";
import { Session } from "./session";
import { ComputerWithUser } from "./types";
import assert from "assert";

async function run() {
  const prisma = new PrismaClient({
    log: ["info", "query"],
    errorFormat: "pretty",
  });

  await prisma.$connect();
  console.log(
    "Successfully connected to database. Starting virtual SSH server."
  );

  const auth = new Authenticator(prisma);
  const computers: { [id: string]: Computer } = {};
  const ccws = new CCWS(prisma, computers);

  new SSHServer(
    {
      hostKeys: [readFileSync("./host.key")],
      banner: "CC-SSH by Erb3",
      ident: "CC-SSH-by-Erb3",
      // debug: console.debug,
    },

    async (client) => {
      let computer: ComputerWithUser | null = null;
      console.log(`Client connected.`);

      client.on("authentication", async (ctx) => {
        computer = await auth.onAuth(ctx);
      });

      client.on("ready", () => {
        console.log("SSH connection ready");

        client.once("session", (accept, reject) => {
          assert(computer);
          new Session(accept, computer);
        });
      });

      client.on("close", () => {
        console.log("Client closed :)");
      });

      client.on("error", (msg) => {
        console.log("Client error hehe ( skill issue )", msg.name, msg.message);
      });
    }
  ).listen(8009, "0.0.0.0", () => {
    console.log("SSH server running!");
  });
}

run();
