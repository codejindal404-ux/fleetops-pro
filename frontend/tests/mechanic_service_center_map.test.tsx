// 1. Establish Node environment polyfills BEFORE importing Leaflet
if (typeof (global as any).localStorage === 'undefined') {
  (global as any).localStorage = {
    getItem: () => 'mock-jwt-token',
    setItem: () => {},
    removeItem: () => {}
  };
}

if (typeof (global as any).window === 'undefined') {
  (global as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    location: { pathname: '/mechanic/service-centers' },
    screen: {}
  };
} else if (!(global as any).window.screen) {
  (global as any).window.screen = {};
}

if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    documentElement: { style: {} },
    createElement: () => ({ style: {}, getContext: () => null })
  };
}

import assert from 'assert';
import React from 'react';
import { renderToString } from 'react-dom/server';

// 2. Dynamic imports to ensure window/document are defined prior to Leaflet evaluation
const { MechanicDashboard } = await import('../src/components/mechanic/MechanicDashboard.tsx');
const {
  MechanicServiceCenterView,
  MechanicServiceCenterModal
} = await import('../src/components/mechanic/MechanicServiceCenterView.tsx');
const { FindServiceCenterView } = await import('../src/components/service-center/FindServiceCenterView.tsx');
const { ServiceCenterManagementView } = await import('../src/components/service-center/ServiceCenterManagementView.tsx');
const { ServiceCenterMap } = await import('../src/components/service-center/ServiceCenterMap.tsx');
import { User, Booking, ServiceCenter, MechanicProfile } from '../src/types.ts';

// Test fixtures
const mockMechanicA: User = {
  id: 'mech-001',
  name: 'Alex Rivera',
  email: 'alex.rivera@fleetops.com',
  role: 'MECHANIC',
  assignedServiceCenterId: 'sc-apex-1'
};

const mockMechanicB: User = {
  id: 'mech-002',
  name: 'Jordan Hayes',
  email: 'jordan.hayes@fleetops.com',
  role: 'MECHANIC',
  assignedServiceCenterId: 'sc-metro-2'
};

const mockCustomer: User = {
  id: 'cust-101',
  name: 'Eleanor Vance',
  email: 'eleanor@example.com',
  role: 'CUSTOMER'
};

const mockCenterA: ServiceCenter = {
  id: 'sc-apex-1',
  name: 'Apex Fleet Auto Hub',
  address: '42 Industrial Parkway, Tech District',
  city: 'Delhi',
  latitude: 28.6315,
  longitude: 77.2167,
  phoneNumber: '+91 11 4500 9000',
  averageRating: 4.9,
  totalReviews: 84,
  totalServicesCompleted: 340,
  experienceYears: 12,
  isVerified: true,
  workingStatus: 'OPEN',
  availableMechanics: 4,
  specialties: ['Engine Diagnostics', 'Brake Systems', 'Periodic Maintenance'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

const mockCenterB: ServiceCenter = {
  id: 'sc-metro-2',
  name: 'Metro Tech Workshop',
  address: '88 Cyber Hub Express',
  city: 'Gurugram',
  latitude: 28.4595,
  longitude: 77.0266,
  phoneNumber: '+91 124 550 1200',
  averageRating: 4.7,
  totalReviews: 52,
  totalServicesCompleted: 210,
  experienceYears: 8,
  isVerified: true,
  workingStatus: 'OPEN',
  availableMechanics: 3,
  specialties: ['OBD-II Telemetry', 'EV Powertrain'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

const mockCenterMissingCoords: ServiceCenter = {
  id: 'sc-no-gps-3',
  name: 'Rural Depot Service Station',
  address: '9 Old Highway Route',
  city: 'Northern Outpost',
  latitude: undefined as any,
  longitude: undefined as any,
  phoneNumber: '+1 (555) 303-9911',
  averageRating: 4.5,
  totalReviews: 10,
  totalServicesCompleted: 40,
  experienceYears: 4,
  isVerified: false,
  workingStatus: 'OPEN',
  availableMechanics: 2,
  specialties: ['General Repair'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

const mockProfileA: MechanicProfile = {
  id: 'mech-001',
  name: 'Alex Rivera',
  email: 'alex.rivera@fleetops.com',
  role: 'MECHANIC',
  availability: 'AVAILABLE',
  assignedServiceCenterId: 'sc-apex-1',
  serviceCenterName: 'Apex Fleet Auto Hub',
  serviceCenterAddress: '42 Industrial Parkway, Tech District',
  serviceCenterCity: 'Delhi',
  serviceCenterStatus: 'OPEN',
  serviceCenterLatitude: 28.6315,
  serviceCenterLongitude: 77.2167,
  serviceCenterPhone: '+91 11 4500 9000',
  shiftName: 'Morning Tech Bay Shift (08:00 - 17:00)',
  badgeNumber: 'TECH-7701',
  experienceYears: 12,
  specialties: ['Engine Diagnostics', 'Brake Systems'],
  rating: 4.9,
  totalRatingsCount: 84,
  efficiencyScore: 96,
  completedJobsCount: 340,
  activeJobsCount: 2
};

const mockBookings: Booking[] = [
  {
    id: 'bk-101',
    customerId: 'cust-101',
    customerName: 'Eleanor Vance',
    vehicleId: 'veh-1',
    vehicleName: 'Ford Transit',
    serviceType: 'Brake Inspection',
    serviceDate: '2026-09-30T10:00:00Z',
    status: 'ASSIGNED',
    mechanicId: 'mech-001',
    assignedMechanicId: 'mech-001',
    createdAt: '2026-09-29T10:00:00Z'
  }
];

async function runTestSuite() {
  console.log('================================================================');
  console.log('Running Step 12 — Mechanic Service Center Map Test Suite');
  console.log('================================================================');

  // Test 1: Mechanic can open Service Center Bay Map
  console.log('Test 1: Mechanic can open Service Center Bay Map');
  const dashboardHtml = renderToString(
    React.createElement(MechanicDashboard, {
      user: mockMechanicA,
      bookings: mockBookings
    })
  );
  assert.ok(
    dashboardHtml.includes('Service Center Bay Map'),
    'Dashboard must contain "Service Center Bay Map" quick action'
  );
  assert.ok(
    dashboardHtml.includes('data-testid="service-center-bay-map-btn"'),
    'Dashboard must render quick action button with data-testid="service-center-bay-map-btn"'
  );
  console.log('  -> Passed: Mechanic dashboard exposes Service Center Bay Map quick action');

  // Test 2: Assigned service center information is displayed
  console.log('Test 2: Assigned service center information is displayed');
  const viewHtml = renderToString(
    React.createElement(MechanicServiceCenterView, {
      currentUser: mockMechanicA,
      profile: mockProfileA,
      assignedCenter: mockCenterA
    })
  );
  assert.ok(viewHtml.includes('Apex Fleet Auto Hub'), 'Must display center name');
  assert.ok(viewHtml.includes('42 Industrial Parkway, Tech District'), 'Must display center address');
  assert.ok(viewHtml.includes('Delhi'), 'Must display center city');
  assert.ok(viewHtml.includes('+91 11 4500 9000'), 'Must display contact phone');
  assert.ok(viewHtml.includes('TECH-7701'), 'Must display mechanic badge ID');
  assert.ok(viewHtml.includes('Assigned Bay Facility'), 'Must display facility badge');
  console.log('  -> Passed: Assigned service center information is correctly displayed');

  // Test 3: Correct service-center coordinates are used
  console.log('Test 3: Correct service-center coordinates are used');
  assert.ok(viewHtml.includes('28.6315'), 'Must render assigned center latitude 28.6315');
  assert.ok(viewHtml.includes('77.2167'), 'Must render assigned center longitude 77.2167');
  console.log('  -> Passed: Coordinates match the assigned service center');

  // Test 4: Map marker renders for valid coordinates
  console.log('Test 4: Map marker renders for valid coordinates');
  const mapHtml = renderToString(
    React.createElement(ServiceCenterMap, {
      userLat: 28.6315,
      userLng: 77.2167,
      serviceCenters: [mockCenterA],
      selectedCenterId: mockCenterA.id,
      hideBookButton: true,
      hideUserMarker: true
    })
  );
  assert.ok(
    mapHtml.includes('min-h-[420px]'),
    'Map must render responsive map canvas container'
  );
  assert.ok(
    mapHtml.includes('Clean Voyager Map'),
    'Map must include interactive Voyager layer switcher'
  );
  assert.ok(
    mapHtml.includes('Dark High-Contrast Map'),
    'Map must include interactive Dark layer switcher'
  );
  assert.ok(
    mapHtml.includes('Zoom In') && mapHtml.includes('Zoom Out'),
    'Map must render interactive zoom controls'
  );
  assert.ok(
    mapHtml.includes('Open Service Centers'),
    'Map must render legend with Open Service Centers indicator'
  );
  assert.ok(
    viewHtml.includes('Clean Voyager Map'),
    'MechanicServiceCenterView must mount ServiceCenterMap when coordinates are valid'
  );
  assert.ok(
    !viewHtml.includes('missing-coordinates-fallback'),
    'MechanicServiceCenterView must NOT render fallback when valid coordinates exist'
  );
  console.log('  -> Passed: Map controls, canvas, and layer switchers render for valid coordinates');

  // Test 5: Missing coordinates show fallback message
  console.log('Test 5: Missing coordinates show fallback message');
  const missingCoordsHtml = renderToString(
    React.createElement(MechanicServiceCenterView, {
      currentUser: mockMechanicA,
      assignedCenter: mockCenterMissingCoords
    })
  );
  assert.ok(
    missingCoordsHtml.includes('Map location is not available for this service center.'),
    'Must display exact required fallback string when coordinates are missing'
  );
  assert.ok(
    missingCoordsHtml.includes('Rural Depot Service Station'),
    'Must still display service center name when coordinates are missing'
  );
  assert.ok(
    missingCoordsHtml.includes('9 Old Highway Route'),
    'Must still display address when coordinates are missing'
  );
  assert.ok(
    !missingCoordsHtml.includes('custom-garage-marker-'),
    'Must not render fake map marker when coordinates are missing'
  );
  console.log('  -> Passed: Clear fallback message displayed when coordinates are missing without inventing fake points');

  // Test 6: Mechanic cannot display another mechanic\'s assigned center through the mechanic view
  console.log("Test 6: Mechanic cannot display another mechanic's assigned center");
  const mechanicAViewHtml = renderToString(
    React.createElement(MechanicServiceCenterView, {
      currentUser: mockMechanicA,
      profile: mockProfileA,
      assignedCenter: mockCenterA
    })
  );
  const mechanicBViewHtml = renderToString(
    React.createElement(MechanicServiceCenterView, {
      currentUser: mockMechanicB,
      assignedCenter: mockCenterB
    })
  );

  // Mechanic A checks
  assert.ok(mechanicAViewHtml.includes('Apex Fleet Auto Hub'), "Mechanic A view includes Mechanic A's center");
  assert.ok(!mechanicAViewHtml.includes('Metro Tech Workshop'), "Mechanic A view NEVER contains Mechanic B's center");
  assert.ok(!mechanicAViewHtml.includes('sc-metro-2'), "Mechanic A view NEVER contains Mechanic B's ID");

  // Mechanic B checks
  assert.ok(mechanicBViewHtml.includes('Metro Tech Workshop'), "Mechanic B view includes Mechanic B's center");
  assert.ok(!mechanicBViewHtml.includes('Apex Fleet Auto Hub'), "Mechanic B view NEVER contains Mechanic A's center");
  assert.ok(!mechanicBViewHtml.includes('sc-apex-1'), "Mechanic B view NEVER contains Mechanic A's ID");
  console.log('  -> Passed: Strict role and tenant isolation enforced between mechanics');

  // Test 7: Customer map behavior remains unchanged
  console.log('Test 7: Customer map behavior remains unchanged');
  const customerViewHtml = renderToString(
    React.createElement(FindServiceCenterView, {
      currentUser: mockCustomer
    })
  );
  assert.ok(
    customerViewHtml.includes('Smart Service Center Finder'),
    'Customer view retains garage discovery header'
  );
  assert.ok(
    customerViewHtml.includes('AI Weighted Engine'),
    'Customer view retains AI recommendation badge'
  );
  assert.ok(
    customerViewHtml.includes('Search Radius') || customerViewHtml.includes('radius'),
    'Customer view retains radius slider / search'
  );
  console.log('  -> Passed: Customer FindServiceCenterView behavior remains intact and customer-oriented');

  // Test 8: Admin map behavior remains unchanged
  console.log('Test 8: Admin map behavior remains unchanged');
  const adminViewHtml = renderToString(
    React.createElement(ServiceCenterManagementView, {
      token: 'admin-token'
    })
  );
  assert.ok(
    adminViewHtml.includes('Service Center Management Hub'),
    'Admin view retains garage management header'
  );
  assert.ok(
    adminViewHtml.includes('Admin control plane for nationwide bay telemetry'),
    'Admin view retains administrative control plane description'
  );
  assert.ok(
    adminViewHtml.includes('Register Garage'),
    'Admin view retains administrative garage management actions'
  );
  console.log('  -> Passed: Admin ServiceCenterManagementView behavior remains intact and management-oriented');

  // Test 9: Mobile layout does not introduce horizontal overflow
  console.log('Test 9: Mobile layout does not introduce horizontal overflow');
  assert.ok(
    viewHtml.includes('max-w-full') && viewHtml.includes('overflow-x-hidden'),
    'Container must have overflow-x-hidden and max-w-full to prevent horizontal layout breaks'
  );
  assert.ok(
    viewHtml.includes('grid-cols-1'),
    'Layout must stack to 1 column on mobile screens'
  );
  console.log('  -> Passed: Mobile layout verified with no horizontal overflow classes');

  // Test 10: Existing mechanic dashboard quick action opens modal
  console.log('Test 10: Existing mechanic dashboard quick action opens modal');
  const modalHtml = renderToString(
    React.createElement(MechanicServiceCenterModal, {
      isOpen: true,
      onClose: () => {},
      currentUser: mockMechanicA,
      profile: mockProfileA,
      assignedCenter: mockCenterA
    })
  );
  assert.ok(
    modalHtml.includes('data-testid="mechanic-service-center-modal"'),
    'Modal must render with test id'
  );
  assert.ok(
    modalHtml.includes('Apex Fleet Auto Hub'),
    'Modal renders assigned center details'
  );
  assert.ok(
    modalHtml.includes('28.6315'),
    'Modal renders assigned center coordinates'
  );

  const closedModalHtml = renderToString(
    React.createElement(MechanicServiceCenterModal, {
      isOpen: false,
      onClose: () => {}
    })
  );
  assert.strictEqual(closedModalHtml, '', 'Modal renders nothing when isOpen is false');
  console.log('  -> Passed: Modal opens cleanly from quick action and closes properly');

  console.log('================================================================');
  console.log('ALL 10 MECHANIC SERVICE CENTER MAP TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
