// CC-SSH
// Mozilla public license 2.0 - Erb3 & Pixium

import { readFileSync } from "fs";
import { Server as SSHServer} from "ssh2";

const sshServer = new SSHServer({
    hostKeys: [
    ],
    
    banner: "CC-SSH by Pixium",
    ident: "CC-SSH-by-Pixium"
}, (client) => {
    console.log(`Client connected.`);

    client.on("authentication", (ctx) => {
        ctx.accept();
    }).on("ready", () => {
        client.once("session", (accept, reject) => {
            accept().once("pty", (accept: any, reject: any, info: any) => {
                accept && accept();
            }).once("shell", (accept:any, reject:any) => {
                accept();
            });
        });
    })

}).listen(8009, "0.0.0.0", () => {
    console.log("SSH server running!")
});