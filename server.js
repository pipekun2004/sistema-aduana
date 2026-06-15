const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function hashPass(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

function makeId(prefix) {
  return prefix + '-' + String(Math.floor(Math.random() * 9000) + 1000);
}

const db = {
  usuarios: [
    {
      id: 'USR-0001',
      nombre: 'Oscar',
      apellido: 'Garcia',
      rut: '12.345.678-9',
      user: 'admin',
      pass: hashPass('admin123'),
      rol: 'Administrador',
      paso: 'Los Libertadores',
      activo: true,
      initials: 'OG',
      creado: new Date().toISOString()
    }
  ],
  sesiones: {},
  expedientes: [],
  sag: [],
  vehiculos: [],
  menores: []
};

function authRequired(req, res, next) {
  const token = req.headers['x-token'];
  const sesion = db.sesiones[token];
  if (!sesion) return res.status(401).json({ error: 'No autorizado. Inicie sesion.' });
  if (new Date() > new Date(sesion.expira)) {
    delete db.sesiones[token];
    return res.status(401).json({ error: 'Sesion expirada.' });
  }
  req.usuario = db.usuarios.find(u => u.id === sesion.userId);
  next();
}

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'Administrador')
    return res.status(403).json({ error: 'Se requiere rol Administrador.' });
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ estado: 'OK', uptime: Math.floor(process.uptime()) + 's', fecha: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { user, pass } = req.body;
  if (!user || !pass) return res.status(400).json({ error: 'Usuario y contrasena requeridos.' });
  const u = db.usuarios.find(u => (u.user === user || u.rut === user) && u.pass === hashPass(pass) && u.activo);
  if (!u) return res.status(401).json({ error: 'Credenciales incorrectas.' });
  const token = crypto.randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  db.sesiones[token] = { userId: u.id, expira };
  const { pass: _, ...userData } = u;
  res.json({ token, expira, usuario: userData });
});

app.post('/api/auth/logout', authRequired, (req, res) => {
  delete db.sesiones[req.headers['x-token']];
  res.json({ mensaje: 'Sesion cerrada.' });
});

app.get('/api/usuarios', authRequired, soloAdmin, (req, res) => {
  res.json(db.usuarios.map(({ pass: _, ...u }) => u));
});

app.post('/api/usuarios', authRequired, soloAdmin, (req, res) => {
  const { nombre, apellido, rut, user, pass, rol, paso } = req.body;
  if (!nombre || !apellido || !user || !pass || !rol || !paso)
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  if (pass.length < 6) return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres.' });
  if (db.usuarios.find(u => u.user === user)) return res.status(409).json({ error: 'El nombre de usuario ya existe.' });
  const nuevo = {
    id: makeId('USR'), nombre, apellido, rut, user,
    pass: hashPass(pass), rol, paso,
    initials: (nombre[0] + apellido[0]).toUpperCase(),
    activo: true, creado: new Date().toISOString()
  };
  db.usuarios.push(nuevo);
  const { pass: _, ...data } = nuevo;
  res.status(201).json({ mensaje: 'Usuario creado exitosamente.', usuario: data });
});

app.delete('/api/usuarios/:id', authRequired, soloAdmin, (req, res) => {
  const idx = db.usuarios.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (db.usuarios[idx].user === 'admin') return res.status(403).json({ error: 'No se puede eliminar el administrador principal.' });
  db.usuarios.splice(idx, 1);
  res.json({ mensaje: 'Usuario eliminado.' });
});

app.patch('/api/usuarios/:id', authRequired, soloAdmin, (req, res) => {
  const u = db.usuarios.find(u => u.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (req.body.activo !== undefined) u.activo = req.body.activo;
  if (req.body.rol) u.rol = req.body.rol;
  if (req.body.paso) u.paso = req.body.paso;
  const { pass: _, ...data } = u;
  res.json({ mensaje: 'Usuario actualizado.', usuario: data });
});

app.post('/api/menores', authRequired, (req, res) => {
  const { nombre, rut, fnac, nacionalidad, situacion, documentosOk } = req.body;
  if (!nombre || !rut || !situacion) return res.status(400).json({ error: 'Faltan datos obligatorios.' });
  const registro = {
    id: makeId('MEN'), nombre, rut, fnac, nacionalidad, situacion,
    documentosOk: !!documentosOk,
    estado: documentosOk ? 'Aprobado' : 'Revision',
    oficial: req.usuario.nombre + ' ' + req.usuario.apellido,
    fecha: new Date().toISOString()
  };
  db.menores.push(registro);
  db.expedientes.push({ id: makeId('EXP'), tipo: 'Menor de edad', ref: registro.id, rut, estado: registro.estado, oficial: registro.oficial, fecha: registro.fecha });
  res.status(201).json({ mensaje: 'Menor registrado correctamente.', registro });
});

app.get('/api/menores', authRequired, (req, res) => {
  res.json(db.menores);
});

app.post('/api/vehiculos', authRequired, (req, res) => {
  const { patente, tipo, pais, rutPropietario, nombrePropietario, marca } = req.body;
  if (!patente) return res.status(400).json({ error: 'La patente es obligatoria.' });
  const dias = (tipo || '').includes('90') ? 90 : 180;
  const vigencia = new Date(Date.now() + dias * 86400000).toISOString().split('T')[0];
  const registro = {
    id: makeId('VEH'), patente: patente.toUpperCase(),
    tipo: tipo || 'Salida temporal (180 dias)',
    pais, rutPropietario, nombrePropietario, marca, dias, vigencia,
    estado: 'Registrado',
    oficial: req.usuario.nombre + ' ' + req.usuario.apellido,
    fecha: new Date().toISOString()
  };
  db.vehiculos.push(registro);
  db.expedientes.push({ id: makeId('EXP'), tipo: 'Vehiculo', ref: registro.id, rut: patente.toUpperCase(), estado: registro.estado, oficial: registro.oficial, fecha: registro.fecha });
  res.status(201).json({ mensaje: 'Vehiculo ' + registro.patente + ' registrado. Vigencia: ' + dias + ' dias.', registro });
});

app.get('/api/vehiculos', authRequired, (req, res) => {
  const { patente } = req.query;
  if (patente) return res.json(db.vehiculos.filter(v => v.patente === patente.toUpperCase()));
  res.json(db.vehiculos);
});

app.post('/api/sag', authRequired, (req, res) => {
  const { nombre, rut, edad, pais, productos, observaciones } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre del declarante es obligatorio.' });
  const requiereRepresentante = edad && parseInt(edad) < 18;
  const registro = {
    id: makeId('SAG'), nombre, rut,
    edad: parseInt(edad) || null,
    pais, productos: productos || [], observaciones,
    requiereRepresentante, estado: 'Enviado',
    oficial: req.usuario.nombre + ' ' + req.usuario.apellido,
    fecha: new Date().toISOString()
  };
  db.sag.push(registro);
  db.expedientes.push({ id: makeId('EXP'), tipo: 'SAG', ref: registro.id, rut, estado: registro.estado, oficial: registro.oficial, fecha: registro.fecha });
  const mensaje = requiereRepresentante
    ? 'Declaracion recibida. Menor de edad - requiere firma de representante.'
    : 'Declaracion SAG enviada. Productos declarados: ' + (productos || []).length + '.';
  res.status(201).json({ mensaje, registro });
});

app.post('/api/pdi', authRequired, (req, res) => {
  const { rut, motivo } = req.body;
  const notif = {
    id: makeId('PDI'), rut,
    motivo: motivo || 'Sin motivo especificado',
    oficial: req.usuario.nombre + ' ' + req.usuario.apellido,
    fecha: new Date().toISOString()
  };
  db.expedientes.push({ id: makeId('EXP'), tipo: 'PDI', ref: notif.id, rut, estado: 'Retenido', oficial: notif.oficial, fecha: notif.fecha });
  res.status(201).json({ mensaje: 'Notificacion enviada a PDI.', notificacion: notif });
});

app.get('/api/expedientes', authRequired, (req, res) => {
  const limite = parseInt(req.query.limite) || 50;
  res.json(db.expedientes.slice(-limite).reverse());
});

app.get('/api/estado', authRequired, (req, res) => {
  res.json({
    ingresos: db.expedientes.filter(e => e.estado === 'Aprobado').length,
    egresos: db.expedientes.filter(e => e.estado === 'Registrado').length,
    enProceso: db.expedientes.filter(e => e.estado === 'Revision').length,
    retenidos: db.expedientes.filter(e => e.estado === 'Retenido').length,
    totalSAG: db.sag.length,
    totalMenores: db.menores.length,
    totalVehiculos: db.vehiculos.length
  });
});

app.get('/api/reportes', authRequired, (req, res) => {
  const { tipo, desde, hasta, paso, formato = 'json' } = req.query;
  let datos = [];
  const filtrarFecha = (arr) => arr.filter(r => {
    const f = new Date(r.fecha);
    if (desde && f < new Date(desde)) return false;
    if (hasta && f > new Date(hasta + 'T23:59:59')) return false;
    return true;
  });
  if (!tipo || tipo.includes('general')) datos = filtrarFecha(db.expedientes);
  else if (tipo.includes('vehiculo')) datos = filtrarFecha(db.vehiculos);
  else if (tipo.includes('menor')) datos = filtrarFecha(db.menores);
  else if (tipo.includes('sag') || tipo.includes('pdi')) datos = filtrarFecha(db.sag);
  else datos = filtrarFecha(db.expedientes);
  res.json({
    mensaje: 'Reporte generado. ' + datos.length + ' registro(s) encontrados.',
    generadoPor: req.usuario.nombre + ' ' + req.usuario.apellido,
    fecha: new Date().toISOString(),
    parametros: { tipo, desde, hasta, paso, formato },
    total: datos.length,
    datos
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log('Servidor Aduana Chile corriendo en http://localhost:' + PORT);
  console.log('Abrir sistema: http://localhost:' + PORT + '/sistema_aduana_chile.html');
  console.log('Health check:  http://localhost:' + PORT + '/api/health');
  console.log('Demo: usuario "admin" - contrasena "admin123"');
});
