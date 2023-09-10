import { Session as SSHSession, ServerChannel } from "ssh2";
import termkit from "terminal-kit";
import { Computer } from "./computer";
import { ComputerWithUser } from "./types";

declare module "ssh2" {
  interface ServerChannel {
    name: string;
    rows: number;
    columns: number;
    isTTY: boolean;
    setRawMode: Function;
  }
}

class Session {
  private rows: number = 24;
  private cols: number = 80;
  private termBrand: string = "ansi";
  private stream: ServerChannel | undefined;
  private computer: ComputerWithUser;

  constructor(accept: Function, computer: ComputerWithUser) {
    this.computer = computer;
    const session: SSHSession = accept();

    session
      .once("pty", (accept, reject, info) => {
        this.rows = info.rows;
        this.cols = info.cols;
        this.termBrand = info.term;

        accept && accept();
      })
      .on("window-change", (accept, reject, info) => {
        this.rows = info.rows;
        this.cols = info.cols;

        if (this.stream) {
          this.stream.rows = info.rows;
          this.stream.columns = info.cols;
          this.stream.emit("resize");
        }

        accept && accept();
      })
      .on("shell", async (accept, reject) => {
        console.log("Shell requested");
        this.stream = accept();

        this.stream.rows = this.rows;
        this.stream.columns = this.cols;

        const term = termkit.createTerminal({
          stdin: this.stream.stdin,
          stderr: this.stream.stderr,
          stdout: this.stream.stdout,
          appId: "CC-SSH",
          appName: "CC-SSH",
          generic: this.termBrand,
          isSSH: true,
          isTTY: true,
        });

        const spinner = await term.spinner("unboxing-color");
        spinner.animate(7);
        term.green(` Connecting to ${this.computer.id}\n\r`);

        term.grabInput(true);
        term.on("key", (key: string, _: any, _a: any) => {
          switch (key) {
            case "CTRL_C": {
              term.red("Terminated. Detaching from CC and exiting.\n\r");
              spinner.animate(false);
              this.stream?.close();
              break;
            }
          }
        });
      });
  }
}

export { Session };
