import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { StudentRegistration } from './pages/StudentRegistration';
import { StudentDirectory } from './pages/StudentDirectory';
import { StudentProfile } from './pages/StudentProfile';
import { ParentGuardianManagement } from './pages/ParentGuardianManagement';
import { TeacherStaffManagement } from './pages/TeacherStaffManagement';
import { ClassesAndSubjects } from './pages/ClassesAndSubjects';
import { AttendanceRegister } from './pages/AttendanceRegister';
import { AssessmentMarksEntry } from './pages/AssessmentMarksEntry';
import { ReportCardGeneration } from './pages/ReportCardGeneration';
import { SchoolFeesInvoices } from './pages/SchoolFeesInvoices';
import { PaymentRecordingReceipts } from './pages/PaymentRecordingReceipts';
import { ExpensesFinancialReports } from './pages/ExpensesFinancialReports';
import { TimetableCalendar } from './pages/TimetableCalendar';
import { AnnouncementsNotifications } from './pages/AnnouncementsNotifications';
import { LibraryManagement } from './pages/LibraryManagement';
import { InventoryManagement } from './pages/InventoryManagement';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { UserManagementPermissions } from './pages/UserManagementPermissions';
import { SchoolSettings } from './pages/SchoolSettings';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StudentDirectory />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/students/new"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher']}>
                <AppLayout>
                  <StudentRegistration />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StudentProfile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/guardians"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'teacher']}>
                <AppLayout>
                  <ParentGuardianManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher']}>
                <AppLayout>
                  <TeacherStaffManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes-subjects"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'teacher']}>
                <AppLayout>
                  <ClassesAndSubjects />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AttendanceRegister />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessments"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'teacher']}>
                <AppLayout>
                  <AssessmentMarksEntry />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/report-cards"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportCardGeneration />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/fees-invoices"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'accountant', 'parent']}>
                <AppLayout>
                  <SchoolFeesInvoices />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'accountant', 'parent']}>
                <AppLayout>
                  <PaymentRecordingReceipts />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'accountant']}>
                <AppLayout>
                  <ExpensesFinancialReports />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TimetableCalendar />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AnnouncementsNotifications />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/library"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'teacher', 'student']}>
                <AppLayout>
                  <LibraryManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'accountant']}>
                <AppLayout>
                  <InventoryManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher', 'accountant']}>
                <AppLayout>
                  <ReportsAnalytics />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AppLayout>
                  <UserManagementPermissions />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'headteacher']}>
                <AppLayout>
                  <SchoolSettings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
