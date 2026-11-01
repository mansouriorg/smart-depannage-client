This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Languages (P3-04)

The site speaks French and Arabic (Modern Standard Arabic, right to left). There is no language in the address: the same
pages answer in either language.

**How the language is chosen** (`i18n/request.ts`), in this order:

1. the `locale` cookie (`fr` or `ar`), written by the language switch in the top bar (`components/language-switch.tsx`,
   `lib/locale-cookie.ts`), which then refreshes the page;
2. otherwise the first language of the browser's `Accept-Language` header that the site knows (`bestLocaleOf`);
3. otherwise French.

`app/layout.tsx` sets `<html lang dir>` from it (`dir="rtl"` for Arabic) and loads Noto Sans Arabic next to Inter.
Every call to the API carries the same language in the `X-App-Locale` header (`lib/api.ts`), so the texts the server
writes (refusals, notifications, timeline) come back in the visitor's language. Pages read the cookie, so they are
rendered per request (not statically).

**Where the messages live.** Not in this repository: in the shared package (`smart-depannage-shared`), catalogue
`src/i18n/fr/` (the source) and `src/i18n/ar/`. The website owns the namespaces `website` and `legal`
(`src/i18n/fr/website.ts` and `ar/website.ts`, keys nested by page: `website.home.*`, `website.request.*`,
`website.tracking.*`, `website.quote.*`, `website.payment.*`, `website.invoice.*`, `website.join.*`...). Words used by
the phone app too are in the other namespaces (`common`, `status`, `trades`, `errors`, `guest`, `tracking`, `customer`,
`quote`, `money`) and are reused from there, never copied. After a change in the shared package run `npm run sync`
there: it copies the package into `lib/shared` (which is a generated copy: never edit it here). `i18n/request.ts` hands
`catalogOf(locale)` to next-intl.

**Adding or changing a string**

1. In a server component: `const t = await getTranslations("website.<page>")`; in a client component:
   `const t = useTranslations("website.<page>")`; write `t("some.key")`. A sentence with a changing part is one message
   with a value (`t("done.title", { id })`), never two messages glued together. Counts are ICU plurals with all
   Arabic forms (`zero one two few many other`).
2. Write the French text first (shared package, `src/i18n/fr/website.ts`), exactly as it must read, then the Arabic
   (`src/i18n/ar/website.ts`, same keys: the compiler and the shared tests check it). Use the Arabic glossary words of the
   shared package.
3. Dates and numbers: `lib/dates.ts` and the shared helpers (`INTL_TAGS`: `fr-TN` / `ar-TN`, Latin digits, Tunisian time).
   Do not use next-intl's own number/date formatters with the bare `ar` locale (they would print Arabic-Indic digits).
4. Layout: logical Tailwind classes only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`, `border-s`,
   `rounded-e`...; mirror arrows with `rtl:-scale-x-100`). Values that read left to right whatever the language (phone
   numbers, e-mail addresses, amounts, codes, links, ticket numbers) go in `<Ltr>` (`components/ltr.tsx`) and their inputs
   have `dir="ltr"` and `text-start`.
5. Run `npm run check:i18n`: it fails, with file and line, on French text left in the code (an accented letter or a
   common French word in a string or in JSX text) and warns about physical-direction classes (`ml-`, `pr-`, `left-`,
   `text-right`...). Its short allowlist (brand name, text for the staff) is at the top of `scripts/check-i18n.mjs`, a reason
   for each entry.

Text that comes from the server (names the staff typed, quote lines, invoice parties, refusal sentences) is shown as it
arrives and is not translated again.

**`next-intl` not installed yet.** The dependency (`next-intl` ^4.4.0) is in `package.json`; if `Cannot find module
'next-intl'` appears, run `pnpm install` (or `npm install`) in this folder, then restart `next dev`.

## Arrival time on the tracking page (P3-05)

While a technician is on the way, the tracking page (`components/guest/tracking-view.tsx`) shows a card "Arrivée estimée" / "الوصول المتوقع" under the status.
The server adds `arrival` to the answer of `GET /guest/tracking/:id` (`{ state, minutes, ageMinutes }`) and the shared rule `visibleArrival` decides what is said:

- **a figure** ("Votre technicien arrive dans environ 12 minutes.") only from a position that is recent, with the age of the position and a line saying it is an estimate;
- **"in a moment"** up to 2 minutes, **"in more than an hour"** from 60;
- **a sentence with no figure** when the position is old, or when nobody knows when it was sent;
- **nothing** when the job is not on the way, when the job has no point on the map (most requests made on this site have none: the estimate needs one),
  while the page has lost contact with the server (two failed tries in a row: the card goes with the "connexion instable" notice rather than show a figure that can no longer be vouched for),
  and when the answer on the screen is **more than 2 minutes old** (`ARRIVAL_ANSWER_MAX_AGE_MS`): a tab that sat hidden or frozen makes no request and counts no failure, so the page judges the age of the answer itself,
  every 30 seconds and when the tab comes back.

The estimate is the straight line made longer by 1.3 and divided by 30 km/h: it is an assumption, there is no routing service behind it. Both languages are in the shared catalogue (`tracking.arrival.*`).

## Terms, privacy and consent (P3-08)

The footer links to two pages, `/conditions` (terms of use and sale) and `/confidentialite` (privacy policy). The dead footer links are gone: "À propos" and "Contact Pro" were removed, and the three trades now jump to the services section of the home page.
The request form says, under the address and under the phone number, what happens to them and who sees them, and puts a line above the "send" button. The technician application (`/rejoindre`) points to the privacy text under its documents. The links of the line and the notices open in a tab of their own (with an icon and a hidden "(s'ouvre dans un nouvel onglet)"), so what was typed stays where it is.

**These texts are drafts, not legal advice.** They say what the service does today, taken from the code (what the form asks; what the technicians see before and after a request is given to them; who else receives data: SMS and e-mail provider, push service, card provider; what the browser keeps; what the server deletes by itself, which is almost nothing),
and leave a marked passage — `[À COMPLÉTER : …]` / `[يُستكمل: …]` to fill in, `[À VÉRIFIER : …]` / `[يُراجع: …]` to check — wherever the company or a lawyer has to decide (company identity, technicians' status, quote, cancellation, liability, applicable law, the data protection authority's declaration, who hosts the data, how long it is kept, how identity is checked for a rights request, contact details).
The Arabic is a plain Modern Standard Arabic draft that a native reader must read as well.

- **Where the words are:** `smart-depannage-shared/src/i18n/{fr,ar}/legal.ts` (the two texts, section by section; a body is paragraphs separated by an empty line, `- ` makes a list item; read as written, so no braces and no straight apostrophe), and `website.request.notice.*`, `website.request.consent.*`, `website.request.newTab`, `website.join.form.privacyLine` for the forms. The page reads them with `legalText` (shared `src/legal.ts`). The pages read `legal` on the server, and `i18n/messages.ts` does not hand it to next-intl in the browser; but the request form imports the shared catalogue to work out whether the texts count as reviewed, so the texts are in the bundle of every page that imports the catalogue.
- **Draft until reviewed — one answer for everything.** The texts are shown as final only when `LEGAL_REVIEW` (shared `src/legal.ts`) has `reviewed: true`, a reviewer's name, a real day (YYYY-MM-DD, not before `version`) and the `fingerprint` of the words that were read, AND no passage is open in ANY of the four texts (two documents, two languages) or in the lines of the forms (`LEGAL_FORM_KEYS`). Otherwise the two legal pages show the "Version provisoire" notice and "Projet du …" instead of a version, highlights the open passages and asks the search engines not to index it (`robots: noindex, nofollow`, from `legalRobots`). The rule fails closed: any square bracket (any form, fullwidth too) or the words TODO / TBD / FIXME / XXX is an open passage, and editing any word after the review changes the fingerprint and puts the texts back to draft.
- **The consent line follows the same answer** (`legalSetStatus` in `components/guest/request-wizard.tsx`): while the texts are a draft, the line only informs ("vous êtes informé(e) de l'usage de vos données tel que le décrit la politique de confidentialité. Cette politique et les conditions sont encore des projets qui peuvent changer"); once they are reviewed it is the acceptance ("vous acceptez les … et vous confirmez avoir lu la …"). Nothing records that acceptance (no version is stored with the request): see the shared README before relying on the sentence.
- **To publish the real texts:** replace the draft in `fr/legal.ts` and `ar/legal.ts` (same sections, same shape and numbers in both languages), run `npm test` in the shared package (once no passage is left open it prints the fingerprint of the words), set `LEGAL_REVIEW` (`reviewed`, `reviewedBy`, `reviewedOn`, `version`, `fingerprint`), run it again, `npm run sync`, and deploy (the full list of steps is in the shared README, "The terms and the privacy text").
- **`npm run check:legal`** reads the code without its comments and fails when a `LEGAL_PATHS` address has no page, when a page does not render its text or does not export `generateMetadata`, when the footer, the request form (consent line, notices, the ids the fields point to) or the technician form stop linking to the texts, when the draft/reviewed answer no longer reaches the consent line, the banner, the version line or the `robots` metadata, or when a link goes nowhere (`href="#"`, `""`, `javascript:`, a link with no `href`, an anchor with no matching `id`, an address that is not a page of the site). It checks the shape of the code, not the behaviour: that is in the tests of the shared package.
- **Consent is a line, not a record.** Sending the form is the acceptance; nothing is stored about it (no checkbox, no date, no version of the text). If the lawyer wants proof of consent, the server has to keep it (see the plan).
- **Not covered by the texts:** the sign-in and password-reset pages, and the technician phone app.
