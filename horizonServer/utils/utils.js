import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const EXTRACT_MAX_FILES = 1000;
const EXTRACT_MAX_SIZE = 100000000;
const EXTRACT_THRESHOLD_RATIO = 10;

export async function extractFile({ origin, destiny }) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(origin);
  zip.extractAllTo(/*target path*/ destiny, /*overwrite*/ true);
  return true;
}
