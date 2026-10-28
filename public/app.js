const state = { contacts: [], filter: 'all', search: '', sort: 'recent', pendingDelete: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  grid: $('#contactGrid'), empty: $('#emptyState'), search: $('#searchInput'), sort: $('#sortSelect'),
  contactModal: $('#contactModal'), deleteModal: $('#deleteModal'), form: $('#contactForm'),
  modalTitle: $('#modalTitle'), formError: $('#formError'), toast: $('#toast')
};

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value ?? '';
  return node.innerHTML;
}

function relativeDate(value) {
  const days = Math.floor((Date.now() - new Date(value)) / 86400000);
  if (days <= 0) return 'Actualizado hoy';
  if (days === 1) return 'Actualizado ayer';
  return `Hace ${days} días`;
}

function filteredContacts() {
  let result = [...state.contacts];
  if (state.filter === 'favorites') result = result.filter((item) => item.favorite);
  else if (state.filter !== 'all') result = result.filter((item) => item.category === state.filter);
  const query = state.search.toLowerCase();
  if (query) result = result.filter((item) => [item.name, item.company, item.city, item.email, item.role].join(' ').toLowerCase().includes(query));
  result.sort((a, b) => state.sort === 'name' ? a.name.localeCompare(b.name) : state.sort === 'company' ? a.company.localeCompare(b.company) : new Date(b.updatedAt) - new Date(a.updatedAt));
  return result;
}

function contactCard(contact) {
  return `<article class="contact-card" style="--contact-color:${contact.color}">
    <div class="card-top"><div class="contact-avatar">${initials(contact.name)}</div><div class="card-actions">
      <button class="icon-button ${contact.favorite ? 'favorite' : ''}" data-action="favorite" data-id="${contact.id}" aria-label="${contact.favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">★</button>
      <button class="icon-button" data-action="edit" data-id="${contact.id}" aria-label="Editar contacto">✎</button>
      <button class="icon-button" data-action="delete" data-id="${contact.id}" aria-label="Eliminar contacto">⋯</button>
    </div></div>
    <h3>${escapeHtml(contact.name)}</h3><p class="contact-role">${escapeHtml(contact.role || 'Contacto')} · ${escapeHtml(contact.company || 'Independiente')}</p>
    <div class="contact-info"><div class="contact-line"><span>✉</span><span>${escapeHtml(contact.email)}</span></div><div class="contact-line"><span>⌕</span><span>${escapeHtml(contact.phone)}</span></div><div class="contact-line"><span>⌂</span><span>${escapeHtml(contact.city || 'Sin ciudad')}</span></div></div>
    <div class="card-footer"><span class="category-tag">${escapeHtml(contact.category)}</span><span class="updated-label">${relativeDate(contact.updatedAt)}</span></div>
  </article>`;
}

function render() {
  const contacts = filteredContacts();
  elements.grid.innerHTML = contacts.map(contactCard).join('');
  elements.grid.classList.toggle('hidden', !contacts.length);
  elements.empty.classList.toggle('hidden', Boolean(contacts.length));
  $('#totalMetric').textContent = state.contacts.length;
  $('#favoriteMetric').textContent = state.contacts.filter((c) => c.favorite).length;
  $('#companyMetric').textContent = new Set(state.contacts.map((c) => c.company).filter(Boolean)).size;
  $('#todayMetric').textContent = state.contacts.filter((c) => new Date(c.updatedAt).toDateString() === new Date().toDateString()).length;
  $('#allCount').textContent = state.contacts.length;
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.errors?.join(' ') || body.error || 'Ocurrió un error inesperado.');
  }
  return response.status === 204 ? null : response.json();
}

async function loadContacts() {
  try { state.contacts = await request('/api/contacts'); render(); }
  catch (error) { showToast(error.message, true); }
}

function showToast(message, danger = false) {
  elements.toast.textContent = message;
  elements.toast.style.borderColor = danger ? '#ff7a6b' : '#4fd1c5';
  elements.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('show'), 2600);
}

function updateFormAvatar() {
  $('#formAvatar').textContent = initials($('#name').value || 'Nuevo Contacto');
  $('#formAvatar').style.background = `${$('#color').value}55`;
}

function openContactModal(contact = null) {
  elements.form.reset();
  elements.formError.classList.add('hidden');
  $('#contactId').value = contact?.id || '';
  elements.modalTitle.textContent = contact ? 'Editar contacto' : 'Nuevo contacto';
  $('#saveButton').textContent = contact ? 'Guardar cambios' : 'Guardar contacto';
  ['name', 'email', 'phone', 'company', 'role', 'category', 'city', 'notes', 'color'].forEach((key) => {
    if (contact?.[key] !== undefined) $(`#${key}`).value = contact[key];
  });
  $('#favorite').checked = Boolean(contact?.favorite);
  if (!contact) { $('#category').value = 'Clientes'; $('#color').value = '#4fd1c5'; }
  updateFormAvatar();
  elements.contactModal.classList.remove('hidden');
  setTimeout(() => $('#name').focus(), 50);
}

function closeContactModal() { elements.contactModal.classList.add('hidden'); }

function setFilter(filter) {
  state.filter = filter;
  $$('.filter-chip, .nav-item').forEach((button) => button.classList.toggle('active', button.dataset.filter === filter));
  render();
}

$('#addContactButton').addEventListener('click', () => openContactModal());
$('#closeModal').addEventListener('click', closeContactModal);
$('#cancelButton').addEventListener('click', closeContactModal);
elements.contactModal.addEventListener('click', (event) => { if (event.target === elements.contactModal) closeContactModal(); });
$('#name').addEventListener('input', updateFormAvatar);
$('#color').addEventListener('input', updateFormAvatar);
elements.search.addEventListener('input', (event) => { state.search = event.target.value; render(); });
elements.sort.addEventListener('change', (event) => { state.sort = event.target.value; render(); });
$$('.filter-chip, .nav-item').forEach((button) => button.addEventListener('click', () => setFilter(button.dataset.filter)));

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = $('#contactId').value;
  const body = Object.fromEntries(['name','email','phone','company','role','category','city','notes','color'].map((key) => [key, $(`#${key}`).value]));
  body.favorite = $('#favorite').checked;
  $('#saveButton').disabled = true;
  try {
    await request(id ? `/api/contacts/${id}` : '/api/contacts', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    closeContactModal(); await loadContacts(); showToast(id ? 'Contacto actualizado correctamente.' : 'Contacto creado correctamente.');
  } catch (error) {
    elements.formError.textContent = error.message; elements.formError.classList.remove('hidden');
  } finally { $('#saveButton').disabled = false; }
});

elements.grid.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const contact = state.contacts.find((item) => item.id === button.dataset.id);
  if (!contact) return;
  if (button.dataset.action === 'edit') openContactModal(contact);
  if (button.dataset.action === 'delete') { state.pendingDelete = contact.id; elements.deleteModal.classList.remove('hidden'); }
  if (button.dataset.action === 'favorite') {
    try { await request(`/api/contacts/${contact.id}/favorite`, { method: 'PATCH' }); await loadContacts(); }
    catch (error) { showToast(error.message, true); }
  }
});

$('#cancelDelete').addEventListener('click', () => elements.deleteModal.classList.add('hidden'));
$('#confirmDelete').addEventListener('click', async () => {
  try { await request(`/api/contacts/${state.pendingDelete}`, { method: 'DELETE' }); elements.deleteModal.classList.add('hidden'); await loadContacts(); showToast('Contacto eliminado.'); }
  catch (error) { showToast(error.message, true); }
});

document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeContactModal(); elements.deleteModal.classList.add('hidden'); } });
request('/api/health').then((health) => { $('#platformLabel').textContent = health.platform === 'win32' ? 'Windows Server · en línea' : `${health.platform} · en línea`; }).catch(() => {});
loadContacts();
