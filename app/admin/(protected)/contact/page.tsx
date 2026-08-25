import { readContent } from '@/lib/content/store';
import { updateContact } from '@/lib/admin/actions';
import { Mail, Phone, MapPin, Map } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-xs font-semibold uppercase tracking-wide text-stone">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-accent/15 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent/40"
      />
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="relative space-y-4 overflow-hidden rounded-2xl border border-accent/15 bg-accent/[0.04] p-5">
      <span className="absolute inset-x-0 top-0 h-1 bg-accent" />
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-sm shadow-accent/30">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function AdminContactPage() {
  const { contact } = readContent();

  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Contact</h1>

      <form action={updateContact} className="mt-8 space-y-6 rounded-2xl border border-ink/10 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card icon={Mail} title="Email">
            <Field label="Email" name="email_value" defaultValue={contact.email.value} />
            <Field label="Link (mailto:)" name="email_href" defaultValue={contact.email.href} />
          </Card>

          <Card icon={Phone} title="Phone">
            <Field label="Phone" name="phone_value" defaultValue={contact.phone.value} />
            <Field label="Link (tel:)" name="phone_href" defaultValue={contact.phone.href} />
          </Card>

          <Card icon={MapPin} title="Address">
            <Field label="Address" name="location_value" defaultValue={contact.location.value} />
            <Field label="Maps link" name="location_href" defaultValue={contact.location.href} />
          </Card>
        </div>

        <Card icon={Map} title="Map embed">
          <Field label="Maps embed URL" name="mapsEmbedSrc" defaultValue={contact.mapsEmbedSrc} />
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
