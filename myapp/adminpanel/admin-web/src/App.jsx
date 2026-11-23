import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import AdminProtectedRoute from "./routes/AdminProtectedRoute";

import AdminDashboard from "./pages/AdminDashboard";
import SellerSettlementPage from "./pages/SellerSettlementPage";
import SettlementHistoryPage from "./pages/SettlementHistoryPage";
import AdminBannersPage from "./pages/AdminBannersPage";
import AdminLogin from "./pages/AdminLogin";
import AdminEarningsPage from "./pages/AdminEarningsPage";
import DoctorEarningsPage from "./pages/DoctorEarningsPage";
import DoctorUnpaidEarningsPage from "./pages/DoctorUnpaidEarningsPage";
import DoctorSettlementPage from "./pages/DoctorSettlementPage";
import DoctorSettlementHistoryPage from "./pages/DoctorSettlementHistoryPage";
import AdminGSTReportPage from "./pages/AdminGSTReportPage";
import AdminGSTCompliancePage from "./pages/AdminGSTCompliancePage";
import AdminAuditLogsPage from "./pages/AdminAuditLogsPage";
import AdminSellerEarningsPage from "./pages/AdminSellerEarningsPage";
import SellerUnpaidItemsPage from "./pages/SellerUnpaidItemsPage";
import AdminRefundRequestsPage from "./pages/AdminRefundRequestsPage";
import AdminRefundHistoryPage from "./pages/AdminRefundHistoryPage";
import AdminProductApprovalPage from "./pages/AdminProductApprovalPage";
import AdminAdminsPage from "./pages/AdminAdminsPage";
import SuperAdminPanel from "./pages/SuperAdminPanel";

/* 🆕 NEW MANAGEMENT PAGES */
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminSellersPage from "./pages/AdminSellersPage";
import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminFraudMonitoringPage from "./pages/AdminFraudMonitoringPage";
import AdminSystemHealthPage from "./pages/AdminSystemHealthPage";
import AdminNotificationControlPage from "./pages/AdminNotificationControlPage";
import AdminSearchPage from "./pages/AdminSearchPage";
import AdminActivityPage from "./pages/AdminActivityPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminSessionsPage from "./pages/AdminSessionsPage";
import AdminPermissionsPage from "./pages/AdminPermissionsPage";
import AdminSecurityPage from "./pages/AdminSecurityPage";
import AdminCommandCenter from "./pages/AdminCommandCenter";
import AdminHospitalsPage from "./pages/AdminHospitalsPage";
import AdminDoctorHospitalApprovalsPage from "./pages/AdminDoctorHospitalApprovalsPage";

export default function App() {
return ( <BrowserRouter> <Routes>


    {/* 🔐 Admin Login */}
    <Route path="/login" element={<AdminLogin />} />

    {/* 🔒 Protected Admin Area */}
    <Route
      path="/*"
      element={
        <AdminProtectedRoute>
          <AdminLayout>
            <Routes>

              {/* DASHBOARD */}
              <Route path="/" element={<AdminDashboard />} />

              {/* SELLER FINANCE */}
              <Route
                path="/seller-settlements"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <SellerSettlementPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/settlement-history"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <SettlementHistoryPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/earnings"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <AdminEarningsPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/seller-unpaid-items"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <SellerUnpaidItemsPage />
                  </AdminProtectedRoute>
                }
              />

              {/* BANNERS */}
              <Route
                path="/banners"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","OPERATIONS_ADMIN"]}>
                    <AdminBannersPage />
                  </AdminProtectedRoute>
                }
              />

              {/* DOCTOR FINANCE */}
              <Route
                path="/doctor-earnings"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <DoctorEarningsPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/doctor-unpaid-earnings"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <DoctorUnpaidEarningsPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/doctor-settlements"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <DoctorSettlementPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/doctor-settlement-history"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <DoctorSettlementHistoryPage />
                  </AdminProtectedRoute>
                }
              />
              <Route
  path="/hospitals"
  element={
    <AdminProtectedRoute allowedRoles={["SUPER_ADMIN", "SUPPORT_ADMIN"]}>
      <AdminHospitalsPage />
    </AdminProtectedRoute>
  }
/>
<Route
  path="/doctor-hospital-approvals"
  element={
    <AdminProtectedRoute allowedRoles={["SUPER_ADMIN", "SUPPORT_ADMIN"]}>
      <AdminDoctorHospitalApprovalsPage />
    </AdminProtectedRoute>
  }
/>

              {/* GST */}
              <Route
                path="/gst-reports"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <AdminGSTReportPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/gst-compliance"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <AdminGSTCompliancePage />
                  </AdminProtectedRoute>
                }
              />

              {/* ADMIN CONTROL */}
              <Route
                path="/audit-logs"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <AdminAuditLogsPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/refund-requests"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN","SUPPORT_ADMIN"]}>
                    <AdminRefundRequestsPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/refund-history"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","FINANCE_ADMIN"]}>
                    <AdminRefundHistoryPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/product-approvals"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","OPERATIONS_ADMIN"]}>
                    <AdminProductApprovalPage />
                  </AdminProtectedRoute>
                }
              />

              <Route path="/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/fraud-monitoring" element={<AdminFraudMonitoringPage />} />
              <Route path="/system-health" element={<AdminSystemHealthPage />} />

              <Route
                path="/notification-control"
                element={<AdminNotificationControlPage />}
              />

              <Route
                path="/admins"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                    <AdminAdminsPage />
                  </AdminProtectedRoute>
                }
              />

              <Route path="/search" element={<AdminSearchPage />} />
              <Route path="/admin-activity" element={<AdminActivityPage />} />

              {/* PLATFORM MANAGEMENT */}
              <Route
                path="/users"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","SUPPORT_ADMIN"]}>
                    <AdminUsersPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/sellers"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","OPERATIONS_ADMIN"]}>
                    <AdminSellersPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/doctors"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","SUPPORT_ADMIN"]}>
                    <AdminDoctorsPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/orders"
                element={
                  <AdminProtectedRoute allowedRoles={["SUPER_ADMIN","OPERATIONS_ADMIN","SUPPORT_ADMIN"]}>
                    <AdminOrdersPage />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/reports" element={<AdminReportsPage />} />
              <Route path="/super-admin" element={<SuperAdminPanel />} />
              <Route path="/admin-sessions" element={<AdminSessionsPage />} />
              <Route path="/admin-permissions" element={<AdminPermissionsPage />} />
              <Route path="/admin-security" element={<AdminSecurityPage />} />
              <Route path="/command-center" element={<AdminCommandCenter />} />

            </Routes>
          </AdminLayout>
        </AdminProtectedRoute>
      }
    />
  </Routes>
</BrowserRouter>


);
}
