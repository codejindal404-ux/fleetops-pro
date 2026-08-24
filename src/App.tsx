import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { MyVehiclesView } from './components/MyVehiclesView.tsx';
import { MyBookingsView } from './components/MyBookingsView.tsx';
import { AssignedTasksView } from './components/AssignedTasksView.tsx';
import { InvoicesView } from './components/InvoicesView.tsx';
import { UsersView } from './components/UsersView.tsx';
import { AuditLogsView } from './components/AuditLogsView.tsx';
import { MarketplaceView } from './components/MarketplaceView.tsx';
import { FindServiceCenterView } from './components/map/FindServiceCenterView.tsx';
import { ServiceCenterManagementView } from './components/service-center/ServiceCenterManagementView.tsx';
import { RBACTestSuiteModal } from './components/RBACTestSuiteModal.tsx';
import { PostmanViewerModal } from './components/PostmanViewerModal.tsx';
import { NewServiceModal } from './components/NewServiceModal.tsx';
import { AddVehicleModal } from './components/AddVehicleModal.tsx';
import { BookingDetailsModal } from './components/BookingDetailsModal.tsx';
import { EditProfileModal } from './components/EditProfileModal.tsx';
import { LoginView } from './components/LoginView.tsx';
import { CustomerRewardsView } from './components/customer/CustomerRewardsView.tsx';
import { CustomerProfileView } from './components/customer/CustomerProfileView.tsx';
import { CustomerBottomNav } from './components/customer/CustomerBottomNav.tsx';
import { AdminInventoryView } from './components/admin/AdminInventoryView.tsx';
import { AdminReportsView } from './components/admin/AdminReportsView.tsx';
import { AuthProvider, useAuth } from './auth/AuthContext.tsx';
import { ProtectedRoute } from './auth/ProtectedRoute.tsx';

import { apiClient } from './services/apiClient.ts';
import { User, Vehicle, Booking, Invoice, Role } from './types.ts';

function MainAppContent() {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('tasks');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/login';
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Modals
  const [isPostmanOpen, setIsPostmanOpen] = useState<boolean>(false);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState<boolean>(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isRBACTestSuiteOpen, setIsRBACTestSuiteOpen] = useState<boolean>(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [preselectedVehicleForService, setPreselectedVehicleForService] = useState<Vehicle | null>(null);
  const [pendingAuthForLogin, setPendingAuthForLogin] = useState<{ pendingToken: string; email: string } | null>(null);

  // Router navigation helper
  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
      setCurrentPath(path);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load user data once authenticated
  const loadUserData = async (u: User) => {
    try {
      const [vList, bList, iList] = await Promise.all([
        apiClient.getVehicles(),
        apiClient.getBookings(),
        apiClient.getInvoices()
      ]);

      setVehicles(vList);
      setBookings(bList);
      setInvoices(iList);

      if (u.role === 'MECHANIC') setActiveTab('tasks');
      else setActiveTab('dashboard');
    } catch (err) {
      console.warn('Error fetching user data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData(user);
    }
  }, [user]);

  // Role tab safety guard
  useEffect(() => {
    if (user?.role === 'MECHANIC' && (activeTab === 'bookings' || activeTab === 'all-bookings' || activeTab === 'users' || activeTab === 'audit-logs')) {
      setActiveTab('tasks');
    } else if (user?.role === 'CUSTOMER' && (activeTab === 'tasks' || activeTab === 'all-bookings' || activeTab === 'users' || activeTab === 'audit-logs')) {
      setActiveTab('dashboard');
    }
  }, [user, activeTab]);

  // Custom Navigation Event Listener
  useEffect(() => {
    const handleCustomNavigate = (e: any) => {
      const targetTab = e.detail;
      if (targetTab === 'find-service-center' || targetTab === 'service-centers') {
        setActiveTab('service-centers');
      } else if (targetTab === 'my-vehicles' || targetTab === 'vehicles') {
        setActiveTab('vehicles');
      } else if (targetTab === 'my-bookings' || targetTab === 'bookings') {
        setActiveTab('bookings');
      } else if (targetTab === 'reminders') {
        setActiveTab('vehicles');
      } else {
        setActiveTab(targetTab);
      }
    };

    const handleOpenAddVeh = () => {
      setIsAddVehicleOpen(true);
    };

    window.addEventListener('fleetops:navigate', handleCustomNavigate as EventListener);
    window.addEventListener('fleetops:open-add-vehicle', handleOpenAddVeh as EventListener);

    return () => {
      window.removeEventListener('fleetops:navigate', handleCustomNavigate as EventListener);
      window.removeEventListener('fleetops:open-add-vehicle', handleOpenAddVeh as EventListener);
    };
  }, []);

  // Route protection and automatic route sync
  useEffect(() => {
    if (user) {
      if (user.role === 'CUSTOMER') {
        if (
          currentPath === '/team/login' ||
          currentPath === '/login' ||
          currentPath.startsWith('/admin') ||
          currentPath.startsWith('/mechanic')
        ) {
          navigate('/dashboard');
        }
      } else if (user.role === 'ADMIN' || user.role === 'MECHANIC') {
        if (currentPath === '/login' || currentPath === '/team/login') {
          if (user.role === 'MECHANIC') navigate('/mechanic/tasks');
          else navigate('/admin/dashboard');
        }
      }
    } else {
      if (
        currentPath.startsWith('/admin') ||
        currentPath.startsWith('/mechanic') ||
        currentPath.startsWith('/team')
      ) {
        if (currentPath !== '/team/login') {
          navigate('/team/login');
        }
      } else if (currentPath === '/' || currentPath === '') {
        navigate('/login');
      }
    }
  }, [user, currentPath]);

  // Handle successful login or registration
  const handleLoginSuccess = async (loggedInUser: User) => {
    setPendingAuthForLogin(null);
    await refreshUser();
    await loadUserData(loggedInUser);

    if (loggedInUser.role === 'MECHANIC') {
      setActiveTab('tasks');
      navigate('/mechanic/tasks');
    } else if (loggedInUser.role === 'ADMIN') {
      setActiveTab('dashboard');
      navigate('/admin/dashboard');
    } else {
      setActiveTab('dashboard');
      navigate('/dashboard');
    }
  };

  // Handle explicit Logout
  const handleLogout = () => {
    const wasStaff = user?.role === 'ADMIN' || user?.role === 'MECHANIC';
    logout();
    setVehicles([]);
    setBookings([]);
    setInvoices([]);
    setPendingAuthForLogin(null);
    if (wasStaff) {
      navigate('/team/login');
    } else {
      navigate('/login');
    }
  };

  // Service Booking submit
  const handleCreateBooking = async (vehicleId: string, serviceType: string, preferredDate: string) => {
    try {
      await apiClient.createBooking({ vehicleId, serviceType, preferredDate });
      const [vList, bList] = await Promise.all([apiClient.getVehicles(), apiClient.getBookings()]);
      setVehicles(vList);
      setBookings(bList);
    } catch (err: any) {
      alert(err.message || 'Failed to submit booking request');
    }
  };

  // Add vehicle
  const handleAddVehicle = async (vData: any) => {
    try {
      await apiClient.addVehicle(vData);
      const vList = await apiClient.getVehicles();
      setVehicles(vList);
    } catch (err: any) {
      alert(err.message || 'Failed to add vehicle');
    }
  };

  // Delete vehicle
  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await apiClient.deleteVehicle(id);
      const vList = await apiClient.getVehicles();
      setVehicles(vList);
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  // Update status
  const handleUpdateStatus = async (bookingId: string, status: string, mileage?: number) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (mileage !== undefined && mileage !== null && booking?.vehicleId) {
        await apiClient.updateVehicle(booking.vehicleId, { mileage });
      }
      await apiClient.updateBookingStatus(bookingId, status);
      const [bList, vList] = await Promise.all([apiClient.getBookings(), apiClient.getVehicles()]);
      setBookings(bList);
      setVehicles(vList);
      if (selectedBookingDetails?.id === bookingId) {
        const updated = await apiClient.getBookingById(bookingId);
        setSelectedBookingDetails(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update booking status');
    }
  };

  // Assign mechanic
  const handleAssignMechanic = async (bookingId: string, mechanicId: string) => {
    try {
      await apiClient.assignMechanic(bookingId, mechanicId);
      const bList = await apiClient.getBookings();
      setBookings(bList);
    } catch (err: any) {
      alert(err.message || 'Failed to assign mechanic');
    }
  };

  // Add repair log
  const handleAddRepairLog = async (bookingId: string, note: string) => {
    try {
      await apiClient.addRepairLog(bookingId, note);
      const bList = await apiClient.getBookings();
      setBookings(bList);
      if (selectedBookingDetails?.id === bookingId) {
        const updated = await apiClient.getBookingById(bookingId);
        setSelectedBookingDetails(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add repair log');
    }
  };

  // Pay invoice
  const handlePayInvoice = async (invoiceId: string) => {
    try {
      await apiClient.payInvoice(invoiceId);
      const [iList, bList] = await Promise.all([apiClient.getInvoices(), apiClient.getBookings()]);
      setInvoices(iList);
      setBookings(bList);
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed');
    }
  };

  // Create invoice (Admin)
  const handleCreateInvoice = async (bookingId: string, serviceCharges: number, partsCost: number, tax: number) => {
    try {
      await apiClient.createInvoice(bookingId, serviceCharges, partsCost, tax);
      const [iList, bList] = await Promise.all([apiClient.getInvoices(), apiClient.getBookings()]);
      setInvoices(iList);
      setBookings(bList);
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    }
  };

  // Delete individual booking
  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await apiClient.deleteBooking(bookingId);
      const [bList, invList] = await Promise.all([apiClient.getBookings(), apiClient.getInvoices()]);
      setBookings(bList);
      setInvoices(invList);
      if (selectedBookingDetails?.id === bookingId) {
        setSelectedBookingDetails(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete booking');
    }
  };

  // Delete all bookings
  const handleDeleteAllBookings = async () => {
    try {
      await apiClient.deleteAllBookings();
      const [bList, invList] = await Promise.all([apiClient.getBookings(), apiClient.getInvoices()]);
      setBookings(bList);
      setInvoices(invList);
      setSelectedBookingDetails(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete all bookings');
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async (bookingId: string, rating: number, comment: string) => {
    try {
      await apiClient.submitFeedback(bookingId, rating, comment);
      const bList = await apiClient.getBookings();
      setBookings(bList);
      if (selectedBookingDetails?.id === bookingId) {
        const updated = await apiClient.getBookingById(bookingId);
        setSelectedBookingDetails(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    }
  };

  // Create Staff (Admin)
  const handleCreateStaff = async (name: string, email: string, pass: string, role: Role, phone?: string) => {
    try {
      await apiClient.createStaff(name, email, pass, role, phone);
      alert(`Staff user ${name} (${role}) created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to create staff');
    }
  };

  // Tab change handler
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (user?.role === 'CUSTOMER') {
      if (tab === 'vehicles') navigate('/my-vehicles');
      else if (tab === 'bookings') navigate('/my-bookings');
      else if (tab === 'invoices') navigate('/my-invoices');
      else if (tab === 'marketplace') navigate('/marketplace');
      else navigate('/dashboard');
    } else if (user?.role === 'ADMIN') {
      if (tab === 'users') navigate('/admin/users');
      else if (tab === 'vehicles') navigate('/admin/vehicles');
      else if (tab === 'bookings' || tab === 'all-bookings') navigate('/admin/bookings');
      else if (tab === 'tasks') navigate('/admin/tasks');
      else if (tab === 'invoices') navigate('/admin/invoices');
      else if (tab === 'inventory') navigate('/admin/inventory');
      else if (tab === 'reports') navigate('/admin/reports');
      else if (tab === 'audit-logs') navigate('/admin/audit-logs');
      else if (tab === 'marketplace') navigate('/marketplace');
      else navigate('/admin/dashboard');
    } else if (user?.role === 'MECHANIC') {
      if (tab === 'tasks') navigate('/mechanic/tasks');
      else if (tab === 'vehicles') navigate('/mechanic/vehicles');
      else if (tab === 'invoices') navigate('/mechanic/invoices');
      else if (tab === 'marketplace') navigate('/marketplace');
      else navigate('/mechanic/dashboard');
    }
  };

  if (!user) {
    const isStaffRoute =
      currentPath === '/team/login' ||
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/mechanic') ||
      currentPath.startsWith('/team');

    return (
      <LoginView
        isStaff={isStaffRoute}
        onNavigate={navigate}
        onLoginSuccess={handleLoginSuccess}
        initialPendingAuth={pendingAuthForLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-['Public_Sans']">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        onOpenNewService={() => {
          setPreselectedVehicleForService(null);
          setIsNewServiceOpen(true);
        }}
        onLogout={handleLogout}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onOpenRBACTestSuite={() => setIsRBACTestSuiteOpen(true)}
      />

      {/* Main Content Workspace */}
      <div className="pl-[260px] flex-1 flex flex-col min-w-0">
        <TopBar
          user={user}
          token={localStorage.getItem('token')}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onOpenPostman={() => setIsPostmanOpen(true)}
          onLogout={handleLogout}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          onNavigate={(linkOrTab) => {
            if (!linkOrTab) return;
            if (linkOrTab.startsWith('/admin')) {
              setActiveTab('service-centers');
            } else if (linkOrTab.startsWith('/mechanic')) {
              setActiveTab('tasks');
            } else if (linkOrTab.startsWith('/customer')) {
              setActiveTab('bookings');
            } else {
              setActiveTab(linkOrTab.replace('/', ''));
            }
          }}
          vehicles={vehicles}
          onBookServiceForVehicle={(v) => {
            setPreselectedVehicleForService(v);
            setIsNewServiceOpen(true);
          }}
        />

        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              bookings={bookings}
              invoices={invoices}
              vehicles={vehicles}
              user={user}
              onSelectBooking={(b) => setSelectedBookingDetails(b)}
              onUpdateStatus={handleUpdateStatus}
              onOpenNewService={() => {
                setPreselectedVehicleForService(null);
                setIsNewServiceOpen(true);
              }}
              onBookServiceForVehicle={(v) => {
                setPreselectedVehicleForService(v);
                setIsNewServiceOpen(true);
              }}
              onNavigateToServiceCenters={() => setActiveTab('service-centers')}
              searchTerm={searchTerm}
            />
          )}

          {activeTab === 'service-centers' && (
            user?.role === 'ADMIN' ? (
              <ServiceCenterManagementView
                token={localStorage.getItem('token')}
                onNavigateToBookings={() => setActiveTab('all-bookings')}
              />
            ) : (
              <FindServiceCenterView
                currentUser={user}
                onNavigateToBookings={() => setActiveTab('bookings')}
              />
            )
          )}

          {activeTab === 'vehicles' && (
            <MyVehiclesView
              vehicles={vehicles}
              bookings={bookings}
              user={user}
              onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
              onBookServiceForVehicle={(v) => {
                setPreselectedVehicleForService(v);
                setIsNewServiceOpen(true);
              }}
              onDeleteVehicle={handleDeleteVehicle}
              searchTerm={searchTerm}
              onVehicleUpdated={() => {
                if (user) loadUserData(user);
              }}
            />
          )}

          {(activeTab === 'bookings' || activeTab === 'all-bookings') && (
            <MyBookingsView
              bookings={bookings}
              invoices={invoices}
              user={user}
              onSelectBooking={(b) => setSelectedBookingDetails(b)}
              onPayInvoice={handlePayInvoice}
              onOpenNewService={() => setIsNewServiceOpen(true)}
              onDeleteBooking={handleDeleteBooking}
              onDeleteAllBookings={handleDeleteAllBookings}
              searchTerm={searchTerm}
            />
          )}

          {activeTab === 'tasks' && (
            <ProtectedRoute allowedRoles={['MECHANIC', 'ADMIN']}>
              <AssignedTasksView
                bookings={bookings}
                user={user}
                onUpdateStatus={handleUpdateStatus}
                onAddRepairLog={handleAddRepairLog}
                searchTerm={searchTerm}
              />
            </ProtectedRoute>
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              bookings={bookings}
              user={user}
              onPayInvoice={handlePayInvoice}
              onCreateInvoice={handleCreateInvoice}
              searchTerm={searchTerm}
            />
          )}

          {activeTab === 'users' && (
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersView
                user={user}
                onCreateStaff={handleCreateStaff}
                searchTerm={searchTerm}
              />
            </ProtectedRoute>
          )}

          {activeTab === 'inventory' && (
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminInventoryView searchTerm={searchTerm} />
            </ProtectedRoute>
          )}

          {activeTab === 'reports' && (
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminReportsView />
            </ProtectedRoute>
          )}

          {activeTab === 'audit-logs' && (
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsView />
            </ProtectedRoute>
          )}

          {activeTab === 'marketplace' && (
            <MarketplaceView />
          )}

          {activeTab === 'rewards' && (
            <CustomerRewardsView />
          )}

          {activeTab === 'profile' && user && (
            <CustomerProfileView user={user} />
          )}
        </main>
      </div>

      {/* Customer Mobile Bottom Navigation */}
      {user?.role === 'CUSTOMER' && (
        <CustomerBottomNav activeTab={activeTab} onSelectTab={(t) => setActiveTab(t)} />
      )}

      {/* Modals */}
      <PostmanViewerModal isOpen={isPostmanOpen} onClose={() => setIsPostmanOpen(false)} />

      <NewServiceModal
        isOpen={isNewServiceOpen}
        onClose={() => setIsNewServiceOpen(false)}
        vehicles={vehicles}
        onSubmitBooking={handleCreateBooking}
        preselectedVehicle={preselectedVehicleForService}
        onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
        onQuickAddVehicle={handleAddVehicle}
      />

      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        onAddVehicle={handleAddVehicle}
      />

      <BookingDetailsModal
        booking={selectedBookingDetails}
        onClose={() => setSelectedBookingDetails(null)}
        currentUser={user}
        onUpdateStatus={handleUpdateStatus}
        onAssignMechanic={handleAssignMechanic}
        onSubmitFeedback={handleSubmitFeedback}
        onDeleteBooking={handleDeleteBooking}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        onProfileUpdated={() => refreshUser()}
      />

      <RBACTestSuiteModal
        isOpen={isRBACTestSuiteOpen}
        onClose={() => setIsRBACTestSuiteOpen(false)}
        currentUser={user}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;

