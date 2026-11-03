import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { TripBasketProvider } from './context/TripBasketContext';
import { TripBasketDrawer } from './components/ui/TripBasketDrawer';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public pages
import HomePage from './pages/public/HomePage';
import MarketplacePage from './pages/public/MarketplacePage';
import DestinationDetailPage from './pages/public/DestinationDetailPage';
import AiTravelAgentPage from './pages/public/AiTravelAgentPage';
import ExpertPublicProfile from './pages/public/ExpertPublicProfile';
import HowItWorksPage from './pages/public/HowItWorksPage';
import AboutPage from './pages/public/AboutPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';

// Traveler & User pages
import TravelerDashboard from './pages/traveler/TravelerDashboard';
import CreateTrip from './pages/traveler/CreateTrip';
import MyRequests from './pages/traveler/MyRequests';
import RequestDetail from './pages/traveler/RequestDetail';
import CompareProposals from './pages/traveler/CompareProposals';
import Bookings from './pages/traveler/Bookings';
import BookingConfirmationPage from './pages/traveler/BookingConfirmationPage';
import TravelerProfile from './pages/traveler/TravelerProfile';
import AccountSettingsPage from './pages/traveler/AccountSettingsPage';
import ItineraryDashboard from './pages/traveler/ItineraryDashboard';

// Expert pages
import ExpertDashboard from './pages/expert/ExpertDashboard';
import ExpertRequests from './pages/expert/ExpertRequests';
import ExpertRequestDetail from './pages/expert/ExpertRequestDetail';
import ExpertProposals from './pages/expert/ExpertProposals';
import ExpertProfile from './pages/expert/ExpertProfile';

// Common pages
import MessagesPage from './pages/common/MessagesPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminExperts from './pages/admin/AdminExperts';
import AdminInventory from './pages/admin/AdminInventory';
import AdminTripRequests from './pages/admin/AdminTripRequests';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReviews from './pages/admin/AdminReviews';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <TripBasketProvider>
          <BrowserRouter>
            <TripBasketDrawer />
            <Routes>
              {/* Public Routes with Navbar & Footer */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<MarketplacePage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/destinations" element={<MarketplacePage />} />
                <Route path="/destinations/:id" element={<DestinationDetailPage />} />
                <Route path="/agent" element={<AiTravelAgentPage />} />
                <Route path="/ai" element={<AiTravelAgentPage />} />
                <Route path="/itinerary-planner" element={<ItineraryDashboard />} />
                <Route path="/itinerary" element={<ItineraryDashboard />} />
                <Route path="/experts/:id" element={<ExpertPublicProfile />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Traveler Protected Routes */}
              <Route
                element={
                  <ProtectedRoute roles={['TRAVELER']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/traveler/dashboard" element={<TravelerDashboard />} />
                <Route path="/traveler/agent" element={<AiTravelAgentPage />} />
                <Route path="/traveler/itinerary" element={<ItineraryDashboard />} />
                <Route path="/traveler/create-trip" element={<CreateTrip />} />
                <Route path="/traveler/requests" element={<MyRequests />} />
                <Route path="/traveler/requests/:id" element={<RequestDetail />} />
                <Route path="/traveler/compare/:id" element={<CompareProposals />} />
                <Route path="/traveler/bookings" element={<Bookings />} />
                <Route path="/traveler/booking-confirmation/:id" element={<BookingConfirmationPage />} />
                <Route path="/traveler/messages" element={<MessagesPage />} />
                <Route path="/traveler/profile" element={<TravelerProfile />} />
                <Route path="/traveler/settings" element={<AccountSettingsPage />} />
                <Route path="/profile" element={<TravelerProfile />} />
                <Route path="/settings" element={<AccountSettingsPage />} />
              </Route>

              {/* Expert Protected Routes */}
              <Route
                element={
                  <ProtectedRoute roles={['EXPERT']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/expert/dashboard" element={<ExpertDashboard />} />
                <Route path="/expert/requests" element={<ExpertRequests />} />
                <Route path="/expert/requests/:id" element={<ExpertRequestDetail />} />
                <Route path="/expert/proposals" element={<ExpertProposals />} />
                <Route path="/expert/bookings" element={<Bookings />} />
                <Route path="/expert/messages" element={<MessagesPage />} />
                <Route path="/expert/profile" element={<ExpertProfile />} />
              </Route>

              {/* Admin Protected Routes */}
              <Route
                element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/experts" element={<AdminExperts />} />
                <Route path="/admin/destinations" element={<AdminInventory />} />
                <Route path="/admin/inventory" element={<AdminInventory />} />
                <Route path="/admin/requests" element={<AdminTripRequests />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TripBasketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
