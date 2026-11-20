// Small pieces shared by the Courses page story (server) and its interactive
// parts (client): no server-only imports here.

// Words wrapped in *stars* get a highlighter stroke (on light backgrounds)
// or the light accent colour (on the dark ones)
export function Highlighted({ text, dark = false, tone = 'blue' }: { text: string; dark?: boolean; tone?: 'blue' | 'red' }) {
  return (
    <>
      {text.split(/\*(.+?)\*/).map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className={
              dark
                ? 'text-[#8fb4ff]'
                : `${
                    tone === 'red'
                      ? 'bg-[linear-gradient(transparent_60%,rgba(217,63,63,0.2)_60%,rgba(217,63,63,0.2)_92%,transparent_92%)]'
                      : 'bg-[linear-gradient(transparent_60%,rgba(61,127,255,0.24)_60%,rgba(61,127,255,0.24)_92%,transparent_92%)]'
                  } [box-decoration-break:clone] [-webkit-box-decoration-break:clone]`
            }
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export const two = (n: number) => String(n).padStart(2, '0');

// Each chapter's colour, on its stop along the road and on its section's
// number: red for the problem, blue for the answer, orange for the path, teal
// for the vision. Dark enough for white numbers on top.
export const CHAPTER_COLORS: Record<string, string> = {
  constat: '#d93f3f',
  reponse: '#2f6fe8',
  parcours: '#e2701c',
  vision: '#0f9a8c',
};

export function Eyebrow({ number, text, color, dark = false }: { number: number; text: string; color?: string; dark?: boolean }) {
  if (!text) return null;
  return (
    <p className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] ${dark ? 'text-[#8fb4ff]' : color ? 'text-navy/70' : 'text-accent'}`}>
      <span className="tabular-nums" style={color ? { color } : undefined}>
        {two(number)}
      </span>
      <span aria-hidden className={`h-0.5 w-8 rounded-full ${dark ? 'bg-[#8fb4ff]/50' : 'bg-accent/40'}`} style={color ? { backgroundColor: color } : undefined} />
      {text}
    </p>
  );
}
