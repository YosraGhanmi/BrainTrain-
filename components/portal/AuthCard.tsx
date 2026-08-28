export default function AuthCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-surface px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-8 shadow-soft sm:p-10">
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-stone">{eyebrow}</span>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        {children}
      </div>
    </div>
  );
}
