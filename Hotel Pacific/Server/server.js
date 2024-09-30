const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt'); 
const path = require('path');
const PORT = 3000;

const app = express();

// Configuración de la base de datos SQLite
const db = new sqlite3.Database('./db/database.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Conectado a la base de datos SQLite.');
});

// Crear tablas si no existen
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  password TEXT,
  role TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest TEXT,
  room TEXT,
  checkin TEXT,
  checkout TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_number TEXT,
  type TEXT,
  price REAL,
  status TEXT  -- Puede ser 'disponible', 'ocupada', 'mantenimiento', etc.
)`);

// Middlewares
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'hotel_pacific_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Rutas de gestión de habitaciones (CRUD)
app.post('/api/admin/rooms', (req, res) => {
  const { room_number, type, price, status } = req.body;

  if (!room_number || !type || !price || !status) {
    return res.status(400).json({ success: false, message: 'Faltan campos necesarios.' });
  }

  const insertSql = `INSERT INTO rooms (room_number, type, price, status) VALUES (?, ?, ?, ?)`;
  const params = [room_number, type, price, status];
  db.run(insertSql, params, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(201).json({ success: true, message: 'Habitación añadida con éxito.' });
  });
});

app.get('/api/admin/rooms', (req, res) => {
  const sql = `SELECT * FROM rooms`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json({ data: rows });
  });
});

app.put('/api/admin/rooms/:id', (req, res) => {
  const { room_number, type, price, status } = req.body;
  const { id } = req.params;
  const updateSql = `UPDATE rooms SET room_number = ?, type = ?, price = ?, status = ? WHERE id = ?`;
  const params = [room_number, type, price, status, id];

  db.run(updateSql, params, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json({ success: true, message: 'Habitación actualizada con éxito.' });
  });
});

app.delete('/api/admin/rooms/:id', (req, res) => {
  const { id } = req.params;
  const deleteSql = `DELETE FROM rooms WHERE id = ?`;

  db.run(deleteSql, id, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json({ success: true, message: 'Habitación eliminada con éxito.' });
  });
});




app.post('/api/admin/users', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Faltan campos necesarios.' });
  }

 
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error al hashear la contraseña' });
    }

    const insertSql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
    const params = [name, email, hashedPassword, role];
    db.run(insertSql, params, function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(201).json({ success: true, message: 'Usuario añadido con éxito.' });
    });
  });
});

// Ver usuarios
app.get('/api/admin/users', (req, res) => {
  const sql = `SELECT id, name, email, role FROM users`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json({ data: rows });
  });
});

app.get('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const sql = `SELECT id, name, email, role FROM users WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json(row);
  });
});

// Actualizar usuario
app.put('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

 
  if (password) {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Error al hashear la contraseña' });
      }
      const updateSql = `UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?`;
      const params = [name, email, hashedPassword, role, id];
      db.run(updateSql, params, function(err) {
        if (err) {
          res.status(400).json({ error: err.message });
          return;
        }
        res.status(200).json({ success: true, message: 'Usuario actualizado con éxito.' });
      });
    });
  } else {
    const updateSql = `UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`;
    const params = [name, email, role, id];
    db.run(updateSql, params, function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(200).json({ success: true, message: 'Usuario actualizado con éxito.' });
    });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const deleteSql = `DELETE FROM users WHERE id = ?`;

  db.run(deleteSql, id, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(200).json({ success: true, message: 'Usuario eliminado con éxito.' });
  });
});

// Ruta para el inicio de sesión con verificación del nombre de usuario y contraseña hasheada
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body; 

  const sql = `SELECT * FROM users WHERE name = ?`; 
  db.get(sql, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (user) {
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          req.session.userEmail = user.email;
          req.session.userRole = user.role;
          res.json({ success: true, role: user.role });
        } else {
          res.json({ success: false, message: 'Nombre de usuario o contraseña incorrectos' });
        }
      });
    } else {
      res.json({ success: false, message: 'Nombre de usuario o contraseña incorrectos' });
    }
  });
});

// Rutas para servir las páginas HTML
app.get('/admin/habitaciones', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-habitaciones.html'));
});

app.get('/admin/reservas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-reservas.html'));
});

app.get('/admin/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-usuarios.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin-dashboard.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Rutas adicionales para reservas...
app.get('/api/admin/reservations', (req, res) => {
  const sql = 'SELECT * FROM reservations';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/admin/reservations/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM reservations WHERE id = ?';
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
});

app.post('/api/admin/reservations', (req, res) => {
  const { guest, room, checkin, checkout } = req.body;
  const sql = 'INSERT INTO reservations (guest, room, checkin, checkout) VALUES (?, ?, ?, ?)';
  db.run(sql, [guest, room, checkin, checkout], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

app.put('/api/admin/reservations/:id', (req, res) => {
  const { id } = req.params;
  const { guest, room, checkin, checkout } = req.body;
  const sql = 'UPDATE reservations SET guest = ?, room = ?, checkin = ?, checkout = ? WHERE id = ?';
  db.run(sql, [guest, room, checkin, checkout, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Reserva actualizada con éxito' });
  });
});

app.delete('/api/admin/reservations/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM reservations WHERE id = ?';
  db.run(sql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Reserva eliminada con éxito' });
  });
});
