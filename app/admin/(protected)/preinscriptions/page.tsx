import { ClipboardCheck } from 'lucide-react';
import { requirePreinscriptionAccess, updatePreinscriptionRouting } from '@/lib/preinscription/actions';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import { getFirebasePreinscriptionSetting, listFirebasePreinscriptions } from '@/lib/firebase/preinscriptions';

export const dynamic = 'force-dynamic';

export default async function AdminPreinscriptionsPage(props: { searchParams: Promise<{ saved?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await requirePreinscriptionAccess();
  const [routeToForm, submissions] = await Promise.all([getFirebasePreinscriptionSetting(), listFirebasePreinscriptions()]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Preinscriptions</h1>

      {searchParams.saved ? <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p> : null}

      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Register button destination</h2>
              <p className="mt-1 text-sm text-stone">
                When enabled, "Inscrire votre enfant" opens the preinscription form. Otherwise it opens the courses page.
              </p>
            </div>
          </div>

          <form action={updatePreinscriptionRouting} className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                name="routeRegisterToForm"
                defaultChecked={routeToForm}
                disabled={session.kind !== 'admin'}
                className="h-4 w-4 rounded border-ink/20 text-accent focus:ring-accent"
              />
              Route to preinscription form
            </label>
            {session.kind === 'admin' ? (
              <PendingSubmitButton className="rounded-full bg-ink px-5 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-accent">
                Save
              </PendingSubmitButton>
            ) : null}
          </form>
        </div>
        {session.kind !== 'admin' ? (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone">Only admin can change this setting.</p>
        ) : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Child</th>
              <th className="px-5 py-3">Age</th>
              <th className="px-5 py-3">Institution</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-stone">
                  No preinscription submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map((entry) => (
                <tr key={entry.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">{entry.childFullName}</td>
                  <td className="px-5 py-4 text-stone">{entry.childAge}</td>
                  <td className="px-5 py-4 text-stone">{entry.institution}</td>
                  <td className="px-5 py-4 text-stone">{entry.parentFullName}</td>
                  <td className="px-5 py-4 text-stone">{entry.parentPhone}</td>
                  <td className="px-5 py-4 text-stone">{entry.createdAt.toLocaleDateString('fr-FR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
