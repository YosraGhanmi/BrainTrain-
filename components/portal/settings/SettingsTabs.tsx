import { Link } from '@/i18n/navigation';
import { User, ShieldCheck, Users } from 'lucide-react';

const TABS = [
  { key: 'personal', label: 'Personal information', icon: User },
  { key: 'security', label: 'Password & security', icon: ShieldCheck },
  { key: 'children', label: 'Children', icon: Users },
] as const;

export type SettingsTab = (typeof TABS)[number]['key'];

export default function SettingsTabs({ active }: { active: SettingsTab }) {
  return (
    <nav className="w-72 shrink-0 space-y-1 border-r border-ink/10 pr-6">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={`/parent-portal/account?tab=${key}`}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
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
