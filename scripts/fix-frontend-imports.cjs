const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [from, to] of replacements) {
    if (typeof from === 'string') {
      content = content.split(from).join(to);
    } else {
      content = content.replace(from, to);
    }
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

// 1. LocationPicker.tsx
replaceInFile('frontend/src/components/service-center/LocationPicker.tsx', [
  ["from '../map/LocationButton.tsx'", "from './LocationButton.tsx'"],
  ["from '../map/LocationButton'", "from './LocationButton'"]
]);

// 2. ServiceCenterManagementView.tsx
replaceInFile('frontend/src/components/service-center/ServiceCenterManagementView.tsx', [
  ["from '../DeleteConfirmationModal.tsx'", "from '../common/DeleteConfirmationModal.tsx'"],
  ["from '../DeleteConfirmationModal'", "from '../common/DeleteConfirmationModal'"]
]);

// 3. AddVehicleModal.tsx
replaceInFile('frontend/src/components/vehicle/AddVehicleModal.tsx', [
  ["from '../data/vehicleDatabase.ts'", "from '../../data/vehicleDatabase.ts'"],
  ["from '../data/vehicleDatabase'", "from '../../data/vehicleDatabase'"],
  ["from '../types.ts'", "from '../../types.ts'"],
  ["from '../types'", "from '../../types'"],
  ["from '../utils/vehicleImageHelper.ts'", "from '../../utils/vehicleImageHelper.ts'"],
  ["from '../utils/vehicleImageHelper'", "from '../../utils/vehicleImageHelper'"]
]);

// 4. Vehicle components
for (const file of ['FleetRemindersOverviewModal.tsx', 'MyVehiclesView.tsx', 'ServiceReminderModal.tsx']) {
  replaceInFile(`frontend/src/components/vehicle/${file}`, [
    ["from '../types.ts'", "from '../../types.ts'"],
    ["from '../types'", "from '../../types'"],
    ["from '../services/apiClient.ts'", "from '../../services/apiClient.ts'"],
    ["from '../services/apiClient'", "from '../../services/apiClient'"]
  ]);
}

// 5. Admin components
for (const file of ['UsersView.tsx', 'AuditLogsView.tsx', 'CreateMechanicModal.tsx', 'RBACTestSuiteModal.tsx']) {
  replaceInFile(`frontend/src/components/admin/${file}`, [
    ["from '../types.ts'", "from '../../types.ts'"],
    ["from '../types'", "from '../../types'"],
    ["from '../services/apiClient.ts'", "from '../../services/apiClient.ts'"],
    ["from '../services/apiClient'", "from '../../services/apiClient'"],
    ["from './DeleteConfirmationModal.tsx'", "from '../common/DeleteConfirmationModal.tsx'"],
    ["from './DeleteConfirmationModal'", "from '../common/DeleteConfirmationModal'"]
  ]);
}

// 6. Booking components
for (const file of ['BookingDetailsModal.tsx', 'MyBookingsView.tsx', 'NewServiceModal.tsx']) {
  replaceInFile(`frontend/src/components/booking/${file}`, [
    ["from '../types.ts'", "from '../../types.ts'"],
    ["from '../types'", "from '../../types'"],
    ["from '../services/apiClient.ts'", "from '../../services/apiClient.ts'"],
    ["from '../services/apiClient'", "from '../../services/apiClient'"],
    ["from './DeleteConfirmationModal.tsx'", "from '../common/DeleteConfirmationModal.tsx'"],
    ["from './DeleteConfirmationModal'", "from '../common/DeleteConfirmationModal'"]
  ]);
}

// 7. Auth components
replaceInFile('frontend/src/components/auth/LoginView.tsx', [
  ["from '../services/apiClient.ts'", "from '../../services/apiClient.ts'"],
  ["from '../services/apiClient'", "from '../../services/apiClient'"],
  ["from '../types.ts'", "from '../../types.ts'"],
  ["from '../types'", "from '../../types'"]
]);

// 8. Common & Invoice & Layout
replaceInFile('frontend/src/components/common/EditProfileModal.tsx', [
  ["from '../types.ts'", "from '../../types.ts'"],
  ["from '../services/apiClient.ts'", "from '../../services/apiClient.ts'"]
]);

replaceInFile('frontend/src/components/invoice/InvoicesView.tsx', [
  ["from '../types.ts'", "from '../../types.ts'"],
  ["from '../types'", "from '../../types'"]
]);

replaceInFile('frontend/src/components/layout/Sidebar.tsx', [
  ["from '../types.ts'", "from '../../types.ts'"],
  ["from '../types'", "from '../../types'"]
]);

replaceInFile('frontend/src/components/layout/TopBar.tsx', [
  ["from '../types.ts'", "from '../../types.ts'"],
  ["from '../types'", "from '../../types'"],
  ["from './notifications/NotificationBell.tsx'", "from '../notifications/NotificationBell.tsx'"],
  ["from './notifications/NotificationBell'", "from '../notifications/NotificationBell'"]
]);

// 9. Mechanic components
replaceInFile('frontend/src/components/mechanic/AssignedTasksView.tsx', [
  ["from '../types.ts'", "from '../../types.ts'"],
  ["from '../types'", "from '../../types'"],
  ["from '../services/apiClient.ts'", "from '../../services/apiClient.ts'"],
  ["from '../services/apiClient'", "from '../../services/apiClient'"],
  ["from '../services/socketClient.ts'", "from '../../services/socketClient.ts'"],
  ["from '../services/socketClient'", "from '../../services/socketClient'"],
  ["from './mechanic/MechanicProfileHeader.tsx'", "from './MechanicProfileHeader.tsx'"],
  ["from './mechanic/OBDDiagnosticsModal.tsx'", "from './OBDDiagnosticsModal.tsx'"],
  ["from './mechanic/VehicleInspectionModal.tsx'", "from './VehicleInspectionModal.tsx'"],
  ["from './mechanic/RepairWorkspaceModal.tsx'", "from './RepairWorkspaceModal.tsx'"],
  ["from './mechanic/RepairImagesModal.tsx'", "from './RepairImagesModal.tsx'"],
  ["from './mechanic/SparePartsModal.tsx'", "from './SparePartsModal.tsx'"],
  ["from './mechanic/WorkshopChatModal.tsx'", "from './WorkshopChatModal.tsx'"],
  ["from './mechanic/MechanicAnalyticsView.tsx'", "from './MechanicAnalyticsView.tsx'"]
]);

// 10. DashboardView.tsx
replaceInFile('frontend/src/pages/DashboardView.tsx', [
  ["from './service-center/ServiceCenterDetails.tsx'", "from '../components/service-center/ServiceCenterDetails.tsx'"],
  ["from './service-center/ServiceCenterDetails'", "from '../components/service-center/ServiceCenterDetails'"],
  ["from './map/BookServiceAtCenterModal.tsx'", "from '../components/service-center/BookServiceAtCenterModal.tsx'"],
  ["from './map/BookServiceAtCenterModal'", "from '../components/service-center/BookServiceAtCenterModal'"],
  ["from './customer/CustomerDashboardView.tsx'", "from '../components/customer/CustomerDashboardView.tsx'"],
  ["from './customer/CustomerDashboardView'", "from '../components/customer/CustomerDashboardView'"],
  ["from './admin/AdminDashboardView.tsx'", "from '../components/admin/AdminDashboardView.tsx'"],
  ["from './admin/AdminDashboardView'", "from '../components/admin/AdminDashboardView'"]
]);

// 11. MarketplaceView.tsx
replaceInFile('frontend/src/pages/MarketplaceView.tsx', [
  ["from '../auth/AuthContext.tsx'", "from '../context/AuthContext.tsx'"],
  ["from '../auth/AuthContext'", "from '../context/AuthContext'"]
]);

// 12. apiClient.ts
replaceInFile('frontend/src/services/api/apiClient.ts', [
  ["from '../types.ts'", "from '../../types.ts'"],
  ["from '../types'", "from '../../types'"]
]);

console.log('Done fixing targeted imports!');
