import { readContent } from '@/lib/content/store';
import { updateContact } from '@/lib/admin/actions';

export const dynamic = 'force-dynamic';

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink/30"
      />
    </div>
  );
}

export default function AdminContactPage() {
  const { contact } = readContent();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Contact</h1>
      <p className="mt-2 text-stone">Shown in the contact section and its map card.</p>

      <form action={updateContact} className="mt-8 max-w-xl space-y-6 rounded-2xl border border-ink/10 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" name="email_value" defaultValue={contact.email.value} />
          <Field label="Email link (mailto:)" name="email_href" defaultValue={contact.email.href} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" name="phone_value" defaultValue={contact.phone.value} />
          <Field label="Phone link (tel:)" name="phone_href" defaultValue={contact.phone.href} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Address" name="location_value" defaultValue={contact.location.value} />
          <Field label="Maps link" name="location_href" defaultValue={contact.location.href} />
        </div>
        <Field label="Maps embed URL" name="mapsEmbedSrc" defaultValue={contact.mapsEmbedSrc} />

        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone/90"
        >
          Save
        </button>
      </form>
    </div>
  );
}
