import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SellerLayout from './components/SellerLayout';
import SellerProductManagement from './pages/Seller/SellerProductManagement';
import SellerDashboardPage from './pages/Seller/SellerDashboardPage';
import SellerPromotionManagement from './pages/Seller/SellerPromotionManagement';
import BuyerLayout from './components/BuyerLayout';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import BuyerSpendingPage from './pages/BuyerSpendingPage';
import BuyerPromotionsPage from './pages/BuyerPromotionsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import SellerOrdersPage from './pages/Seller/SellerOrdersPage';
import './App.css';

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<AuthPage key="login" />} />
    <Route path="/register" element={<AuthPage key="register" register />} />

    <Route element={<BuyerLayout />}>
      <Route index element={<Navigate to="/products" replace />} />
      <Route path="products" element={<ProductsPage />} />

      <Route element={<ProtectedRoute role="BUYER" />}>
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<OrdersPage />} />
        <Route path="promotions" element={<BuyerPromotionsPage />} />
        <Route path="spending" element={<BuyerSpendingPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Route>

    <Route element={<ProtectedRoute role="SELLER" />}>
      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<Navigate to="/seller/products" replace />} />
        <Route path="products" element={<SellerProductManagement />} />
        <Route path="dashboard" element={<SellerDashboardPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="orders/:shopOrderId" element={<SellerOrdersPage />} />
        <Route path="promotions" element={<SellerPromotionManagement />} />
      </Route>
    </Route>

    <Route path="*" element={<PlaceholderPage title="Không tìm thấy trang" />} />
  </Routes></AuthProvider></BrowserRouter>;
}