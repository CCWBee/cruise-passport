// Build a migration's dry run and run it against the live project, leaving nothing behind.
//
//   node supabase/tests/dryrun.mjs 0004          build, run, then check nothing persisted
//   node supabase/tests/dryrun.mjs 0004 --print  build only, print the SQL
//
// supabase/tests/<n>_*.dryrun.sql is one DO block with a `-- @migration` marker line; the migration
// supabase/migrations/<n>_*.sql is put there verbatim, between $mig$ tags, and EXECUTEd first, so
// what is tested is the file that will be applied and not a copy of it. The block ends by raising,
// which rolls the migration and every test row back together; the raised message is the result.
// Afterwards a read-only query confirms the migration's objects do not exist on the live project.
// Needs the Supabase CLI logged in (npx supabase), as docs/BACKEND_SETUP.md describes.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REF = 'qpmrfoglxohmjhjtvkac'
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const [n, flag] = process.argv.slice(2)
if (!/^\d{4}$/.test(n || '')) { console.error('usage: node supabase/tests/dryrun.mjs <nnnn> [--print]'); process.exit(2) }

const pick = (dir, suffix) => {
  const hit = readdirSync(dir).find((f) => f.startsWith(n + '_') && f.endsWith(suffix))
  if (!hit) { console.error(`no ${n}_*${suffix} in ${dir}`); process.exit(2) }
  return join(dir, hit)
}
const migration = readFileSync(pick(join(root, 'supabase', 'migrations'), '.sql'), 'utf8')
const template = readFileSync(pick(here, '.dryrun.sql'), 'utf8')
if (migration.includes('$mig$')) { console.error('the migration contains $mig$, which would end the quoting'); process.exit(2) }
if (!template.includes('-- @migration')) { console.error('the dry run has no -- @migration marker'); process.exit(2) }
// A function, not a string, as the replacement: a migration is full of `$'` and `$$`, which a
// replacement string reads as its own patterns.
const sql = template.replace('-- @migration', () => 'execute $mig$\n' + migration + '\n$mig$;')
if (flag === '--print') { process.stdout.write(sql); process.exit(0) }

const dir = mkdtempSync(join(tmpdir(), 'dryrun-'))
const run = (file) => {
  try {
    return { ok: true, out: execFileSync('npx', ['supabase', 'db', 'query', '--linked', '--project-ref', REF, '-f', file], { cwd: root, encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'pipe'] }) }
  } catch (e) {
    return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') }
  }
}

const built = join(dir, `${n}.dryrun.sql`)
writeFileSync(built, sql)
const result = run(built)
// The CLI reports the raise as an error, with the message JSON-escaped inside its own JSON, so the
// result line is found by its prefix rather than parsed.
const text = result.out.replace(/\\"/g, '"').replace(/\\n/g, '\n')
const verdict = text.match(/(DRYRUN \d{4} OK[^"\\]*|FAIL[^"\\]*)/)
console.log(verdict ? verdict[1].trim() : text.trim())

// Whatever the verdict, check the live project holds none of it. Each dry run names what its
// migration creates in supabase/tests/<n>_*.persisted.sql, one read-only select.
const check = readdirSync(here).find((f) => f.startsWith(n + '_') && f.endsWith('.persisted.sql'))
if (check) {
  const after = run(join(here, check))
  const rows = after.out.match(/"rows":\s*(\[[\s\S]*?\])/)
  console.log('after:', rows ? rows[1].replace(/\s+/g, ' ') : after.out.trim())
}
process.exit(verdict && verdict[1].startsWith('DRYRUN') ? 0 : 1)
