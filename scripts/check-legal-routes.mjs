#!/usr/bin/env node
/**
 * P3-08: the legal texts are linked from the footer, the request form and the technician form by the addresses of `LEGAL_PATHS`
 * (lib/shared/legal.ts). This script fails when one of those addresses has no page, when a page shows the other text or does not export its
 * metadata (the draft is kept out of the search engines there), when the footer, the request form or the technician form stop pointing to the
 * texts, when the places where the draft/reviewed answer reaches the visitor lose it, or when a link in the code goes nowhere (href="#",
 * href="", href="javascript:...", an anchor that is not on the page, an address that is not a page of the site).
 *
 * It reads the code with its comments taken out (a link in a comment is not a link). It is a check of the shape of the code, not a test of the
 * pages: the behaviour is in the tests of the shared package and in the browser.
 *
 * Run: npm run check:legal
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const problems = [];

/** The code of a file without its comments, line breaks kept (so that a line number is still the line of the file). */
function withoutComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (found) => found.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function read(file) {
  return withoutComments(readFileSync(join(root, file), 'utf8'));
}

/** A file of the website, or a problem when it is not there. */
function source(file) {
  if (!existsSync(join(root, file))) {
    problems.push(`${file}: not found`);

    return '';
  }

  return read(file);
}

const shared = read('lib/shared/legal.ts');
const block = shared.match(/export const LEGAL_PATHS[^=]*=\s*\{([^}]*)\}/);

if (!block) {
  console.error('check-legal: LEGAL_PATHS not found in lib/shared/legal.ts');
  process.exit(1);
}

const paths = Object.fromEntries([...block[1].matchAll(/(\w+)\s*:\s*'([^']+)'/g)].map((found) => [found[1], found[2]]));

if (Object.keys(paths).length < 2) problems.push(`LEGAL_PATHS has ${Object.keys(paths).length} entries, expected terms and privacy`);

for (const [document, path] of Object.entries(paths)) {
  const file = join('app', path.replace(/^\//, ''), 'page.tsx');

  if (!existsSync(join(root, file))) {
    problems.push(`${path}: no page (${file})`);
    continue;
  }

  const code = read(file);

  if (!new RegExp(`return\\s*\\(?\\s*<LegalDocumentPage\\s+document="${document}"\\s*/>`).test(code)) problems.push(`${path}: the page does not show the ${document} text (<LegalDocumentPage document="${document}" />)`);
  if (!code.includes(`legalMetadata("${document}")`)) problems.push(`${path}: the page does not take its metadata (title, robots) from legalMetadata("${document}")`);
  // Importing legalMetadata is not enough: Next only reads it when the page exports generateMetadata (or metadata).
  if (!/export\s+(?:async\s+)?function\s+generateMetadata\b/.test(code) && !/export\s+const\s+metadata\b/.test(code)) {
    problems.push(`${path}: the page does not export generateMetadata, so its metadata (and the noindex of a draft) is never used`);
  }
}

// The places that must keep pointing to the texts: the footer (by the address), the request form (the consent line and the notices) and the technician form.
const home = source('app/page.tsx');

for (const document of Object.keys(paths)) {
  if (!new RegExp(`href=\\{\\s*LEGAL_PATHS\\.${document}\\s*\\}`).test(home)) problems.push(`app/page.tsx: the footer does not link to LEGAL_PATHS.${document}`);
}

const wizard = source('components/guest/request-wizard.tsx');

if (!wizard.includes('id="guest-consent"')) problems.push('components/guest/request-wizard.tsx: the consent line (id="guest-consent") is gone from the request form');
if (!/consentParts\(/.test(wizard)) problems.push('components/guest/request-wizard.tsx: the consent line is no longer cut into text and links (consentParts)');
// The consent line links to both texts (the kind of each link comes from consentParts), and each notice offers the privacy text.
if (!/<LegalLink\b[^>]*document=\{part\.kind\}/.test(wizard)) problems.push('components/guest/request-wizard.tsx: the consent line no longer links to the terms and the privacy text (LegalLink document={part.kind})');

for (const notice of ['place', 'phone']) {
  if (!new RegExp(`notice\\.${notice}"\\)\\}\\s*<LegalLink\\b`).test(wizard)) problems.push(`components/guest/request-wizard.tsx: the ${notice} notice no longer offers the privacy text (LegalLink)`);
}

// The answer "reviewed or not" must reach the line of the form: it informs while the texts are a draft and accepts once they are reviewed.
if (!/legalSetStatus\(\)\.reviewed\s*\?\s*\("consent\.line" as const\)\s*:\s*\("consent\.informLine" as const\)/.test(wizard)) {
  problems.push('components/guest/request-wizard.tsx: the consent line is no longer chosen by legalSetStatus().reviewed ("consent.line" once reviewed, "consent.informLine" while a draft)');
}

// The fields point to their notices, and the ids they point to exist.
for (const [field, ids] of [['guest-address', ['guest-address-notice']], ['guest-phone', ['guest-phone-help', 'guest-phone-notice']]]) {
  const described = new RegExp(`id="${field}"[\\s\\S]{0,900}?aria-describedby="([^"]*)"`).exec(wizard);

  if (!described) {
    problems.push(`components/guest/request-wizard.tsx: the field ${field} is not described (aria-describedby)`);
    continue;
  }

  for (const id of ids) {
    if (!described[1].split(/\s+/).includes(id)) problems.push(`components/guest/request-wizard.tsx: the field ${field} no longer points to #${id}`);
    if (!wizard.includes(`id="${id}"`)) problems.push(`components/guest/request-wizard.tsx: #${id} is not on the page`);
  }
}

const document_ = source('components/legal-document.tsx');

if (!/robots:\s*legalRobots\(/.test(document_)) problems.push('components/legal-document.tsx: the metadata no longer carries robots: legalRobots(...), so a draft would be indexed');
if (!/!status\.reviewed\s*&&/.test(document_)) problems.push('components/legal-document.tsx: the draft notice is no longer shown only while the texts are not reviewed (!status.reviewed &&)');
if (!/legalVersionText\([^)]*status\.reviewed\s*\)/.test(document_)) problems.push('components/legal-document.tsx: the version line no longer depends on status.reviewed (a draft would show a version)');

const join_ = source('app/rejoindre/page.tsx');

if (!/<LegalLink\b/.test(join_) || !join_.includes('form.privacyLine')) problems.push('app/rejoindre/page.tsx: the technician form no longer shows its privacy line with a link');

// ---------------------------------------------------------------------------------------------------------------------------------------
// Links that go nowhere
// ---------------------------------------------------------------------------------------------------------------------------------------

/** Every file under a folder with one of the extensions (the copy of the shared package is not the website's code). */
function walk(folder, found = []) {
  for (const name of readdirSync(folder)) {
    const file = join(folder, name);

    if (name === 'node_modules' || name === '.next') continue;
    if (relative(root, file).split(sep).join('/') === 'lib/shared') continue;
    if (statSync(file).isDirectory()) walk(file, found);
    else if (/\.(tsx?|jsx?)$/.test(name)) found.push(file);
  }

  return found;
}

/** The addresses of the pages of the site, from the folders of `app` that hold a page (a dynamic folder matches anything, a route group is not part of the address). */
const routes = walk(join(root, 'app'))
  .filter((file) => /(^|[\\/])page\.(tsx?|jsx?)$/.test(file))
  .map((file) =>
    '/' +
    relative(join(root, 'app'), file)
      .split(sep)
      .slice(0, -1)
      .filter((part) => !/^\(.*\)$/.test(part))
      .map((part) => (/^\[.*\]$/.test(part) ? '[^/]+' : part))
      .join('/'),
  )
  .map((route) => new RegExp(`^${route.replace(/\/$/, '') || '/'}/?$`));

const knownPage = (address) => routes.some((route) => route.test(address.length > 1 ? address.replace(/\/$/, '') : address));

/** Every id written out in the code of the site (an anchor may point to a heading of another component of the same page). */
const ids = new Set();

for (const folder of ['app', 'components']) {
  for (const file of walk(join(root, folder))) {
    for (const found of withoutComments(readFileSync(file, 'utf8')).matchAll(/\bid=\{?\s*["'`]([^"'`$]+)["'`]/g)) ids.add(found[1]);
  }
}

const DEAD = /href\s*[:=]\s*\{?\s*["'`](?:#|javascript:[^"'`]*|)["'`]\s*\}?/;
const LITERAL = /href\s*=\s*\{?\s*["']([^"'{}]*)["']\s*\}?/g;

for (const folder of ['app', 'components', 'lib']) {
  for (const file of walk(join(root, folder))) {
    const code = withoutComments(readFileSync(file, 'utf8'));
    const name = relative(root, file).split(sep).join('/');

    code.split('\n').forEach((line, index) => {
      // href="#", href="", href="javascript:...", href={"#"}, href={'#'}, href={``}, { href: "#" }: a link that goes nowhere ("#section" is an anchor)
      if (DEAD.test(line)) problems.push(`${name}:${index + 1}: a link that goes nowhere (href="#", href="" or javascript:)`);
      // a link without an address
      if (/<(?:a|Link)\s*>/.test(line)) problems.push(`${name}:${index + 1}: a link with no href`);

      for (const found of line.matchAll(LITERAL)) {
        const address = found[1];

        if (address.startsWith('#') && address.length > 1) {
          if (!ids.has(address.slice(1))) problems.push(`${name}:${index + 1}: the anchor ${address} points to nothing (no id="${address.slice(1)}" in the code of the site)`);
        } else if (address.startsWith('/') && !address.startsWith('//')) {
          const page = address.split(/[?#]/)[0] || '/';

          if (!knownPage(page)) problems.push(`${name}:${index + 1}: ${address} is not a page of the site`);
        }
      }
    });
  }
}

if (problems.length > 0) {
  console.error(`check-legal: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

console.log(`check-legal: ${Object.values(paths).join(' and ')} have their pages; the footer, the forms and the draft gate are wired; no link goes nowhere.`);
