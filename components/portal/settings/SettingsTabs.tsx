import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { User, ShieldCheck, Users } from 'lucide-react';

const TABS = [
  { key: 'personal', icon: User },
  { key: 'security', icon: ShieldCheck },
  { key: 'children', icon: Users },
] as const;

export type SettingsTab = (typeof TABS)[number]['key'];

export default async function SettingsTabs({ active }: { active: SettingsTab }) {
  const t = await getTranslations('parentPortal.settingsTabs');
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 lg:w-72 lg:shrink-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:border-r lg:border-ink/10 lg:pb-0 lg:pr-6">
      {TABS.map(({ key, icon: Icon }) => {
        const label = t(key);
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={`/parent-portal/account?tab=${key}`}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition lg:w-full lg:gap-3 lg:whitespace-normal ${
              isActive ? 'bg-slate-100 text-ink' : 'text-stone hover:bg-slate-50 hover:text-ink'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
