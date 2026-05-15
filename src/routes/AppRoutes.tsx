import { Routes, Route } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";
import HomePage from "../pages/public/HomePage";
import AboutPage from "../pages/public/AboutPage";
import ProductsPage from "../pages/public/ProductsPage";
import ProductDetailPage from "../pages/public/ProductDetailPage";
import CartPage from "../pages/public/CartPage";
import CheckoutPage from "../pages/public/CheckoutPage";
import PaymentConfirmationPage from "../pages/public/PaymentConfirmationPage";
import OrderStatusPage from "../pages/public/OrderStatusPage";
import ResellerPage from "../pages/public/ResellerPage";
import ContactPage from "../pages/public/ContactPage";
import ArticlesPage from "../pages/public/ArticlesPage";
import FAQPage from "../pages/public/FAQPage";
import DashboardPage from "../pages/admin/DashboardPage";
import LoginPage from "../pages/admin/LoginPage";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminProductsPage from "../pages/admin/ProductsPage";
import OrdersPage from "../pages/admin/OrdersPage";
import CustomersPage from "../pages/admin/CustomersPage";
import ReportsPage from "../pages/admin/ReportsPage";
import SettingsPage from "../pages/admin/SettingsPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="payment-confirmation/:orderId" element={<PaymentConfirmationPage />} />
        <Route path="order-status" element={<OrderStatusPage />} />
        <Route path="order-status/:orderId" element={<OrderStatusPage />} />
        <Route path="reseller" element={<ResellerPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="faq" element={<FAQPage />} />
      </Route>

      {/* Admin Login Route */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Protected Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Add other admin routes here later */}
        </Route>
      </Route>
    </Routes>
  );
}
