// CC-SSH
// Mozilla public license 2.0 - Erb3

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import {
  Server as SSHServer,
  Session,
  SessionAccept,
  SessionAcceptReject,
} from "ssh2";
import { Authenticator } from "./auth";
import { CCWS } from "./ccws";
import { Computer } from "./computer";
import { inspect } from "util";

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
      console.log(`Client connected.`);

      client.on("authentication", async (ctx) => {
        await auth.onAuth(ctx);
      });

      client.on("ready", () => {
        console.log("SSH connection ready");

        client.once("session", (accept, reject) => {
          const session: Session = accept();

          session.on("pty", (accept, reject, info) => {
            accept();
          });

          session.on("shell", (accept, reject) => {
            const stream = accept();
            console.log("Shell requested");
            stream.write("Establishing connection with CC.\r\n");

            stream.on("data", (chunk: any) => {
              if (chunk.length === 1 && chunk[0] === 0x03) stream.end();

              console.log("Received data", chunk);
            });
          });

          session.on("exec", (accept, reject, info) => {
            console.log("SSH client wants to execute", inspect(info.command));
            const stream = accept();
            stream.write("Oh hi!\n");
            stream.exit(0);
            stream.end();
          });
        });
      });

      client.on("close", () => {
        console.log("Client closed :)");
      });

      client.on("error", (msg) => {
        console.log(
          "Client error hehe ( skill issue )",
          msg.message,
          msg.name,
          msg.stack
        );
      });
    }
  ).listen(8009, "0.0.0.0", () => {
    console.log("SSH server running!");
  });
}

run();
