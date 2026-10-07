// Course tagline where words wrapped in *stars* (set in admin) get a
// yellow highlighter background, e.g. "Understanding emotions... *through play.*"
export default function CourseTagline({ text }: { text: string }) {
  const parts = text.split(/\*(.+?)\*/);
  return (
    <p className="mt-3 text-balance font-display text-xl font-semibold leading-snug text-[#1f4fd1] sm:text-2xl lg:mt-2 lg:text-xl xl:mt-3 xl:text-2xl">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="rounded-md bg-[#ffd84a] px-1.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}
