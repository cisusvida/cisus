"use strict";
// Local, read-only photo server for /productos-preview. No storage writes or uploads.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
const files = new Map();
const argument = (name) => {
  const index = args.indexOf(`--${name}`);
  if (index < 0 || !args[index + 1])
    throw new Error(`Missing --${name} <path>`);
  return args[index + 1];
};
for (const name of ["felino", "delfin", "relieve"]) {
  files.set(`/${name}.png`, fs.readFileSync(argument(name)));
}
const pomosRoot = path.resolve(argument("pomos-root"));
for (const name of [
  "orbita",
  "boton",
  "canto",
  "encuentro",
  "brisa",
  "borde",
  "tallo",
]) {
  files.set(
    `/${name}.png`,
    fs.readFileSync(path.join(pomosRoot, "productos", `${name}.png`)),
  );
}
files.set(
  "/orbita-instalado.png",
  fs.readFileSync(path.join(pomosRoot, "escenas", "orbita-instalado.png")),
);
http
  .createServer((req, res) => {
    const bytes = files.get(req.url);
    if (req.method !== "GET" || !bytes) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    });
    res.end(bytes);
  })
  .listen(4301, "127.0.0.1", () =>
    console.log("Preview photos: http://localhost:4301 (local only)"),
  );
