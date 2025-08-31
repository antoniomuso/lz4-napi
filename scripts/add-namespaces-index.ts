import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const file = readFileSync(fileURLToPath(join(import.meta.url, '..', '..', 'index.js')), 'utf-8')
const newFile = file.replaceAll(/require\(('|")(?!\.)([./a-zA-Z-0-9]+)('|")\)/g, "require('@antoniomuso/$2')")
writeFileSync(fileURLToPath(join(import.meta.url, '..', '..', 'index.js')), newFile)
