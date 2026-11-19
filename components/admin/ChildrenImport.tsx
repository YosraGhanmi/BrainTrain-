'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ExternalLink, FileSpreadsheet, Loader2, Users } from 'lucide-react';
import { IMPORT_FIELD_GROUPS, type ColumnMapping, type ImportColumn, type ImportField } from '@/lib/children/import-fields';
import { commitChildrenImport, previewChildrenImport, type ImportPreview, type ImportPreviewRow } from '@/lib/admin/children-import-actions';
import { DUPLICATE_REASON_LABELS } from '@/lib/children/duplicates';

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : '-');
const th = 'border-b border-ink/10 px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-stone';
const td = 'border-b border-ink/5 px-3 py-2.5 align-top';

function parentsText(row: ImportPreviewRow): string[] {
  const f = row.family;
  return [
    [f.parent1Name, f.parent1Phone, f.parent1Phone2].filter(Boolean).join(' · '),
    [f.parent2Name, f.parent2Phone, f.parent2Phone2].filter(Boolean).join(' · '),
    f.email ?? '',
  ].filter(Boolean);
}

const SOURCE_LABELS = { header: 'from the header', values: 'guessed from the values', manual: 'your choice' } as const;

// How each column of the file was understood, with a few of its values, and
// a menu to correct it (the file is read again with the correction)
function ColumnPanel({
  columns,
  headerless,
  disabled,
  onChange,
}: {
  columns: ImportColumn[];
  headerless: boolean;
  disabled: boolean;
  onChange: (col: number, field: ImportField | '') => void;
}) {
  const hasName = columns.some((c) => c.field === 'fullName' || c.field === 'firstName' || c.field === 'lastName');
  return (
    <div className="rounded-2xl border border-ink/10 bg-white shadow-soft">
      <div className="border-b border-ink/5 px-4 py-3">
        <p className="font-display text-base font-semibold text-ink">How the columns were read</p>
        <p className="text-sm text-stone">
          {headerless
            ? 'No header row was found: columns were guessed from their values. Check each one.'
            : 'Each column was matched from its header, or from its values when the header said nothing. Correct any that are wrong.'}
        </p>
        {!hasName ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-red-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Pick the column that holds the children&apos;s names: nothing can be imported without it.
          </p>
        ) : null}
      </div>
      <ul className="divide-y divide-ink/5">
        {columns.map((c) => (
          <li key={c.col} className="grid grid-cols-1 items-center gap-2 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_15rem_minmax(0,1.2fr)] sm:gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{c.header}</p>
              <p className={`text-xs ${c.field ? 'text-stone' : 'text-amber-700'}`}>
                {c.field && c.source ? SOURCE_LABELS[c.source] : c.source === 'manual' ? 'ignored (your choice)' : 'not recognised: ignored'}
              </p>
            </div>
            <select
              aria-label={`What the column ${c.header} holds`}
              value={c.field ?? ''}
              disabled={disabled}
              onChange={(e) => onChange(c.col, e.target.value as ImportField | '')}
              className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-accent ${
                c.field ? 'border-ink/10 bg-slate-50 text-ink' : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <option value="">Ignore this column</option>
              {IMPORT_FIELD_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.fields.map((f) => (
                    <option key={f.field} value={f.field}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="truncate text-xs text-stone" title={c.samples.join(' · ')}>
              {c.samples.length ? c.samples.join(' · ') : 'empty'}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChildrenImport({ groupLabels }: { groupLabels: Record<string, string> }) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  // The file being imported, kept to read it again after a column correction
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  // Lines left out by staff
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<{ created: number; families: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, startReading] = useTransition();
  const [saving, startSaving] = useTransition();

  const rows = preview?.ok ? preview.rows : [];
  const importable = rows.filter((r) => !r.blocked && !skipped.has(r.line));

  const runPreview = (target: File, nextMapping: ColumnMapping) => {
    setError(null);
    setResult(null);
    const data = new FormData();
    data.set('file', target);
    data.set('mapping', JSON.stringify(nextMapping));
    startReading(async () => {
      try {
        const next = await previewChildrenImport(data);
        setPreview(next);
        // Rows that look like children already here start unticked
        setSkipped(new Set(next.ok ? next.rows.filter((r) => r.blocked || r.duplicates.length > 0).map((r) => r.line) : []));
      } catch {
        setPreview({ ok: false, error: 'The file could not be sent. Try again.' });
      }
    });
  };

  const onFile = (picked: File | undefined) => {
    if (!picked) return;
    setFile(picked);
    setMapping({});
    runPreview(picked, {});
  };

  const onColumnChange = (col: number, field: ImportField | '') => {
    if (!file) return;
    const next = { ...mapping, [col]: field };
    setMapping(next);
    runPreview(file, next);
  };

  const toggle = (line: number) =>
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });

  const onImport = () => {
    setError(null);
    startSaving(async () => {
      try {
        const res = await commitChildrenImport(importable.map((r) => ({
            line: r.line,
            fullName: r.fullName,
            dateOfBirth: r.dateOfBirth,
            ageGroupSlug: r.ageGroupSlug,
            institution: r.institution,
            registeredAt: r.registeredAt,
            specialNeeds: r.specialNeeds,
            family: r.family,
          })));
        if (res.ok) {
          setResult({ created: res.created, families: res.families });
          setPreview(null);
        } else {
          setError(res.error);
        }
      } catch {
        setError('The import failed. Nothing may have been saved; check the children list before trying again.');
      }
    });
  };

  if (result) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-2 font-display text-xl font-semibold text-emerald-800">
          {result.created} {result.created === 1 ? 'child' : 'children'} imported
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          Each has a parent code on their page{result.families > 0 ? `, in ${result.families} ${result.families === 1 ? 'family' : 'families'}` : ''}.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/admin/children" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
            See the children
          </Link>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            Import another file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-ink/15 bg-white px-6 py-8 text-center transition hover:border-accent hover:bg-accent/5">
        {reading ? <Loader2 className="h-8 w-8 animate-spin text-accent" /> : <FileSpreadsheet className="h-8 w-8 text-accent" />}
        <span className="font-semibold text-ink">{reading ? 'Reading the file...' : 'Choose an Excel file (.xlsx)'}</span>
        <span className="text-sm text-stone">Nothing is saved until you confirm below.</span>
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          disabled={reading || saving}
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>

      {preview && !preview.ok ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{preview.error}</p>
      ) : null}

      {preview?.ok ? (
        <>
          <ColumnPanel columns={preview.columns} headerless={preview.headerless} disabled={reading || saving} onChange={onColumnChange} />

          <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className={th}>
                    <span className="sr-only">Import</span>
                  </th>
                  <th className={th}>Line</th>
                  <th className={th}>Child</th>
                  <th className={th}>Born</th>
                  <th className={th}>Age group</th>
                  <th className={th}>School</th>
                  <th className={th}>Parents</th>
                  <th className={th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const included = !row.blocked && !skipped.has(row.line);
                  return (
                    <tr key={row.line} className={included ? '' : 'bg-slate-50 text-stone/70'}>
                      <td className={td}>
                        <input
                          type="checkbox"
                          aria-label={`Import line ${row.line}`}
                          checked={Boolean(included)}
                          disabled={Boolean(row.blocked)}
                          onChange={() => toggle(row.line)}
                          className="mt-0.5 h-4 w-4 accent-accent"
                        />
                      </td>
                      <td className={`${td} text-stone`}>{row.line}</td>
                      <td className={`${td} font-semibold text-ink`}>{row.fullName || '-'}</td>
                      <td className={`${td} whitespace-nowrap`}>{formatDate(row.dateOfBirth)}</td>
                      <td className={`${td} whitespace-nowrap`}>{row.ageGroupSlug ? groupLabels[row.ageGroupSlug] : row.dateOfBirth ? 'Automatic' : 'To complete'}</td>
                      <td className={td}>{row.institution ?? '-'}</td>
                      <td className={td}>
                        {parentsText(row).map((line) => (
                          <div key={line}>{line}</div>
                        ))}
                        {row.familyWith.length > 0 ? (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                            <Users className="h-3.5 w-3.5" />
                            Same family as line {row.familyWith.join(', ')}
                          </div>
                        ) : null}
                      </td>
                      <td className={`${td} space-y-1`}>
                        {row.blocked ? (
                          <div className="flex items-start gap-1.5 text-xs font-semibold text-red-600">
                            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                            {row.blocked}
                          </div>
                        ) : null}
                        {row.duplicates.map((d) => (
                          <div key={d.id} className="flex items-start gap-1.5 text-xs font-semibold text-amber-800">
                            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                            <span>
                              Maybe already here:{' '}
                              <a href={`/admin/children/${d.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
                                {d.fullName}
                                <ExternalLink className="h-3 w-3" />
                              </a>{' '}
                              ({DUPLICATE_REASON_LABELS[d.reason].toLowerCase()})
                            </span>
                          </div>
                        ))}
                        {row.warnings.map((w) => (
                          <div key={w} className="flex items-start gap-1.5 text-xs text-amber-800">
                            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                            {w}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone">
              {importable.length} of {rows.length} rows selected. Possible duplicates start unticked; rows in red can&apos;t be imported until fixed in the file.
            </p>
            <button
              type="button"
              onClick={onImport}
              disabled={saving || importable.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Import {importable.length} {importable.length === 1 ? 'child' : 'children'}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
