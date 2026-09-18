const fs = require('node:fs');
const assert = require('node:assert/strict');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore');

async function seed(testEnv) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'users/parentA'), {
      email: 'parent-a@example.com',
      fullName: 'Parent A',
      phone: '+100000001',
      role: 'PARENT',
      parentId: 'parentA',
      parentStatus: 'APPROVED',
      isFrozen: false,
      secondaryPhone: null,
      backupEmail: null,
      twoFactorEnabled: false,
      twoFactorCodeHash: null,
      twoFactorCodeExpiresAt: null,
      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
    });

    await setDoc(doc(db, 'users/parentB'), {
      email: 'parent-b@example.com',
      fullName: 'Parent B',
      phone: '+100000002',
      role: 'PARENT',
      parentId: 'parentB',
      parentStatus: 'APPROVED',
      isFrozen: false,
    });

    await setDoc(doc(db, 'children/childA'), {
      parentId: 'parentA',
      fullName: 'Child A',
    });

    await setDoc(doc(db, 'children/childB'), {
      parentId: 'parentB',
      fullName: 'Child B',
    });

    await setDoc(doc(db, 'enrollments/enrollmentA'), {
      childId: 'childA',
      courseSessionId: 'sessionA',
      status: 'ACTIVE',
    });

    await setDoc(doc(db, 'enrollments/enrollmentB'), {
      childId: 'childB',
      courseSessionId: 'sessionB',
      status: 'ACTIVE',
    });

    await setDoc(doc(db, 'payment_plans/planA'), {
      enrollmentId: 'enrollmentA',
      amount: 100,
      currency: 'TND',
    });

    await setDoc(doc(db, 'payment_plans/planB'), {
      enrollmentId: 'enrollmentB',
      amount: 200,
      currency: 'TND',
    });

    await setDoc(doc(db, 'payments/paymentA'), {
      enrollmentId: 'enrollmentA',
      paymentPlanId: 'planA',
      amount: 100,
      currency: 'TND',
      status: 'PENDING',
    });

    await setDoc(doc(db, 'payments/paymentB'), {
      enrollmentId: 'enrollmentB',
      paymentPlanId: 'planB',
      amount: 200,
      currency: 'TND',
      status: 'PENDING',
    });
  });
}

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'braintrain-rules-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  try {
    await testEnv.clearFirestore();
    await seed(testEnv);

    const parentA = testEnv.authenticatedContext('parentA').firestore();
    const parentB = testEnv.authenticatedContext('parentB').firestore();
    const anonymous = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(parentA, 'users/parentA')));
    await assertFails(getDoc(doc(parentA, 'users/parentB')));
    await assertFails(setDoc(doc(parentA, 'users/parentA'), { role: 'SECRETARY' }, { merge: true }));
    await assertFails(updateDoc(doc(parentA, 'users/parentA'), { phone: '+199999999' }));
    await assertFails(updateDoc(doc(parentA, 'users/parentA'), { role: 'SECRETARY', parentStatus: 'APPROVED', isFrozen: false }));
    await assertFails(updateDoc(doc(parentA, 'users/parentA'), { parentId: 'parentB', teacherId: 'parentA' }));
    await assertFails(updateDoc(doc(parentA, 'users/parentA'), { twoFactorEnabled: true, passwordResetCodeHash: 'hash' }));
    await assertFails(deleteDoc(doc(parentA, 'users/parentA')));

    await assertSucceeds(getDoc(doc(parentA, 'children/childA')));
    await assertFails(getDoc(doc(parentA, 'children/childB')));
    await assertFails(setDoc(doc(parentA, 'children/newChild'), { parentId: 'parentA', fullName: 'New Child' }));
    await assertFails(updateDoc(doc(parentA, 'children/childA'), { parentId: 'parentB' }));
    await assertFails(deleteDoc(doc(parentA, 'children/childA')));

    await assertSucceeds(getDoc(doc(parentA, 'enrollments/enrollmentA')));
    await assertFails(getDoc(doc(parentA, 'enrollments/enrollmentB')));

    await assertSucceeds(getDoc(doc(parentA, 'payment_plans/planA')));
    await assertFails(getDoc(doc(parentA, 'payment_plans/planB')));
    await assertFails(getDocs(collection(parentA, 'payment_plans')));
    await assertSucceeds(getDocs(query(collection(parentA, 'payment_plans'), where('enrollmentId', '==', 'enrollmentA'))));

    await assertSucceeds(getDoc(doc(parentA, 'payments/paymentA')));
    await assertFails(getDoc(doc(parentA, 'payments/paymentB')));
    await assertFails(getDocs(collection(parentA, 'payments')));
    await assertSucceeds(getDocs(query(collection(parentA, 'payments'), where('enrollmentId', '==', 'enrollmentA'))));

    await assertSucceeds(getDoc(doc(parentB, 'payments/paymentB')));
    await assertFails(getDoc(doc(anonymous, 'users/parentA')));

    const paymentASnapshot = await getDoc(doc(parentA, 'payments/paymentA'));
    assert.equal(paymentASnapshot.exists(), true);
  } finally {
    await testEnv.cleanup();
  }

  console.log('firestore rules checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
