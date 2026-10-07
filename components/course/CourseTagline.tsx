// Course tagline where words wrapped in *stars* (set in admin) get a
// highlighter underline, e.g. "Understanding emotions... *through play.*"
export default function CourseTagline({ text }: { text: string }) {
  const parts = text.split(/\*(.+?)\*/);
  return (
    <p className="mt-3 font-display text-xl font-semibold leading-snug text-[#1f4fd1] sm:text-2xl lg:mt-2 lg:text-xl xl:mt-3 xl:text-2xl">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            className="underline decoration-[#ffc93c] decoration-[5px] underline-offset-[7px] [text-decoration-skip-ink:none]"
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
