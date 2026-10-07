import DiscountTag from '@/components/pricing/DiscountTag';

// Bottom row of a course page, straight on the page background: the hanging
// family discount tag and the enroll button (`action`).
export default function CoursePaymentRow({
  familyDiscountPercent,
  action,
}: {
  familyDiscountPercent: number;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
      {familyDiscountPercent ? (
        <div className="pl-1">
          <DiscountTag percent={familyDiscountPercent} />
        </div>
      ) : null}
      <div className="w-full sm:ml-auto sm:w-auto">{action}</div>
    </div>
  );
}
