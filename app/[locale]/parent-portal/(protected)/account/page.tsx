import { requireParent } from '@/lib/portal-auth/guard';
import { prisma } from '@/lib/db/prisma';
import { listAgeGroupEntries } from '@/lib/content/lookup';
import SettingsTabs, { type SettingsTab } from '@/components/portal/settings/SettingsTabs';
import PersonalInfoSection from '@/components/portal/settings/PersonalInfoSection';
import SecuritySection from '@/components/portal/settings/SecuritySection';
import ChildrenSection from '@/components/portal/settings/ChildrenSection';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const TABS: SettingsTab[] = ['personal', 'security', 'children'];

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale };
  searchParams: { tab?: string; child?: string; saved?: string; error?: string; verify2fa?: string };
}) {
  const parent = await requireParent(params.locale);
  const tab: SettingsTab = TABS.includes(searchParams.tab as SettingsTab) ? (searchParams.tab as SettingsTab) : 'personal';

  return (
    <div className="w-full">
      <h1 className="font-display text-3xl font-bold text-ink">Settings</h1>

      {searchParams.saved ? <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Saved.</p> : null}
      {searchParams.error === 'phone-taken' ? (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">That phone number is already in use.</p>
      ) : searchParams.error === 'no-secondary' ? (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">Add a secondary phone number before deleting your primary one.</p>
      ) : searchParams.error ? (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">Please check the form and try again.</p>
      ) : null}

      <div className="mt-8 flex gap-8">
        <SettingsTabs active={tab} />
        <div className="min-w-0 flex-1">
          {tab === 'personal' ? (
            <PersonalInfoSection
              locale={params.locale}
              phone={parent.phone}
              secondaryPhone={parent.secondaryPhone}
              backupEmail={parent.backupEmail}
            />
          ) : null}

          {tab === 'security' ? (
            <SecuritySection
              locale={params.locale}
              twoFactorEnabled={parent.twoFactorEnabled}
              verifying2fa={searchParams.verify2fa === '1'}
            />
          ) : null}

          {tab === 'children' ? <ChildrenTab locale={params.locale} parentId={parent.parentId} selectedChildId={searchParams.child ?? ''} /> : null}
        </div>
      </div>
    </div>
  );
}

async function ChildrenTab({
  locale,
  parentId,
  selectedChildId,
}: {
  locale: AppLocale;
  parentId: string;
  selectedChildId: string;
}) {
  const kids = await prisma.child.findMany({
    where: { parentId },
    include: { enrollments: { include: { courseSession: true }, orderBy: { enrolledAt: 'desc' } } },
    orderBy: { createdAt: 'asc' },
  });
  const ageGroups = listAgeGroupEntries();

  return <ChildrenSection locale={locale} kids={kids} ageGroups={ageGroups} selectedChildId={selectedChildId} />;
}
