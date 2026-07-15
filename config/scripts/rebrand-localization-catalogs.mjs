import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..', '..')
const identity = JSON.parse(
  readFileSync(join(root, 'src', 'shared', 'product-identity.json'), 'utf8')
)
const localeDir = join(root, 'src', 'renderer', 'src', 'i18n', 'locales')
const localeNames = ['en', 'es', 'ja', 'ko', 'zh']
const structuredCopyPaths = [
  ...localeNames.map((localeName) => join(localeDir, `${localeName}.json`)),
  join(root, 'config', 'scripts', 'locale-ko-key-overrides.json')
]
const repositorySlug = `${identity.repository.owner}/${identity.repository.name}`
const repositoryUrl = `https://github.com/${repositorySlug}`

function rebrandString(value) {
  let result = value
    .replaceAll('https://github.com/stablyai/orca', repositoryUrl)
    .replaceAll('github.com/stablyai/orca', `github.com/${repositorySlug}`)
    .replace(/\bOrca\b/g, identity.displayName)
    .replace(/\borca:\/\//gi, `${identity.urlScheme}://`)
    .replace(/\borca-dev\b/g, identity.devCliCommand)
    .replace(/\borca-ide\b/g, identity.cliCommand)
    .replace(/\borca\.yaml\b/gi, `${identity.machineName}.yaml`)
    .replace(/\.orca\//g, `.${identity.machineName}/`)

  if (result.trim().toLowerCase() === identity.legacy.machineName) {
    result = identity.machineName
  }

  return result
}

function visit(value) {
  if (typeof value === 'string') {
    return rebrandString(value)
  }
  if (Array.isArray(value)) {
    return value.map(visit)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)]))
  }
  return value
}

for (const copyPath of structuredCopyPaths) {
  const catalog = JSON.parse(readFileSync(copyPath, 'utf8'))
  writeFileSync(copyPath, `${JSON.stringify(visit(catalog), null, 2)}\n`)
}
