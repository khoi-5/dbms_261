import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SellerLayout from './components/SellerLayout';
import SellerProductManagement from './pages/Seller/SellerProductManagement';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<Navigate to="/seller/products" replace />} />
          <Route path="products" element={<SellerProductManagement />} />
          <Route path="dashboard" element={<div style={{ padding: '20px' }}>Dashboard (M5)</div>} />
          <Route path="orders" element={<div style={{ padding: '20px' }}>Quản lý đơn hàng (M4)</div>} />
          <Route path="promotions" element={<div style={{ padding: '20px' }}>Khuyến mãi & Doanh thu (M5)</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/seller/products" replace />} />
      </Routes>
    </BrowserRouter>
  );
}