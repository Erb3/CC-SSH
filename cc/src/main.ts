import * as event from "./event";

settings.define("ccssh.server", {
  type: "string",
  default: "ws://cat.pixium.lol:8008",
  description: "The CC-SSH WebSocket server",
});

settings.define("ccssh.secret", {
  type: "string",
  description: "The secret key to this computer on the CC-SSH network",
});

const server = settings.get("ccssh.server");
const secret = settings.get("ccssh.secret");
const args = [...$vararg];

if ((!server && !args[0]) || (!secret && !args[1])) {
  throw error(
    "You most supply server URL (arg 1 or `ccssh.server`) and computer secret (arg 2 or `ccssh.secret`)"
  );
}

function centerWrite(text: string, additionalY?: number): void {
  term.setCursorPos(
    Math.floor(width / 2) - Math.floor(text.length / 2),
    Math.floor(height / 2) + (additionalY || 0)
  );
  term.write(text);
}

const [width, height] = term.getSize();
function render(bg: Color, status: string) {
  term.setCursorPos(0, 0);
  term.setBackgroundColor(bg);
  term.setTextColor(colors.white);
  term.clear();
  centerWrite("CC-SSH");
  centerWrite(status, 1);
}

render(colors.blue, "Connecting...");

const headers = new LuaMap<string, string>();
headers.set("Authorization", secret);
const [ws, err] = http.websocket(server, headers);

if (typeof ws === "boolean") {
  throw error(`Unable to connect to the server! ${err}`);
}

sleep(1);
render(colors.orange, "Idle");

while (true) {
  const msg = ws.receive();
  const data = textutils.unserialiseJSON(msg);

  print("Received packet", msg);
}
