import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const EXTRACT_MAX_FILES = 1000
const EXTRACT_MAX_SIZE = 100000000
const EXTRACT_THRESHOLD_RATIO = 10

export async function extractFile ({ origin, destiny }) {
  const AdmZip = require('adm-zip')
  const zip = new AdmZip(origin)
  zip.extractAllTo(/* target path */ destiny, /* overwrite */ true)
  return true
}

export function hashCode (str) {
  let hash = 0
  let i, chr
  if (this.length === 0) return hash
  for (i = 0; i < this.length; i++) {
    chr = this.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}
