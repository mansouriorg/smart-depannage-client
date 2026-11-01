#!/usr/bin/env node
/**
 * check-i18n (P3-04): fails when French text is left in the code of the website.
 *
 * Every sentence a visitor can read must come from the message catalogue (shared package, namespace `website`),
 * so that it exists in Arabic too. This script reads app/**, components/** and lib/** (not lib/shared, which is a
 * generated copy of the shared package) and reports, with file:line, every string literal, template literal part
 * and JSX text that
 *   - contains an accented French letter (é, è, à, ç, ô, ...), or
 *   - contains one of the common French UI words listed below.
 * Comments, import lines, console.* calls, regular expressions and the strings of the allowlist are ignored.
 * Class names, paths and URLs are not French (they have no accents and none of the words), so they pass by themselves.
 *
 * Usage:  node scripts/check-i18n.mjs            (exit 1 when something is found)
 *         node scripts/check-i18n.mjs --strict   (the physical-direction warnings below also fail)
 *
 * Second report (warning only, unless --strict): Tailwind classes that assume left-to-right (ml-, pr-, left-, text-right,
 * border-l, rounded-r ...). Use the logical ones (ms-, pe-, start-, text-end, border-s, rounded-e ...). A file or a line that
 * has a reason to keep a physical class says so with the comment `i18n-physical-ok: <reason>`.
 *
 * No dependencies; Node 18+.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCANNED = ['app', 'components', 'lib'];
const SKIPPED_DIRS = new Set(['node_modules', '.next', 'out', 'dist']);
const SKIPPED_PREFIXES = ['lib/shared/']; // generated copy of the shared package: it has its own catalogue and tests
const strict = process.argv.includes('--strict');

/** An accented letter or ligature of the French alphabet. */
const ACCENT = /[àâäçéèêëîïôöùûüÿœæÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸŒÆ]/u;

/**
 * Common French UI words (lower case). Only words that are not also English or code words, so that
 * an English identifier or message never trips the check. Accented words are caught by ACCENT anyway.
 */
const FRENCH_WORDS = new Set([
  'le', 'la', 'les', 'une', 'des', 'du', 'et', 'pour', 'avec', 'sans', 'dans', 'sur', 'vous', 'votre', 'vos', 'nous',
  'notre', 'est', 'sont', 'pas', 'cette', 'ces', 'merci', 'bonjour', 'retour', 'envoyer', 'annuler', 'continuer',
  'chargement', 'erreur', 'demande', 'demander', 'adresse', 'nom', 'passe', 'choisir', 'choisissez', 'enregistrer',
  'confirmer', 'oui', 'aucun', 'aucune', 'tous', 'toutes', 'tout', 'ici', 'lien', 'voir', 'ajouter', 'supprimer',
  'fermer', 'suivant', 'accueil', 'technicien', 'intervention', 'devis', 'paiement', 'facture', 'connexion', 'veuillez',
  'essayez', 'ouvrez', 'trop', 'ou', 'je', 'mon', 'mes', 'quelques', 'minutes', 'photos', 'photo', 'non',
]);
// "photo(s)" and "minutes" are French words too, but also English: they are only counted inside a longer French sentence (see below).
const AMBIGUOUS = new Set(['photo', 'photos', 'minutes', 'ou', 'nom', 'est', 'passe', 'trop', 'ici', 'tout', 'pas']);

/**
 * Text that is allowed to stay as it is in the code. Short on purpose; every entry says why.
 * `text`: the exact text (after trimming); `file`: optional, the entry only counts in that file.
 */
const ALLOWED = [
  { text: 'Smart-Dépannage', reason: 'the brand name is written the same in both languages' },
  { text: '© 2026 Smart-Dépannage.', reason: 'copyright line: brand name and year; identical in both languages (the catalogue test forbids two equal texts)' },
  { text: 'Le technicien est en retard.', file: 'lib/staff-text.ts', reason: 'text written FOR the staff dashboard (a customer report that the technician is late); the staff read French whatever the visitor language' },
];

/** The files that may keep physical-direction classes, with the reason (the same can be said in the file with `i18n-physical-ok`). */
const PHYSICAL_OK_FILES = [];

// ---------------------------------------------------------------------------------------------------------------------
// reading the files

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      out.push(join(dir, entry.name));
    }
  }
}

const files = [];
for (const dir of SCANNED) {
  try {
    walk(join(ROOT, dir), files);
  } catch {
    // a folder that does not exist (yet) is nothing to scan
  }
}
const relativeName = (file) => relative(ROOT, file).split(sep).join('/');
const toScan = files.filter((file) => !SKIPPED_PREFIXES.some((prefix) => relativeName(file).startsWith(prefix))).sort();

// ---------------------------------------------------------------------------------------------------------------------
// a small scanner: strings, template literals, comments and regular expressions out of TypeScript/TSX

const REGEX_AFTER = new Set(['(', ',', '=', '=>', ':', '[', '!', '&', '|', '?', '{', ';', '~', '^', '+', '-', '*', '%']);
const REGEX_AFTER_WORDS = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do']);

const ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };

function unescape(raw) {
  return raw.replace(/\\(u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|[\s\S])/g, (all, kind, braced, four, two) => {
    if (braced) return String.fromCodePoint(parseInt(braced, 16));
    if (four) return String.fromCharCode(parseInt(four, 16));
    if (two) return String.fromCharCode(parseInt(two, 16));
    return ESCAPES[kind] ?? kind;
  });
}

/**
 * Returns { texts, code }:
 *   texts: [{ line, text, kind: 'string' | 'template' }] for every string literal / template literal, console.* and import strings left out;
 *   code: the source with comments, strings, template text and regexes blanked out (newlines kept), for the JSX text pass.
 */
function scan(source) {
  const texts = [];
  const code = source.split('');
  const blank = (from, to) => {
    for (let k = from; k < to; k++) if (code[k] !== '\n') code[k] = ' ';
  };

  let i = 0;
  let line = 1;
  const stack = []; // 'b' = a { in code, 't' = a ${ in a template
  let previous = ''; // last significant character in code mode
  let previousWord = ''; // last identifier/keyword in code mode
  let parenDepth = 0;
  let consoleDepth = -1; // paren depth at which a console.xxx( call was opened, -1 = not inside one
  let wordBeforeParen = ''; // the word in front of the last ( : import( and require( take module names

  const startsWord = (c) => /[A-Za-z_$]/.test(c);

  function readTemplate(start) {
    // `start` is just after the opening backtick or after the closing } of a ${...}; reads until the next ${ or the closing backtick.
    // Returns { end, endsWith: 'tick' | 'expr', raw, startLine }.
    let j = start;
    let raw = '';
    const startLine = line;
    while (j < source.length) {
      const c = source[j];
      if (c === '\\') {
        raw += source.slice(j, j + 2);
        if (source[j + 1] === '\n') line++;
        j += 2;
        continue;
      }
      if (c === '`') return { end: j + 1, endsWith: 'tick', raw, startLine };
      if (c === '$' && source[j + 1] === '{') return { end: j + 2, endsWith: 'expr', raw, startLine };
      if (c === '\n') line++;
      raw += c;
      j++;
    }
    return { end: j, endsWith: 'tick', raw, startLine };
  }

  function takeTemplate(start) {
    let state = readTemplate(start);
    const parts = [state];
    blank(start, state.end - (state.endsWith === 'expr' ? 2 : 1));
    i = state.end;
    if (state.endsWith === 'expr') {
      stack.push('t');
    }
    return parts;
  }

  const record = (lineOf, text, kind) => {
    if (consoleDepth >= 0) return;
    texts.push({ line: lineOf, text, kind });
  };

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (c === '\n') {
      line++;
      i++;
      continue;
    }
    if (c === '/' && next === '/') {
      const end = source.indexOf('\n', i);
      const stop = end === -1 ? source.length : end;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      for (let k = i; k < stop; k++) if (source[k] === '\n') line++;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < source.length && source[j] !== c && source[j] !== '\n') {
        if (source[j] === '\\') j++;
        j++;
      }
      if (source[j] !== c) {
        // no closing quote on this line: an apostrophe inside JSX text, not a string
        i++;
        continue;
      }
      const raw = source.slice(i + 1, j);
      const isModule =
        previousWord === 'from' || previousWord === 'import' || (previous === '(' && (wordBeforeParen === 'import' || wordBeforeParen === 'require'));
      if (!isModule) record(line, unescape(raw), 'string');
      blank(i + 1, j);
      previous = c;
      previousWord = '';
      i = j + 1;
      continue;
    }
    if (c === '`') {
      const startLine = line;
      const parts = takeTemplate(i + 1);
      // A template with ${} is checked part by part, once all of its parts are read (see the closing brace below).
      pendingTemplates.push({ startLine, parts: [...parts], open: parts[parts.length - 1].endsWith === 'expr' });
      if (!pendingTemplates[pendingTemplates.length - 1].open) flushTemplate();
      previous = '`';
      previousWord = '';
      continue;
    }
    if (c === '/' ) {
      const isRegex =
        next !== '>' &&
        (previous === '' || REGEX_AFTER.has(previous) || REGEX_AFTER_WORDS.has(previousWord)) &&
        previous !== '<';
      if (isRegex) {
        let j = i + 1;
        let inClass = false;
        while (j < source.length && source[j] !== '\n') {
          if (source[j] === '\\') {
            j += 2;
            continue;
          }
          if (source[j] === '[') inClass = true;
          else if (source[j] === ']') inClass = false;
          else if (source[j] === '/' && !inClass) break;
          j++;
        }
        if (source[j] === '/') {
          j++;
          while (j < source.length && /[a-z]/.test(source[j])) j++;
          blank(i, j);
          i = j;
          previous = ')';
          previousWord = '';
          continue;
        }
      }
      previous = '/';
      previousWord = '';
      i++;
      continue;
    }
    if (c === '{') {
      stack.push('b');
      previous = '{';
      previousWord = '';
      i++;
      continue;
    }
    if (c === '}') {
      const top = stack.pop();
      if (top === 't') {
        // back into the template text
        const open = pendingTemplates[pendingTemplates.length - 1];
        const state = readTemplate(i + 1);
        blank(i + 1, state.end - (state.endsWith === 'expr' ? 2 : 1));
        open.parts.push(state);
        i = state.end;
        if (state.endsWith === 'expr') {
          stack.push('t');
        } else {
          open.open = false;
          flushTemplate();
        }
        previous = '`';
        previousWord = '';
        continue;
      }
      previous = '}';
      previousWord = '';
      i++;
      continue;
    }
    if (c === '(') {
      parenDepth++;
      wordBeforeParen = previousWord;
      previous = '(';
      previousWord = '';
      i++;
      continue;
    }
    if (c === ')') {
      parenDepth--;
      if (consoleDepth >= 0 && parenDepth < consoleDepth) consoleDepth = -1;
      previous = ')';
      previousWord = '';
      i++;
      continue;
    }
    if (startsWord(c)) {
      let j = i + 1;
      while (j < source.length && /[\w$]/.test(source[j])) j++;
      const word = source.slice(i, j);
      // console.log( / console.warn( ... : the whole call is for developers, not for visitors
      if (word === 'console' && source[j] === '.') {
        let k = j + 1;
        while (k < source.length && /[\w$]/.test(source[k])) k++;
        if (source[k] === '(' && consoleDepth < 0) {
          consoleDepth = parenDepth + 1;
        }
      }
      previousWord = word;
      previous = 'a';
      i = j;
      continue;
    }
    if (!/\s/.test(c)) {
      previous = c === '>' && source[i - 1] === '=' ? '=>' : c;
      previousWord = '';
    }
    i++;
  }

  function flushTemplate() {
    const done = pendingTemplates.pop();
    const text = done.parts.map((part) => unescape(part.raw)).join(' ');
    if (done.parts.some((part) => part.raw.length > 0)) record(done.startLine, text, 'template');
  }

  return { texts, code: code.join('') };
}

const pendingTemplates = [];

// ---------------------------------------------------------------------------------------------------------------------
// the rules

const ENTITIES = { apos: "'", quot: '"', amp: '&', nbsp: ' ', laquo: '«', raquo: '»', lt: '<', gt: '>', hellip: '…', rsquo: '’', lsquo: '‘' };
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (all, name) => {
    if (name[0] === '#') return String.fromCodePoint(name[1] === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10));
    if (name in ENTITIES) return ENTITIES[name];
    // &eacute; &agrave; ... name an accented letter: keep one so that ACCENT sees it
    return /^[a-zA-Z]+(acute|grave|circ|uml|cedil|lig)$/.test(name) ? 'é' : all;
  });
}

/** A token that is a class name, a path, a URL, an identifier with underscores...: lower case ASCII with a separator in it. */
const CODE_LIKE = /^(?=.*[-/:[\]=_#@])[a-z0-9\-/:[\]=_#@.%!&?,()*+'"]+$/;

function frenchIn(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  if (ACCENT.test(clean)) return 'accented letter';
  const words = clean
    .split(' ')
    .filter((token) => !CODE_LIKE.test(token))
    .flatMap((token) => token.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []);
  const found = words.filter((word) => FRENCH_WORDS.has(word));
  if (found.length === 0) return null;
  // an ambiguous word alone ("Photo", "minutes") is not proof; with another French word it is a sentence
  const sure = found.filter((word) => !AMBIGUOUS.has(word));
  if (sure.length > 0) return `French word "${sure[0]}"`;
  return found.length >= 2 ? `French words "${found.slice(0, 2).join(' ')}"` : null;
}

function allowed(text, file) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return ALLOWED.some((entry) => entry.text === clean && (!entry.file || entry.file === file));
}

const PHYSICAL = [
  /^-?[mp][lr]-/, // ml-2 mr-2 pl-2 pr-2 -ml-1
  /^-?(?:left|right)-/, // left-0 right-4 -right-5
  /^-?inset-[lr]-/,
  /^scroll-[mp][lr]-/,
  /^(?:text|float|clear)-(?:left|right)$/,
  /^border-[lr](?:-|$)/,
  /^rounded-(?:[lr]|tl|tr|bl|br)(?:-|$)/,
  /^space-x-/,
  /^origin-(?:left|right)$/,
  /^(?:slide-in-from|slide-out-to)-(?:left|right)/,
];

function physicalIn(text) {
  const found = [];
  for (const token of text.split(/\s+/)) {
    if (token.length < 3) continue;
    const parts = token.split(':');
    // `ltr:` / `rtl:` variants are deliberate
    if (parts.slice(0, -1).some((variant) => variant === 'ltr' || variant === 'rtl')) continue;
    if (PHYSICAL.some((rule) => rule.test(parts[parts.length - 1]))) found.push(token);
  }
  return found.length > 0 ? found.join(' ') : null;
}

// ---------------------------------------------------------------------------------------------------------------------
// the run

const problems = [];
const warnings = [];
let scannedLines = 0;

for (const file of toScan) {
  const name = relativeName(file);
  const source = readFileSync(file, 'utf8');
  scannedLines += source.split('\n').length;
  pendingTemplates.length = 0;
  const { texts, code } = scan(source);
  const lines = source.split('\n');
  const fileIsPhysicalOk = /i18n-physical-ok/.test(source.split('\n').slice(0, 12).join('\n')) || PHYSICAL_OK_FILES.includes(name);

  for (const { line, text, kind } of texts) {
    if (!allowed(text, name)) {
      const why = frenchIn(text);
      if (why) problems.push({ name, line, why, text: text.replace(/\s+/g, ' ').trim(), kind });
    }
    if (!fileIsPhysicalOk && !/i18n-physical-ok/.test(lines[line - 1] ?? '') && !/i18n-physical-ok/.test(lines[line - 2] ?? '')) {
      const token = physicalIn(text);
      if (token) warnings.push({ name, line, token });
    }
  }

  // JSX text: what stands between a tag's > and the next < or {, or between an expression's } and the next < or {
  const jsx = /(?<![=\-])>([^<>{}]*)(?=[<{])|\}([^<>{}]*)(?=[<{])/g;
  let match;
  while ((match = jsx.exec(code)) !== null) {
    const segment = match[1] ?? match[2] ?? '';
    const text = decodeEntities(segment);
    // code between two tags (a ; or an = or an arrow) is not text
    if (!/\p{L}/u.test(text) || /[;=]/.test(text) || allowed(text, name)) continue;
    const why = frenchIn(text);
    if (!why) continue;
    const firstText = match.index + 1 + Math.max(0, segment.search(/\S/));
    const line = code.slice(0, firstText).split('\n').length;
    problems.push({ name, line, why, text: text.replace(/\s+/g, ' ').trim(), kind: 'jsx text' });
  }
}

problems.sort((a, b) => (a.name === b.name ? a.line - b.line : a.name < b.name ? -1 : 1));

if (warnings.length > 0) {
  console.log(`Physical-direction classes (${warnings.length}) - use ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/e/rounded-s/e, or say why with "i18n-physical-ok":`);
  for (const warning of warnings) console.log(`  ${warning.name}:${warning.line}  ${warning.token}`);
  console.log('');
}

if (problems.length > 0) {
  console.error(`French text left in the code (${problems.length}) - move it to the catalogue (shared package, namespace "website"):`);
  for (const problem of problems) {
    const shown = problem.text.length > 90 ? `${problem.text.slice(0, 87)}...` : problem.text;
    console.error(`  ${problem.name}:${problem.line}  [${problem.kind}, ${problem.why}]  ${JSON.stringify(shown)}`);
  }
  process.exit(1);
}

if (strict && warnings.length > 0) {
  console.error('--strict: physical-direction classes found.');
  process.exit(1);
}

console.log(`check-i18n: ${toScan.length} files, ${scannedLines} lines: no French text left in the code.`);
