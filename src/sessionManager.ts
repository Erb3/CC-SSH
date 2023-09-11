import { Session as SSHSession, ServerChannel } from "ssh2";
import termkit from "terminal-kit";
import { Computer } from "./computer";
import { ComputerWithUser } from "./types";
import assert from "assert";

declare module "ssh2" {
  interface ServerChannel {
    rows: number;
    columns: number;
  }
}

class SessionManager {
  computers: Map<string, Computer> = new Map<string, Computer>();
  constructor() {}

  async newSession(accept: Function, dbComputer: ComputerWithUser) {
    let rows: number = 24;
    let cols: number = 80;
    let stream: ServerChannel | undefined;
    const session: SSHSession = accept();

    session
      .on("pty", (accept, reject, info) => {
        rows = info.rows;
        cols = info.cols;

        accept && accept();
      })
      .on("window-change", (accept, reject, info) => {
        rows = info.rows;
        cols = info.cols;

        if (stream) {
          stream.rows = info.rows;
          stream.columns = info.cols;
          stream.emit("resize");
        }

        accept && accept();
      })
      .on("shell", async (accept, reject) => {
        console.log("Shell requested");
        stream = accept();
        stream.rows = rows;
        stream.columns = cols;

        const term = termkit.createTerminal({
          stdin: stream.stdin,
          stderr: stream.stderr,
          stdout: stream.stdout,
          appId: "CC-SSH",
          appName: "CC-SSH",
          generic: "ansi",
          isSSH: true,
          isTTY: true,
        });

        const spinner = await term.spinner("unboxing-color");
        spinner.animate(7);
        term.green(` Connecting to ${dbComputer.id}\n\r`);
        term.grabInput(true);

        const computer = this.computers.get(dbComputer.id);
        console.log("Attempting to ping computer");
        if (await computer?.ping()) {
          console.log("Computer is online!");
          assert(computer);
          term.green(`Connected to ${dbComputer.id}!\n\r`);
          spinner.animate(false);
        } else {
          console.log("Not online", computer);
          term.red(`Unable to connect to ${dbComputer.id}! Is it loaded?\n\r`);
          spinner.animate(false);
          stream?.close();
        }

        term.on("key", (key: string, _: any, _a: any) => {
          switch (key) {
            case "CTRL_C": {
              term.red("Terminated. Detaching from CC and exiting.\n\r");
              spinner.animate(false);
              stream?.close();
              break;
            }
          }
        });
      });
  }
}

export { SessionManager };
