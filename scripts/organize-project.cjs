const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

// Helper to ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('Created dir:', path.relative(rootDir, dirPath));
  }
}

// Helper to copy file
function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('Source file does not exist:', src);
    return false;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
  return true;
}

// 1. Target Directories
const targetDirs = [
  'frontend/public',
  'frontend/src/assets/images',
  'frontend/src/assets/icons',
  'frontend/src/assets/vehicles',
  'frontend/src/components/common',
  'frontend/src/components/layout',
  'frontend/src/components/auth',
  'frontend/src/components/customer',
  'frontend/src/components/mechanic',
  'frontend/src/components/admin',
  'frontend/src/components/booking',
  'frontend/src/components/vehicle',
  'frontend/src/components/invoice',
  'frontend/src/components/feedback',
  'frontend/src/components/notifications',
  'frontend/src/components/service-center',
  'frontend/src/pages/auth',
  'frontend/src/pages/customer',
  'frontend/src/pages/mechanic',
  'frontend/src/pages/admin',
  'frontend/src/services/api',
  'frontend/src/services/auth',
  'frontend/src/services/customer',
  'frontend/src/services/mechanic',
  'frontend/src/services/admin',
  'frontend/src/hooks',
  'frontend/src/context',
  'frontend/src/types',
  'frontend/src/utils',
  'frontend/src/constants',
  'frontend/src/routes',
  'backend/src/config',
  'backend/src/controllers',
  'backend/src/middleware',
  'backend/src/middlewares',
  'backend/src/routes',
  'backend/src/services',
  'backend/src/models',
  'backend/src/utils',
  'backend/src/types',
  'backend/src/validators',
  'backend/src/sockets',
  'backend/tests',
  'docs/diagrams',
  'docs/report',
  'docs/system-design',
  'scripts'
];

targetDirs.forEach(d => ensureDir(path.join(rootDir, d)));

// 2. Docs Moves
if (fs.existsSync(path.join(rootDir, 'SYSTEM_DESIGN.md'))) {
  copyFile(path.join(rootDir, 'SYSTEM_DESIGN.md'), path.join(rootDir, 'docs/system-design/SYSTEM_DESIGN.md'));
}
if (fs.existsSync(path.join(rootDir, 'postman_collection.json'))) {
  copyFile(path.join(rootDir, 'postman_collection.json'), path.join(rootDir, 'docs/postman_collection.json'));
}

// 3. Frontend Public
if (fs.existsSync(path.join(rootDir, 'public'))) {
  const pubFiles = fs.readdirSync(path.join(rootDir, 'public'));
  pubFiles.forEach(f => {
    copyFile(path.join(rootDir, 'public', f), path.join(rootDir, 'frontend/public', f));
  });
}

// 4. Assets
if (fs.existsSync(path.join(rootDir, 'src/assets/images'))) {
  const imgFiles = fs.readdirSync(path.join(rootDir, 'src/assets/images'));
  imgFiles.forEach(f => {
    copyFile(path.join(rootDir, 'src/assets/images', f), path.join(rootDir, 'frontend/src/assets/images', f));
    if (f.startsWith('vehicle_')) {
      copyFile(path.join(rootDir, 'src/assets/images', f), path.join(rootDir, 'frontend/src/assets/vehicles', f));
    }
  });
}

// 5. Types
copyFile(path.join(rootDir, 'src/types.ts'), path.join(rootDir, 'frontend/src/types/index.ts'));
copyFile(path.join(rootDir, 'src/types.ts'), path.join(rootDir, 'backend/src/types/index.ts'));

// 6. Permissions
copyFile(path.join(rootDir, 'src/permissions/rolePermissions.ts'), path.join(rootDir, 'frontend/src/permissions/rolePermissions.ts'));
copyFile(path.join(rootDir, 'src/permissions/rolePermissions.ts'), path.join(rootDir, 'backend/src/permissions/rolePermissions.ts'));

// 7. Utils
if (fs.existsSync(path.join(rootDir, 'src/utils'))) {
  const utilFiles = fs.readdirSync(path.join(rootDir, 'src/utils'));
  utilFiles.forEach(f => {
    copyFile(path.join(rootDir, 'src/utils', f), path.join(rootDir, 'frontend/src/utils', f));
    copyFile(path.join(rootDir, 'src/utils', f), path.join(rootDir, 'backend/src/utils', f));
  });
}

// 8. Frontend Context & Auth
copyFile(path.join(rootDir, 'src/auth/AuthContext.tsx'), path.join(rootDir, 'frontend/src/context/AuthContext.tsx'));
copyFile(path.join(rootDir, 'src/auth/ProtectedRoute.tsx'), path.join(rootDir, 'frontend/src/context/ProtectedRoute.tsx'));

// 9. Frontend Services
copyFile(path.join(rootDir, 'src/services/apiClient.ts'), path.join(rootDir, 'frontend/src/services/apiClient.ts'));
copyFile(path.join(rootDir, 'src/services/apiClient.ts'), path.join(rootDir, 'frontend/src/services/api/apiClient.ts'));
copyFile(path.join(rootDir, 'src/services/socketClient.ts'), path.join(rootDir, 'frontend/src/services/socketClient.ts'));

// 10. Frontend Components
// Common / Layout
copyFile(path.join(rootDir, 'src/components/Sidebar.tsx'), path.join(rootDir, 'frontend/src/components/layout/Sidebar.tsx'));
copyFile(path.join(rootDir, 'src/components/TopBar.tsx'), path.join(rootDir, 'frontend/src/components/layout/TopBar.tsx'));
copyFile(path.join(rootDir, 'src/components/DeleteConfirmationModal.tsx'), path.join(rootDir, 'frontend/src/components/common/DeleteConfirmationModal.tsx'));
copyFile(path.join(rootDir, 'src/components/EditProfileModal.tsx'), path.join(rootDir, 'frontend/src/components/common/EditProfileModal.tsx'));

// Auth
copyFile(path.join(rootDir, 'src/components/LoginView.tsx'), path.join(rootDir, 'frontend/src/components/auth/LoginView.tsx'));

// Customer
const custFiles = fs.readdirSync(path.join(rootDir, 'src/components/customer'));
custFiles.forEach(f => {
  copyFile(path.join(rootDir, 'src/components/customer', f), path.join(rootDir, 'frontend/src/components/customer', f));
});

// Mechanic
const mechFiles = fs.readdirSync(path.join(rootDir, 'src/components/mechanic'));
mechFiles.forEach(f => {
  copyFile(path.join(rootDir, 'src/components/mechanic', f), path.join(rootDir, 'frontend/src/components/mechanic', f));
});
copyFile(path.join(rootDir, 'src/components/AssignedTasksView.tsx'), path.join(rootDir, 'frontend/src/components/mechanic/AssignedTasksView.tsx'));

// Admin
const adminFiles = fs.readdirSync(path.join(rootDir, 'src/components/admin'));
adminFiles.forEach(f => {
  copyFile(path.join(rootDir, 'src/components/admin', f), path.join(rootDir, 'frontend/src/components/admin', f));
});
copyFile(path.join(rootDir, 'src/components/AuditLogsView.tsx'), path.join(rootDir, 'frontend/src/components/admin/AuditLogsView.tsx'));
copyFile(path.join(rootDir, 'src/components/UsersView.tsx'), path.join(rootDir, 'frontend/src/components/admin/UsersView.tsx'));
copyFile(path.join(rootDir, 'src/components/CreateMechanicModal.tsx'), path.join(rootDir, 'frontend/src/components/admin/CreateMechanicModal.tsx'));
copyFile(path.join(rootDir, 'src/components/AssignMechanicModal.tsx'), path.join(rootDir, 'frontend/src/components/admin/AssignMechanicModal.tsx'));
copyFile(path.join(rootDir, 'src/components/RBACTestSuiteModal.tsx'), path.join(rootDir, 'frontend/src/components/admin/RBACTestSuiteModal.tsx'));
copyFile(path.join(rootDir, 'src/components/PostmanViewerModal.tsx'), path.join(rootDir, 'frontend/src/components/admin/PostmanViewerModal.tsx'));

// Booking
copyFile(path.join(rootDir, 'src/components/MyBookingsView.tsx'), path.join(rootDir, 'frontend/src/components/booking/MyBookingsView.tsx'));
copyFile(path.join(rootDir, 'src/components/NewServiceModal.tsx'), path.join(rootDir, 'frontend/src/components/booking/NewServiceModal.tsx'));
copyFile(path.join(rootDir, 'src/components/BookingDetailsModal.tsx'), path.join(rootDir, 'frontend/src/components/booking/BookingDetailsModal.tsx'));

// Vehicle
copyFile(path.join(rootDir, 'src/components/MyVehiclesView.tsx'), path.join(rootDir, 'frontend/src/components/vehicle/MyVehiclesView.tsx'));
copyFile(path.join(rootDir, 'src/components/AddVehicleModal.tsx'), path.join(rootDir, 'frontend/src/components/vehicle/AddVehicleModal.tsx'));
copyFile(path.join(rootDir, 'src/components/ServiceReminderModal.tsx'), path.join(rootDir, 'frontend/src/components/vehicle/ServiceReminderModal.tsx'));
copyFile(path.join(rootDir, 'src/components/FleetRemindersOverviewModal.tsx'), path.join(rootDir, 'frontend/src/components/vehicle/FleetRemindersOverviewModal.tsx'));

// Invoice
copyFile(path.join(rootDir, 'src/components/InvoicesView.tsx'), path.join(rootDir, 'frontend/src/components/invoice/InvoicesView.tsx'));

// Notifications
const notifFiles = fs.readdirSync(path.join(rootDir, 'src/components/notifications'));
notifFiles.forEach(f => {
  copyFile(path.join(rootDir, 'src/components/notifications', f), path.join(rootDir, 'frontend/src/components/notifications', f));
});

// Service Centers / Map
const scFiles = fs.readdirSync(path.join(rootDir, 'src/components/service-center'));
scFiles.forEach(f => {
  copyFile(path.join(rootDir, 'src/components/service-center', f), path.join(rootDir, 'frontend/src/components/service-center', f));
});
if (fs.existsSync(path.join(rootDir, 'src/components/map'))) {
  const mapFiles = fs.readdirSync(path.join(rootDir, 'src/components/map'));
  mapFiles.forEach(f => {
    copyFile(path.join(rootDir, 'src/components/map', f), path.join(rootDir, 'frontend/src/components/service-center', f));
  });
}

// Pages
copyFile(path.join(rootDir, 'src/components/HomePage.tsx'), path.join(rootDir, 'frontend/src/pages/HomePage.tsx'));
copyFile(path.join(rootDir, 'src/components/DashboardView.tsx'), path.join(rootDir, 'frontend/src/pages/DashboardView.tsx'));
copyFile(path.join(rootDir, 'src/components/MarketplaceView.tsx'), path.join(rootDir, 'frontend/src/pages/MarketplaceView.tsx'));

// App, main, index.css
copyFile(path.join(rootDir, 'src/App.tsx'), path.join(rootDir, 'frontend/src/App.tsx'));
copyFile(path.join(rootDir, 'src/index.css'), path.join(rootDir, 'frontend/src/index.css'));
copyFile(path.join(rootDir, 'src/data/vehicleDatabase.ts'), path.join(rootDir, 'frontend/src/data/vehicleDatabase.ts'));

// 11. Backend Files
// Config
copyFile(path.join(rootDir, 'src/config/index.ts'), path.join(rootDir, 'backend/src/config/index.ts'));
copyFile(path.join(rootDir, 'src/data/vehicleDatabase.ts'), path.join(rootDir, 'backend/src/data/vehicleDatabase.ts'));

// Controllers
const ctrlFiles = fs.readdirSync(path.join(rootDir, 'src/controllers'));
ctrlFiles.forEach(f => {
  copyFile(path.join(rootDir, 'src/controllers', f), path.join(rootDir, 'backend/src/controllers', f));
});

// Middlewares
const mwFiles = fs.readdirSync(path.join(rootDir, 'src/middlewares'));
mwFiles.forEach(f => {
  copyFile(path.join(rootDir, 'src/middlewares', f), path.join(rootDir, 'backend/src/middlewares', f));
  copyFile(path.join(rootDir, 'src/middlewares', f), path.join(rootDir, 'backend/src/middleware', f));
});

// Routes
const routeFiles = fs.readdirSync(path.join(rootDir, 'src/routes'));
routeFiles.forEach(f => {
  copyFile(path.join(rootDir, 'src/routes', f), path.join(rootDir, 'backend/src/routes', f));
});

// Services
const svcFiles = fs.readdirSync(path.join(rootDir, 'src/services'));
svcFiles.forEach(f => {
  // don't overwrite backend firebaseService with client one!
  if (f === 'firebaseService.ts') return;
  copyFile(path.join(rootDir, 'src/services', f), path.join(rootDir, 'backend/src/services', f));
});

// Sockets
copyFile(path.join(rootDir, 'backend/src/services/socketService.ts'), path.join(rootDir, 'backend/src/sockets/socketService.ts'));

// Server
copyFile(path.join(rootDir, 'server.ts'), path.join(rootDir, 'backend/src/server.ts'));

console.log('✅ All target files successfully populated into professional structure!');
