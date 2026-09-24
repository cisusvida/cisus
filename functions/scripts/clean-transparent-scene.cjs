#!/usr/bin/env node

"use strict";

const { resolve } = require("node:path");
const sharp = require("sharp");

async function cleanTransparentScene(inputPath, outputPath) {
  const source = sharp(inputPath).ensureAlpha();
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  function isBackground(index) {
    const offset = index * channels;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const alpha = data[offset + 3];
    const high = Math.max(red, green, blue);
    const low = Math.min(red, green, blue);
    return alpha < 12 || (high - low < 24 && high > 108);
  }

  function enqueue(index) {
    if (index < 0 || index >= visited.length || visited[index] || !isBackground(index)) return;
    visited[index] = 1;
    queue[tail++] = index;
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    enqueue(index - width);
    enqueue(index + width);
  }

  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index]) data[index * channels + 3] = 0;
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(outputPath);
}

async function main() {
  const [, , input, output] = process.argv;
  if (!input || !output) {
    throw new Error("Uso: node clean-transparent-scene.cjs <entrada> <salida.png>");
  }
  await cleanTransparentScene(resolve(input), resolve(output));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
