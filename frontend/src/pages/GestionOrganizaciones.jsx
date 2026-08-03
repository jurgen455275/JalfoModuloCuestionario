import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Building2, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function GestionOrganizaciones() {
  const [organizaciones, setOrganizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    sector: '',
    direccion: '',
    telefono_contacto: '',
  });
  const [error, setError] = useState('');

  const userStr = localStorage.getItem('jalfo_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.nombre_rol === 'Administrador del sistema';

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/organizaciones');
      setOrganizaciones(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleOpenModal = (org = null) => {
    setError('');
    if (org) {
      setEditingOrg(org);
      setFormData({
        nombre: org.nombre || '',
        sector: org.sector || '',
        direccion: org.direccion || '',
        telefono_contacto: org.telefono_contacto || '',
      });
    } else {
      setEditingOrg(null);
      setFormData({ nombre: '', sector: '', direccion: '', telefono_contacto: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingOrg) {
        await api.put(`/organizaciones/${editingOrg.id_organizacion}`, formData);
      } else {
        await api.post('/organizaciones', formData);
      }
      setShowModal(false);
      fetchOrgs();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la organización');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta organización?')) return;
    try {
      await api.delete(`/organizaciones/${id}`);
      fetchOrgs();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar la organización');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>Gestión de Organizaciones</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Empresas e instituciones sujetas a evaluación de riesgo de base de datos.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          <span>Nueva Organización</span>
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Cargando organizaciones...</div>
        ) : organizaciones.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>No hay organizaciones registradas.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Sector</th>
                  <th>Dirección</th>
                  <th>Teléfono Contacto</th>
                  <th>Auditorías</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {organizaciones.map((org) => (
                  <tr key={org.id_organizacion}>
                    <td>
                      <strong>{org.nombre}</strong>
                    </td>
                    <td>{org.sector || '—'}</td>
                    <td>{org.direccion || '—'}</td>
                    <td>{org.telefono_contacto || '—'}</td>
                    <td>
                      <span className="badge badge-purple">{org.total_auditorias} auditorías</span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleOpenModal(org)} className="btn btn-secondary btn-sm" title="Editar">
                        <Edit2 size={14} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(org.id_organizacion)} className="btn btn-danger btn-sm" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E3A8A' }}>
                {editingOrg ? 'Editar Organización' : 'Nueva Organización'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre de la Organización *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sector Industrial / Negocio</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Banca y Finanzas, Salud, Retail"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección Física</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono de Contacto</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.telefono_contacto}
                  onChange={(e) => setFormData({ ...formData, telefono_contacto: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
