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
`src/i18n/fr/` (the source) and `src/i18n/ar/`. The website owns the namespace `website`
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
