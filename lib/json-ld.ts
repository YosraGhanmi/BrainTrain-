// JSON-LD goes into an inline <script>. "<" is written as its JSON escape so
// no text in the data (a course title, a caption...) can end the script tag.
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
