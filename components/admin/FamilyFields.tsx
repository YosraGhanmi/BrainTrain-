import { Link2 } from 'lucide-react';
import { PARENT_RELATION_LABELS, PARENT_RELATIONS, type FamilyFields as FamilyValues } from '@/lib/db/families';
import { NAME_MAX_LENGTH } from '@/lib/children/validation';

export type LinkedAccount = { fullName: string; phone: string; secondaryPhone: string | null; email: string };

// The two parents (relation, name, two phones each) and the family email, as
// read by parseFamilyFields in lib/admin/children-actions.
//
// For a child linked to a parent account, the account holder is Parent 1:
// their name, phones and email are shown read-only (the parent keeps them up
// to date from the portal), and only the relation can be set here. If the
// paper records already hold a first parent, those stay editable instead and
// the account is shown above them.
export default function FamilyFields({
  defaults,
  account,
  labelClassName,
  inputClassName,
}: {
  defaults?: FamilyValues | null;
  account?: LinkedAccount | null;
  labelClassName: string;
  inputClassName: string;
}) {
  const paperParent1 = Boolean(defaults?.parent1Name || defaults?.parent1Phone || defaults?.parent1Phone2);
  const accountIsParent1 = Boolean(account) && !paperParent1;
  const accountEmailOnly = Boolean(account) && !defaults?.email;
  const readOnlyClassName = `${inputClassName} cursor-default bg-emerald-50/50 text-ink/80`;

  const relationSelect = (n: 1 | 2) => (
    <label className="block">
      <span className={labelClassName}>Relation</span>
      <select name={`parent${n}Relation`} defaultValue={defaults?.[`parent${n}Relation`] ?? ''} className={inputClassName}>
        <option value="">Not specified</option>
        {PARENT_RELATIONS.map((r) => (
          <option key={r} value={r}>
            {PARENT_RELATION_LABELS[r]}
          </option>
        ))}
      </select>
    </label>
  );

  const readOnly = (label: string, value: string | null) => (
    <label className="block">
      <span className={labelClassName}>{label}</span>
      <input readOnly tabIndex={-1} value={value || '-'} aria-readonly className={readOnlyClassName} />
    </label>
  );

  const accountNote = (
    <p className="flex items-start gap-1.5 text-xs text-emerald-700">
      <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      From the linked parent account. The parent updates these from their portal.
    </p>
  );

  return (
    <div className="space-y-5">
      {account && !accountIsParent1 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Parent account</p>
          <p className="mt-1 font-semibold text-ink">{account.fullName}</p>
          <p className="text-sm text-stone">
            {[account.phone, account.secondaryPhone, account.email].filter(Boolean).join(' · ')}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {([1, 2] as const).map((n) =>
          n === 1 && accountIsParent1 && account ? (
            <fieldset key={n} className="rounded-2xl border border-emerald-200 p-4">
              <legend className="px-1.5 text-xs font-bold uppercase tracking-wide text-ink">Parent 1 · linked account</legend>
              <div className="grid grid-cols-1 gap-3">
                {relationSelect(1)}
                {readOnly('Full name', account.fullName)}
                {readOnly('Phone', account.phone)}
                {readOnly('Second phone', account.secondaryPhone)}
                {accountNote}
              </div>
            </fieldset>
          ) : (
            <fieldset key={n} className="rounded-2xl border border-ink/10 p-4">
              <legend className="px-1.5 text-xs font-bold uppercase tracking-wide text-ink">Parent {n}</legend>
              <div className="grid grid-cols-1 gap-3">
                {relationSelect(n)}
                <label className="block">
                  <span className={labelClassName}>Full name</span>
                  <input
                    name={`parent${n}Name`}
                    maxLength={NAME_MAX_LENGTH}
                    defaultValue={defaults?.[`parent${n}Name`] ?? ''}
                    className={inputClassName}
                  />
                </label>
                <label className="block">
                  <span className={labelClassName}>Phone</span>
                  <input name={`parent${n}Phone`} type="tel" defaultValue={defaults?.[`parent${n}Phone`] ?? ''} className={inputClassName} />
                </label>
                <label className="block">
                  <span className={labelClassName}>Second phone</span>
                  <input name={`parent${n}Phone2`} type="tel" defaultValue={defaults?.[`parent${n}Phone2`] ?? ''} className={inputClassName} />
                </label>
              </div>
            </fieldset>
          ),
        )}
      </div>

      {accountEmailOnly && account ? (
        readOnly('Email (parent account)', account.email)
      ) : (
        <label className="block">
          <span className={labelClassName}>Email</span>
          <input name="email" type="email" defaultValue={defaults?.email ?? ''} className={inputClassName} />
        </label>
      )}
    </div>
  );
}
