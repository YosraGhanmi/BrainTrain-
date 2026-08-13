'use client';

export default function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden bg-surface px-6 py-28 md:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-black/5 bg-white/95 p-12 shadow-soft">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <span className="text-sm uppercase tracking-[0.35em] text-stone">Contact</span>
              <h2 className="text-display font-semibold leading-[0.9] text-ink sm:text-[clamp(3.5rem,6vw,5.5rem)]">
                Ready to start your BrainTrain journey?
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-stone sm:text-xl">
                Reach out for enrollment details, program guidance, or to schedule a free consultation with our team.
              </p>
            </div>

            <div className="space-y-4 rounded-[2rem] border border-ink/10 bg-slate-50 p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-stone">Get in touch</p>
              <p className="text-sm leading-7 text-stone">Email us at <a href="mailto:hello@braintrain.com" className="font-semibold text-ink underline decoration-ink/20">hello@braintrain.com</a> or fill out the contact form on our site.</p>
              <a href="mailto:hello@braintrain.com" className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90">
                Email BrainTrain
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
