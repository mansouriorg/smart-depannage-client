const BLOCK_NAME = "« Un problème ? »";

/**
 * Words that may name the block « Un problème ? » further down the page (the only way to write to the team from this page):
 * the name is a link to it, so that a keyboard or a screen reader gets there without going through the whole page.
 */
export function LinkedWords({ text }: { text: string }) {
  const at = text.indexOf(BLOCK_NAME);

  if (at < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <a href="#problem-title" className="font-semibold underline underline-offset-2">
        {BLOCK_NAME}
      </a>
      {text.slice(at + BLOCK_NAME.length)}
    </>
  );
}
