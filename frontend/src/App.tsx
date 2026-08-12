import { Routes, Route } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { ProductFormPage } from '@/features/inventory/ProductFormPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { RequireAuth } from '@/core/auth/RequireAuth';
import { AppLayout } from '@/shared/ui/AppLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/new" element={<ProductFormPage />} />
        <Route path="/inventory/:id/edit" element={<ProductFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
