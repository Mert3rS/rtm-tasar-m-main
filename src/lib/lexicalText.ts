/** Flatten Lexical JSON to plain text for search indexing (never rendered as HTML). */
type LexicalNode = { text?: unknown; children?: unknown; type?: unknown }

export function lexicalText(value: unknown, max = 600): string {
  const parts: string[] = []
  let length = 0
  const walk = (node: unknown) => {
    if (length >= max || !node || typeof node !== 'object') return
    const current = node as LexicalNode
    if (typeof current.text === 'string') {
      parts.push(current.text)
      length += current.text.length
    }
    if (Array.isArray(current.children)) {
      for (const child of current.children) walk(child)
      if (current.type === 'paragraph' || current.type === 'heading' || current.type === 'listitem')
        parts.push(' ')
    }
  }
  if (value && typeof value === 'object' && 'root' in value) walk((value as { root: unknown }).root)
  return parts.join('').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function hasLexicalContent(value: unknown) {
  return lexicalText(value, 20).length > 0
}
