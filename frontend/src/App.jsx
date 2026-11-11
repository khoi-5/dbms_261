import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SellerLayout from './components/SellerLayout';
import SellerProductManagement from './pages/Seller/SellerProductManagement';
import BuyerLayout from './components/BuyerLayout';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import PlaceholderPage from './pages/PlaceholderPage';
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
        <Route path="checkout" element={<PlaceholderPage title="Thanh toán (F11)" />} />
        <Route path="orders" element={<PlaceholderPage title="Lịch sử mua hàng (F12)" />} />
        <Route path="spending" element={<PlaceholderPage title="Thống kê chi tiêu (F13)" />} />
        <Route path="profile" element={<PlaceholderPage title="Hồ sơ cá nhân" />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute role="SELLER" />}>
      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<Navigate to="/seller/products" replace />} />
        <Route path="products" element={<SellerProductManagement />} />
        <Route path="dashboard" element={<PlaceholderPage title="Dashboard (M5)" />} />
        <Route path="orders" element={<PlaceholderPage title="Quản lý đơn hàng (M4)" />} />
        <Route path="promotions" element={<PlaceholderPage title="Khuyến mãi & Doanh thu (M5)" />} />
      </Route>
    </Route>
    <Route path="*" element={<PlaceholderPage title="Không tìm thấy trang" />} />
  </Routes></AuthProvider></BrowserRouter>;
}
