import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Users, UserPlus, Edit, Key, CheckCircle, XCircle, X } from 'lucide-react';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [nuevaContrasena, setNuevaContrasena] = useState('');

  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    contrasena: '',
    id_rol: '',
    activo: true,
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [usrRes, rolRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/usuarios/roles'),
      ]);
      setUsuarios(usrRes.data);
      setRoles(rolRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user = null) => {
    setError('');
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre_completo: user.nombre_completo,
        correo: user.correo,
        contrasena: '',
        id_rol: user.id_rol,
        activo: user.activo,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre_completo: '',
        correo: '',
        contrasena: '',
        id_rol: roles[0]?.id_rol || '',
        activo: true,
      });
    }
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id_usuario}`, {
          nombre_completo: formData.nombre_completo,
          correo: formData.correo,
          id_rol: formData.id_rol,
          activo: formData.activo,
        });
      } else {
        await api.post('/usuarios', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/usuarios/${passwordUser.id_usuario}/password`, { nueva_contrasena: nuevaContrasena });
      alert('Contraseña actualizada con éxito');
      setShowPasswordModal(false);
      setNuevaContrasena('');
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>Gestión de Usuarios del Sistema</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B' }}>Control de acceso y asignación de roles (Administrador, Auditor, DBA).</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Cargando usuarios...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Asignado</th>
                  <th>Estado</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  let roleBadge = 'badge-blue';
                  if (u.nombre_rol === 'Administrador del sistema') roleBadge = 'badge-purple';
                  if (u.nombre_rol === 'DBA') roleBadge = 'badge-yellow';

                  return (
                    <tr key={u.id_usuario}>
                      <td>
                        <strong>{u.nombre_completo}</strong>
                      </td>
                      <td>{u.correo}</td>
                      <td>
                        <span className={`badge ${roleBadge}`}>{u.nombre_rol}</span>
                      </td>
                      <td>
                        {u.activo ? (
                          <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={12} /> Activo
                          </span>
                        ) : (
                          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <XCircle size={12} /> Inactivo
                          </span>
                        )}
                      </td>
                      <td>{new Date(u.fecha_creacion).toLocaleDateString('es-ES')}</td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenModal(u)} className="btn btn-secondary btn-sm" title="Editar">
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setPasswordUser(u);
                            setNuevaContrasena('');
                            setShowPasswordModal(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Restablecer Contraseña"
                        >
                          <Key size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Edit/Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E3A8A' }}>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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

            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  required
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label className="form-label">Contraseña Inicial *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Rol del Sistema *</label>
                <select
                  className="form-select"
                  value={formData.id_rol}
                  onChange={(e) => setFormData({ ...formData, id_rol: e.target.value })}
                  required
                >
                  {roles.map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre_rol}
                    </option>
                  ))}
                </select>
              </div>

              {editingUser && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="activo" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                    Usuario Activo
                  </label>
                </div>
              )}

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

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1E3A8A', marginBottom: '1rem' }}>
              Restablecer Contraseña
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem' }}>
              Modificar la clave para: <strong>{passwordUser?.nombre_completo}</strong>
            </p>

            <form onSubmit={handlePasswordReset}>
              <div className="form-group">
                <label className="form-label">Nueva Contraseña</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
