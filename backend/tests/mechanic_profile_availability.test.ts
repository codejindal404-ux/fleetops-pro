import assert from 'assert';
import { getMechanicProfile, updateAvailability } from '../src/controllers/mechanicController.ts';
import { updateBookingStatus } from '../src/controllers/bookingController.ts';
import { firebaseService } from '../src/services/firebaseService.ts';
import { dbStore } from '../src/services/dbStore.ts';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runProfileAndAvailabilityTests() {
  console.log('--- Starting Mechanic Profile & Availability Firestore Tests ---');

  // Simulated Firestore document storage
  const firestoreStorage: Record<string, Record<string, any>> = {
    users: {
      'fs-mech-1': {
        id: 'fs-mech-1',
        name: 'Alex Rivera',
        email: 'alex.rivera@fleetops.com',
        phone: '+1 (555) 778-9900',
        role: 'MECHANIC',
        availability: 'AVAILABLE',
        badgeNumber: 'TECH-7701',
        experienceYears: 8,
        specialties: ['Powertrain Diagnostics', 'High-Voltage Battery'],
        assignedServiceCenterId: 'sc-1'
      },
      'fs-mech-2': {
        id: 'fs-mech-2',
        name: 'Jordan Hayes',
        email: 'jordan.hayes@fleetops.com',
        phone: '+1 (555) 889-1122',
        role: 'MECHANIC',
        availability: 'BUSY',
        badgeNumber: 'TECH-8802',
        experienceYears: 5,
        specialties: ['Brakes & Suspension'],
        assignedServiceCenterId: 'sc-1'
      }
    },
    serviceCenters: {
      'sc-1': {
        id: 'sc-1',
        name: 'FleetOps Metro Tech Center',
        address: '500 Tech Blvd',
        city: 'San Francisco, CA',
        workingStatus: 'OPEN'
      }
    },
    bookings: {
      'bk-pending-1': {
        id: 'bk-pending-1',
        vehicleId: 'veh-1',
        customerId: 'cust-1',
        status: 'PENDING',
        mechanicId: null,
        assignedMechanicId: null
      },
      'bk-approved-1': {
        id: 'bk-approved-1',
        vehicleId: 'veh-1',
        customerId: 'cust-1',
        status: 'APPROVED',
        mechanicId: null,
        assignedMechanicId: null
      },
      'bk-assigned-1': {
        id: 'bk-assigned-1',
        vehicleId: 'veh-1',
        customerId: 'cust-1',
        status: 'ASSIGNED',
        mechanicId: 'fs-mech-1',
        assignedMechanicId: 'fs-mech-1'
      }
    },
    feedback: {}
  };

  // Mock firebaseService methods
  const origGetUserById = firebaseService.getUserById;
  const origGetDocument = firebaseService.getDocument;
  const origUpdateDocument = firebaseService.updateDocument;
  const origGetBookingsByMechanic = firebaseService.getBookingsByMechanic;
  const origGetFeedbacksByMechanic = firebaseService.getFeedbacksByMechanic;

  firebaseService.getUserById = (async (id: string) => {
    return firestoreStorage.users[id] || null;
  }) as any;

  firebaseService.getDocument = (async (col: string, id: string) => {
    return firestoreStorage[col]?.[id] || null;
  }) as any;

  firebaseService.updateDocument = (async (col: string, id: string, updates: any) => {
    if (firestoreStorage[col] && firestoreStorage[col][id]) {
      firestoreStorage[col][id] = { ...firestoreStorage[col][id], ...updates };
      return firestoreStorage[col][id];
    }
    return null;
  }) as any;

  firebaseService.getBookingsByMechanic = (async (mechId: string) => {
    return Object.values(firestoreStorage.bookings).filter(
      (b: any) => b.mechanicId === mechId || b.assignedMechanicId === mechId
    );
  }) as any;

  firebaseService.getFeedbacksByMechanic = (async () => []) as any;

  try {
    // --- Test 1 — Firestore mechanic profile (GET /api/mechanic/profile) ---
    {
      const req: any = {
        user: { userId: 'fs-mech-1', role: 'MECHANIC', email: 'alex.rivera@fleetops.com' }
      };
      const res = createMockRes();
      await getMechanicProfile(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 1 Failed: Status should be 200');
      assert.ok(res.body && res.body.profile, 'Test 1 Failed: Profile object should be returned');
      assert.strictEqual(res.body.profile.id, 'fs-mech-1', 'Profile ID should match');
      assert.strictEqual(res.body.profile.name, 'Alex Rivera', 'Profile name should match');
      assert.strictEqual(res.body.profile.email, 'alex.rivera@fleetops.com', 'Profile email should match');
      assert.strictEqual(res.body.profile.availability, 'AVAILABLE', 'Profile availability should match');
      assert.strictEqual(res.body.profile.serviceCenterName, 'FleetOps Metro Tech Center');
      console.log('Test 1 Passed: Firestore mechanic profile fetched successfully => 200 OK');
    }

    // --- Test 2 — Profile after server restart / independence from dbStore ---
    {
      // Ensure 'fs-mech-1' does NOT exist in in-memory dbStore
      const inMemoryUser = dbStore.getUserById('fs-mech-1');
      assert.strictEqual(inMemoryUser, null, 'User should not exist in transient dbStore');

      const req: any = {
        user: { userId: 'fs-mech-1', role: 'MECHANIC', email: 'alex.rivera@fleetops.com' }
      };
      const res = createMockRes();
      await getMechanicProfile(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 2 Failed: Profile must still exist independently of dbStore');
      assert.strictEqual(res.body.profile.id, 'fs-mech-1');
      console.log('Test 2 Passed: Profile retrieval functions without transient dbStore dependency => 200 OK');
    }

    // --- Test 3 — Update availability (availability = 'BUSY') ---
    {
      const req: any = {
        user: { userId: 'fs-mech-1', role: 'MECHANIC' },
        body: { availability: 'BUSY' }
      };
      const res = createMockRes();
      await updateAvailability(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 3 Failed: Status should be 200');
      assert.strictEqual(res.body.availability, 'BUSY');
      assert.strictEqual(firestoreStorage.users['fs-mech-1'].availability, 'BUSY', 'Firestore record should be updated');
      console.log('Test 3 Passed: Update availability for authenticated mechanic => 200 OK');
    }

    // --- Test 4 — Persist availability ---
    {
      const req: any = {
        user: { userId: 'fs-mech-1', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await getMechanicProfile(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 4 Failed: Status should be 200');
      assert.strictEqual(res.body.profile.availability, 'BUSY', 'Updated availability should persist');
      console.log('Test 4 Passed: Re-fetched profile reflects persisted availability (BUSY) => 200 OK');
    }

    // --- Test 5 — Invalid availability ---
    {
      const req: any = {
        user: { userId: 'fs-mech-1', role: 'MECHANIC' },
        body: { availability: 'ON_VACATION' }
      };
      const res = createMockRes();
      await updateAvailability(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 5 Failed: Invalid availability should return 400');
      console.log('Test 5 Passed: Invalid availability rejected => 400 Bad Request');
    }

    // --- Test 6 — Mechanic isolation (Mechanic A attempts to modify Mechanic B's availability) ---
    {
      const req: any = {
        user: { userId: 'fs-mech-1', role: 'MECHANIC' },
        body: { mechanicId: 'fs-mech-2', availability: 'OFFLINE' }
      };
      const res = createMockRes();
      await updateAvailability(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 6 Failed: Cross-mechanic update should return 403 Forbidden');
      assert.strictEqual(
        firestoreStorage.users['fs-mech-2'].availability,
        'BUSY',
        "Mechanic B's availability must not have changed"
      );
      console.log('Test 6 Passed: Mechanic isolation enforced (Mechanic A cannot modify Mechanic B) => 403 Forbidden');
    }

    // --- Test 7 — Existing security regression: Booking ownership check ---
    {
      // Mechanic 2 tries to update status of Mechanic 1's booking
      const req: any = {
        params: { id: 'bk-assigned-1' },
        body: { status: 'INSPECTION' },
        user: { userId: 'fs-mech-2', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 7 Failed: Unassigned mechanic update should return 403');
      console.log('Test 7 Passed: Booking ownership protection regression test => 403 Forbidden');
    }

    // --- Test 8 — Existing status permission regression: Mechanics cannot perform Admin-only transitions ---
    {
      // Mechanic tries PENDING -> APPROVED
      const reqApprove: any = {
        params: { id: 'bk-pending-1' },
        body: { status: 'APPROVED' },
        user: { userId: 'fs-mech-1', role: 'MECHANIC' }
      };
      const resApprove = createMockRes();
      await updateBookingStatus(reqApprove, resApprove);
      assert.strictEqual(resApprove.statusCode, 403, 'Test 8a Failed: Mechanic PENDING -> APPROVED should return 403');

      // Mechanic tries APPROVED -> ASSIGNED
      const reqAssign: any = {
        params: { id: 'bk-approved-1' },
        body: { status: 'ASSIGNED' },
        user: { userId: 'fs-mech-1', role: 'MECHANIC' }
      };
      const resAssign = createMockRes();
      await updateBookingStatus(reqAssign, resAssign);
      assert.strictEqual(resAssign.statusCode, 403, 'Test 8b Failed: Mechanic APPROVED -> ASSIGNED should return 403');

      console.log('Test 8 Passed: Admin-only transitions blocked for mechanics => 403 Forbidden');
    }

    console.log('\n--- ALL PROFILE & AVAILABILITY TESTS PASSED! ---');
  } finally {
    firebaseService.getUserById = origGetUserById;
    firebaseService.getDocument = origGetDocument;
    firebaseService.updateDocument = origUpdateDocument;
    firebaseService.getBookingsByMechanic = origGetBookingsByMechanic;
    firebaseService.getFeedbacksByMechanic = origGetFeedbacksByMechanic;
  }
}

runProfileAndAvailabilityTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
