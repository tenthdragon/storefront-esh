import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const wranglerPath = path.join(cwd, 'wrangler.jsonc')

const args = parseArgs(process.argv.slice(2))
const storeSlug = args['store-slug']

if (!storeSlug) {
  fail(
    'Missing required flag: --store-slug\n' +
    'Example:\n' +
    'npm run bootstrap:store -- --store-slug army-alghifari --kv-id 1234567890abcdef1234567890abcdef',
  )
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(storeSlug)) {
  fail('`--store-slug` must use lowercase kebab-case, for example `army-alghifari`.')
}

const pagesProject = args['pages-project'] ?? `storefront-${storeSlug}`
const kvId = args['kv-id'] ?? 'your_kv_namespace_id'
const compatibilityDate = args['compatibility-date'] ?? getExistingCompatibilityDate(wranglerPath) ?? today()

const nextConfig = [
  '{',
  `  "name": "${pagesProject}",`,
  '  "pages_build_output_dir": "./dist",',
  `  "compatibility_date": "${compatibilityDate}",`,
  '  "kv_namespaces": [',
  '    {',
  '      "binding": "STOREFRONT_SETTINGS",',
  `      "id": "${kvId}"`,
  '    }',
  '  ]',
  '}',
  '',
].join('\n')

fs.writeFileSync(wranglerPath, nextConfig)

console.log(
  [
    'Store bootstrap complete.',
    '',
    `Store slug: ${storeSlug}`,
    `Pages project: ${pagesProject}`,
    `KV namespace id: ${kvId}`,
    `Compatibility date: ${compatibilityDate}`,
    '',
    'Next steps:',
    '1. Fill `.env` from `.env.example` with the new store credentials.',
    '2. Add Cloudflare Pages production variables and secrets for the new store.',
    '3. If the KV namespace is not created yet, replace `your_kv_namespace_id` later and commit the updated `wrangler.jsonc`.',
    '4. Push to `main` only after the new repo points to the correct GitHub remote and Cloudflare Pages project.',
  ].join('\n'),
)

function parseArgs(argv) {
  const values = {}

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue

    const key = token.slice(2)
    const next = argv[i + 1]

    if (!next || next.startsWith('--')) {
      values[key] = 'true'
      continue
    }

    values[key] = next
    i += 1
  }

  return values
}

function getExistingCompatibilityDate(filePath) {
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf8')
  const match = content.match(/"compatibility_date"\s*:\s*"([^"]+)"/)
  return match?.[1] ?? null
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
