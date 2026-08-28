import DashboardGrid from '@/components/admin/DashboardGrid';

const sections = [
  { label: 'Messages', href: '/admin/messages', description: 'Read messages submitted through the contact form.' },
  { label: 'Sponsors', href: '/admin/sponsors', description: 'Add or remove partner logos.' },
  { label: 'Statistics', href: '/admin/stats', description: 'Edit the homepage stat counters.' },
  { label: 'Courses', href: '/admin/courses', description: 'Add, edit or remove courses — description, sessions, video.' },
  { label: 'Age groups', href: '/admin/age-groups', description: 'Choose which courses belong to which age group.' },
  { label: 'Contact', href: '/admin/contact', description: 'Edit email, phone, address and the map link.' },
  { label: 'Social media links', href: '/admin/socials', description: 'Edit the Facebook, Instagram and LinkedIn links.' },
  { label: 'Achievements gallery', href: '/admin/achievements', description: 'Add or remove photos in the achievements carousel.' },
  { label: 'Timeline', href: '/admin/timeline', description: 'Add, edit or remove milestones on the achievements timeline.' },
  { label: 'Parents', href: '/admin/parents', description: 'View registered parent accounts.' },
  { label: 'Children', href: '/admin/children', description: 'View every enrolled child and their parent.' },
  { label: 'Teachers', href: '/admin/teachers', description: 'Create teacher accounts and see their assigned sessions.' },
  { label: 'Course sessions', href: '/admin/sessions', description: 'Schedule sessions, set capacity, and assign a teacher.' },
  { label: 'Enrollments', href: '/admin/enrollments', description: 'Review and manage child enrollment status.' },
  { label: 'Payments', href: '/admin/payments', description: 'Track payment status and record manual payments.' },
  { label: 'Pricing', href: '/admin/pricing', description: 'Set monthly, seasonal and course-specific prices.' },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-center font-display text-4xl font-semibold text-ink">Website customization</h1>

      <DashboardGrid sections={sections} />
    </div>
  );
}
