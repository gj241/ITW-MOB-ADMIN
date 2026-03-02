import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UsersList from './pages/UsersList'
import UserDetail from './pages/UserDetail'
import DevicesList from './pages/DevicesList'
import DeviceDetail from './pages/DeviceDetail'
import AuditLog from './pages/AuditLog'
import Notifications from './pages/Notifications'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/:userId" element={<UserDetail />} />
            <Route path="/devices" element={<DevicesList />} />
            <Route path="/devices/:deviceId" element={<DeviceDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/audit-log" element={<AuditLog />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
