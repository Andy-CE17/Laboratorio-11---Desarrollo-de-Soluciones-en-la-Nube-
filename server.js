const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const dataFile = path.join(__dirname, 'data', 'contacts.json');
const validCategories = new Set(['Clientes', 'Equipo', 'Proveedores', 'Personal']);

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function readContacts() {
  const raw = await fs.readFile(dataFile, 'utf8');
  return JSON.parse(raw);
}

async function writeContacts(contacts) {
  const temp = `${dataFile}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(contacts, null, 2)}\n`, 'utf8');
  await fs.rename(temp, dataFile);
}

function cleanText(value, max = 160) {
  return String(value ?? '').trim().slice(0, max);
}

function validateContact(body) {
  const contact = {
    name: cleanText(body.name, 80),
    email: cleanText(body.email, 120).toLowerCase(),
    phone: cleanText(body.phone, 30),
    company: cleanText(body.company, 80),
    role: cleanText(body.role, 80),
    category: cleanText(body.category, 30),
    city: cleanText(body.city, 60),
    notes: cleanText(body.notes, 500),
    favorite: Boolean(body.favorite),
    color: /^#[0-9a-f]{6}$/i.test(body.color || '') ? body.color : '#4fd1c5'
  };

  const errors = [];
  if (contact.name.length < 2) errors.push('El nombre debe tener al menos 2 caracteres.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errors.push('Ingresa un correo válido.');
  if (contact.phone.length < 7) errors.push('Ingresa un teléfono válido.');
  if (!validCategories.has(contact.category)) errors.push('Selecciona una categoría válida.');
  return { contact, errors };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Contactos Nimbus', platform: process.platform, timestamp: new Date().toISOString() });
});

app.get('/api/contacts', async (_req, res, next) => {
  try {
    const contacts = await readContacts();
    contacts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

app.post('/api/contacts', async (req, res, next) => {
  try {
    const { contact, errors } = validateContact(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const contacts = await readContacts();
    const now = new Date().toISOString();
    const created = { id: crypto.randomUUID(), ...contact, createdAt: now, updatedAt: now };
    contacts.unshift(created);
    await writeContacts(contacts);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.put('/api/contacts/:id', async (req, res, next) => {
  try {
    const { contact, errors } = validateContact(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const contacts = await readContacts();
    const index = contacts.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Contacto no encontrado.' });
    contacts[index] = { ...contacts[index], ...contact, updatedAt: new Date().toISOString() };
    await writeContacts(contacts);
    res.json(contacts[index]);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/contacts/:id/favorite', async (req, res, next) => {
  try {
    const contacts = await readContacts();
    const contact = contacts.find((item) => item.id === req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contacto no encontrado.' });
    contact.favorite = !contact.favorite;
    contact.updatedAt = new Date().toISOString();
    await writeContacts(contacts);
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/contacts/:id', async (req, res, next) => {
  try {
    const contacts = await readContacts();
    const filtered = contacts.filter((item) => item.id !== req.params.id);
    if (filtered.length === contacts.length) return res.status(404).json({ error: 'Contacto no encontrado.' });
    await writeContacts(filtered);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'No se pudo completar la operación.' });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Contactos Nimbus disponible en http://localhost:${PORT}`);
  });
}

module.exports = app;
