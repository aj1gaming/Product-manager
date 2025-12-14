import fs from "fs";
import path from "path";

const filePath = path.resolve("app/data/bestsellerPositions.json");

export function readRankings() {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export function writeRankings(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
