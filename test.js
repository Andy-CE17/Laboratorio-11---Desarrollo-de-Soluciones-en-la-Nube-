const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('./server');

test('health endpoint reports a working service', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.app, 'Contactos Nimbus');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('contacts endpoint returns the seeded directory', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/contacts`);
    assert.equal(response.status, 200);
    const contacts = await response.json();
    assert.ok(Array.isArray(contacts));
    assert.ok(contacts.length >= 4);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
