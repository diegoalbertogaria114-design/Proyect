// clientes.js - Lógica para el módulo de clientes

document.addEventListener('DOMContentLoaded', () => {
  if (!auth.protect()) return;

  const user = auth.getCurrentUser();
  document.getElementById('displayUserName').textContent = user.nombre || user.username;
  document.getElementById('displayUserRole').textContent = user.rol;
  document.getElementById('displayUserAvatar').textContent = (user.nombre || user.username).charAt(0).toUpperCase();

  if (auth.isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('admin-only'));
  }

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });

  // Lógica de Clientes
  const tableBody = document.querySelector('#clientesTable tbody');
  const modal = document.getElementById('clienteModal');
  const form = document.getElementById('clienteForm');
  
  function renderTable() {
    const clientes = db.get('clientes') || [];
    tableBody.innerHTML = '';
    
    if (clientes.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay clientes registrados</td></tr>';
      return;
    }

    clientes.forEach(c => {
      tableBody.innerHTML += `
        <tr>
          <td>${c.dni || '-'}</td>
          <td style="font-weight: 500;">${c.nombre}</td>
          <td>${c.celular || c.telefono || '-'}</td>
          <td>${c.correo || '-'}</td>
          <td>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-outline btn-edit" data-id="${c.id}" style="padding: 0.25rem 0.5rem;" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-outline btn-delete" data-id="${c.id}" style="padding: 0.25rem 0.5rem; border-color: var(--danger-color); color: var(--danger-color);" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    attachEventListeners();
  }

  function attachEventListeners() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openModal(id);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
          db.remove('clientes', id);
          renderTable();
        }
      });
    });
  }

  // Manejo del Modal
  document.getElementById('btnNuevoCliente').addEventListener('click', () => openModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

  function openModal(id = null) {
    form.reset();
    if (id) {
      document.getElementById('modalTitle').textContent = 'Editar Cliente';
      const clientes = db.get('clientes') || [];
      const c = clientes.find(item => item.id == id);
      if (c) {
        document.getElementById('clienteId').value = c.id;
        if(document.getElementById('dni')) document.getElementById('dni').value = c.dni || '';
        document.getElementById('nombre').value = c.nombre;
        if(document.getElementById('celular')) document.getElementById('celular').value = c.celular || c.telefono || '';
        document.getElementById('correo').value = c.correo || '';
      }
    } else {
      document.getElementById('modalTitle').textContent = 'Nuevo Cliente';
      document.getElementById('clienteId').value = '';
    }
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  // Guardar/Actualizar Cliente
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('clienteId').value;
    const nombre = document.getElementById('nombre').value.trim();
    const clienteData = {
      nombre: nombre,
      dni: document.getElementById('dni') ? document.getElementById('dni').value : '',
      celular: document.getElementById('celular') ? document.getElementById('celular').value : '',
      correo: document.getElementById('correo').value
    };

    const clientes = db.get('clientes') || [];

    // Validar duplicado por nombre (ignorando el cliente actual si estamos editando)
    const isDuplicate = clientes.some(c => c.nombre.toLowerCase() === nombre.toLowerCase() && c.id != id);
    if (isDuplicate) {
      alert('Ya existe un cliente con este nombre.');
      return;
    }

    if (id) {
      db.update('clientes', id, clienteData);
    } else {
      db.add('clientes', clienteData);
    }

    closeModal();
    renderTable();
  });

  renderTable();
  // API RENIEC
  const btnBuscarDni = document.getElementById('btnBuscarDni');
  if (btnBuscarDni) {
    btnBuscarDni.addEventListener('click', async () => {
      const dni = document.getElementById('dni').value.trim();
      if (dni.length !== 8) {
        alert('Por favor ingrese un DNI válido de 8 dígitos');
        return;
      }
      const originalHtml = btnBuscarDni.innerHTML;
      btnBuscarDni.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      btnBuscarDni.disabled = true;

      try {
        // Usamos un proxy CORS abierto para que funcione localmente (file://)
        const response = await fetch('https://api.codetabs.com/v1/proxy/?quest=https://api.apis.net.pe/v1/dni?numero=' + dni);
        if (response.ok) {
          const data = await response.json();
          if (data && data.nombre) {
            document.getElementById('nombre').value = data.nombre;
          } else {
            alert('DNI no encontrado.');
          }
        } else {
          alert('Error en la API. Por favor, intenta de nuevo.');
        }
      } catch (error) {
        alert('Error de conexión con RENIEC.');
      } finally {
        btnBuscarDni.innerHTML = originalHtml;
        btnBuscarDni.disabled = false;
      }
    });
  }
});


