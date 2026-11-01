import * as React from "react"

/**
 * A value that is read left to right whatever the language around it (P3-04): a phone number, an e-mail address, a code, a link, a
 * reference. In an Arabic page the text around it runs right to left; without this the "+" of a phone number or the dots of an address
 * would jump to the other end. `<bdi>` also keeps the value from reordering its neighbours, and the value is never cut between two lines
 * (a phone number split after "+33" reads in the wrong order in Arabic). `wrap` lets a long value break where its container breaks it
 * (an e-mail address in a narrow column, which French has always let break).
 */
export function Ltr({ children, className, wrap = false }: { children: React.ReactNode; className?: string; wrap?: boolean }) {
  const classes = [wrap ? "" : "whitespace-nowrap", className ?? ""].filter(Boolean).join(" ")

  return (
    <bdi dir="ltr" className={classes || undefined}>
      {children}
    </bdi>
  )
}

/**
 * A value that carries words of the page's own language, such as an amount ("12,500 DT", "12.500 د.ت"): the direction is the one of
 * its first letter, so the number and its unit stay together in the order the reader expects, and the neighbours are not reordered.
 */
export function Bidi({ children, className }: { children: React.ReactNode; className?: string }) {
  return <bdi className={className}>{children}</bdi>
}
