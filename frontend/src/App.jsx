import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GestionOrganizaciones from './pages/GestionOrganizaciones';
import GestionUsuarios from './pages/GestionUsuarios';
import AuditList from './pages/AuditList';
import NuevaAuditoria from './pages/NuevaAuditoria';
import Cuestionario from './pages/Cuestionario';
import Resultados from './pages/Resultados';
import ReporteEjecutivo from './pages/ReporteEjecutivo';
import Tendencia from './pages/Tendencia';
import Bitacora from './pages/Bitacora';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes inside Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auditorias" element={<AuditList />} />
            <Route path="/auditorias/:id/resultados" element={<Resultados />} />
            <Route path="/auditorias/:id/reporte" element={<ReporteEjecutivo />} />
            <Route path="/tendencia" element={<Tendencia />} />

            {/* Admin and Auditor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Administrador del sistema', 'Auditor']} />}>
              <Route path="/organizaciones" element={<GestionOrganizaciones />} />
              <Route path="/auditorias/nueva" element={<NuevaAuditoria />} />
              <Route path="/auditorias/:id/cuestionario" element={<Cuestionario />} />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Administrador del sistema']} />}>
              <Route path="/usuarios" element={<GestionUsuarios />} />
              <Route path="/bitacora" element={<Bitacora />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
