import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, TrendingUp, Building2, Users, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  const userStr = localStorage.getItem('jalfo_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.nombre_rol;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #38BDF8, #2563EB)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck color="#FFFFFF" size={22} />
        </div>
        <div>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
            JALFO <span style={{ color: '#38BDF8' }}>Portal</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Gobernanza & Riesgo BD</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/auditorias"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
        >
          <ClipboardList size={18} />
          <span>Auditorías ISO 27002</span>
        </NavLink>

        <NavLink
          to="/tendencia"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
        >
          <TrendingUp size={18} />
          <span>Comparativo Histórico</span>
        </NavLink>

        {(role === 'Administrador del sistema' || role === 'Auditor') && (
          <NavLink
            to="/organizaciones"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Building2 size={18} />
            <span>Organizaciones</span>
          </NavLink>
        )}

        {role === 'Administrador del sistema' && (
          <>
            <div style={{ margin: '1rem 0 0.5rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Administración
            </div>

            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Users size={18} />
              <span>Usuarios del Sistema</span>
            </NavLink>

            <NavLink
              to="/bitacora"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <ShieldAlert size={18} />
              <span>Bitácora del Sistema</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Sidebar inline styles */}
      <style>{`
        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: #94A3B8;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .nav-item:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .nav-item.active {
          color: white;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(30, 58, 138, 0.9));
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
      `}</style>
    </aside>
  );
}
