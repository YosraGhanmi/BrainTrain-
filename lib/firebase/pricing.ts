import { FieldValue, type DocumentData } from 'firebase-admin/firestore';
import { firestore } from '@/lib/firebase/admin';

export type PlanType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type FirebasePricingRule = {
  id: string;
  planType: PlanType;
  ageGroupSlug: string | null;
  courseSlug: string | null;
  amount: number;
  currency: string;
};

function mapRule(id: string, data: DocumentData): FirebasePricingRule {
  return {
    id,
    planType: (data.planType as PlanType) ?? 'MONTHLY',
    ageGroupSlug: data.ageGroupSlug ? String(data.ageGroupSlug) : null,
    courseSlug: data.courseSlug ? String(data.courseSlug) : null,
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? 'TND'),
  };
}

const col = () => firestore.collection('pricing_rules');

export async function listFirebasePricingRules(): Promise<FirebasePricingRule[]> {
  const snapshot = await col().get();
  return snapshot.docs.map((doc) => mapRule(doc.id, doc.data()));
}

// Upsert a rule by planType + ageGroupSlug or planType + courseSlug
export async function upsertFirebasePricingRule(input: {
  planType: PlanType;
  ageGroupSlug?: string | null;
  courseSlug?: string | null;
  amount: number;
  currency: string;
}): Promise<void> {
  let query = col().where('planType', '==', input.planType);
  if (input.ageGroupSlug) query = query.where('ageGroupSlug', '==', input.ageGroupSlug) as typeof query;
  else if (input.courseSlug) query = query.where('courseSlug', '==', input.courseSlug) as typeof query;
  else return;

  const snapshot = await query.limit(1).get();
  const data = {
    planType: input.planType,
    ageGroupSlug: input.ageGroupSlug ?? null,
    courseSlug: input.courseSlug ?? null,
    amount: input.amount,
    currency: input.currency,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (snapshot.empty) {
    await col().add(data);
  } else {
    await col().doc(snapshot.docs[0].id).set(data, { merge: true });
  }
}

export async function deleteFirebasePricingRulesByAgeGroup(ageGroupSlug: string): Promise<void> {
  const snapshot = await col().where('ageGroupSlug', '==', ageGroupSlug).get();
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export async function deleteFirebasePricingRulesByCourse(courseSlug: string): Promise<void> {
  const snapshot = await col().where('courseSlug', '==', courseSlug).get();
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export async function resolveFirebasePrice(
  planType: PlanType,
  courseSlug: string,
  ageGroupSlug: string,
): Promise<{ amount: number; currency: string }> {
  // Course-specific override takes priority over age-group default
  const overrideSnap = await col().where('planType', '==', planType).where('courseSlug', '==', courseSlug).limit(1).get();
  if (!overrideSnap.empty) {
    const data = overrideSnap.docs[0].data();
    return { amount: Number(data.amount), currency: String(data.currency) };
  }

  const defaultSnap = await col().where('planType', '==', planType).where('ageGroupSlug', '==', ageGroupSlug).limit(1).get();
  if (!defaultSnap.empty) {
    const data = defaultSnap.docs[0].data();
    return { amount: Number(data.amount), currency: String(data.currency) };
  }

  throw new Error(`No pricing rule found for plan type "${planType}" (course "${courseSlug}", age group "${ageGroupSlug}").`);
}
