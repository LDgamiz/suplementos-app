import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Supplements from './pages/Supplements'
import Profile from './pages/Profile'
import SupportUs from './pages/SupportUs'
import AdminLayout from './pages/admin/AdminLayout'
import AdminUsers from './pages/admin/AdminUsers'
import AdminCatalog from './pages/admin/AdminCatalog'
import PerfilPublico from './pages/PerfilPublico'

export default function App() {
  return (
    <Routes>
      <Route path="/perfil/:username" element={<PerfilPublico />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Supplements />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/support" element={<SupportUs />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="catalog" element={<AdminCatalog />} />
        </Route>
      </Route>
    </Routes>
  )
}
