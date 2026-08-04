import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import organizacionesRoutes from './routes/organizaciones.js';
import usuariosRoutes from './routes/usuarios.js';
import auditoriasRoutes from './routes/auditorias.js';
import cuestionarioRoutes from './routes/cuestionario.js';
import madurezRoutes from './routes/madurez.js';
import resultadosRoutes from './routes/resultados.js';
import reportesRoutes from './routes/reportes.js';
import tendenciaRoutes from './routes/tendencia.js';
import bitacoraRoutes from './routes/bitacora.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizaciones', organizacionesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auditorias', auditoriasRoutes);
app.use('/api/cuestionario', cuestionarioRoutes);
app.use('/api/madurez', madurezRoutes);
app.use('/api/resultados', resultadosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/tendencia', tendenciaRoutes);
app.use('/api/bitacora', bitacoraRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JALFO Consulting Portal API', version: '1.0.0' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 JALFO Portal Backend en ejecución en http://localhost:${PORT}`);
});
