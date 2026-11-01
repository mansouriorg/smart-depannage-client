import * as React from "react"

/**
 * A marker to put in a message where a piece of the page goes (a phone number in bold, a link). Messages hold no tags (P3-04): the
 * whole sentence stays one message that a translator can reorder, the value is given as `SLOT`, and `SlotText` puts the piece there.
 */
export const SLOT = ""

export function SlotText({ text, slot }: { text: string; slot: React.ReactNode }) {
  const at = text.indexOf(SLOT)

  if (at < 0) return <>{text}</>

  return (
    <>
      {text.slice(0, at)}
      {slot}
      {text.slice(at + SLOT.length)}
    </>
  )
}
