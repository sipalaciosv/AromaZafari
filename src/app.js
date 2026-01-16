const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const perfumeRoutes = require('./routes/perfume.routes');
const voteRoutes = require('./routes/vote.routes');
const expeditionRoutes = require('./routes/expedition.routes');
const adminRoutes = require('./routes/admin.routes');

// Importar middleware de errores
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares de seguridad y logging
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('dev'));

// Parseo de JSON y URL encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/perfumes', perfumeRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/expeditions', expeditionRoutes);
app.use('/api/admin', adminRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada' 
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

module.exports = app;
