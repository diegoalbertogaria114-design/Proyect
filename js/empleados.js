// empleados.js - Lógica para el módulo de empleados (Solo Admin)

document.addEventListener('DOMContentLoaded', () => {
  // Proteger ruta para ADMIN
  if (!auth.protect(true)) return;

  const user = auth.getCurrentUser();
  document.getElementById('displayUserName').textContent = user.nombre || user.username;
  document.getElementById('displayUserRole').textContent = user.rol;
  document.getElementById('displayUserAvatar').textContent = (user.nombre || user.username).charAt(0).toUpperCase();

  // Mostrar elementos de admin (ya validado)
  document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('admin-only'));

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });

  // Lógica de Empleados (Guardamos en la colección 'usuarios' del localStorage para que puedan hacer login)
  // Requisito: admin registra empleados.
  const tableBody = document.querySelector('#empleadosTable tbody');
  const modal = document.getElementById('empleadoModal');
  const form = document.getElementById('empleadoForm');
  
  function renderTable() {
    const usuarios = db.get('usuarios') || [];
    tableBody.innerHTML = '';
    
    if (usuarios.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay empleados registrados</td></tr>';
      return;
    }

    usuarios.forEach(u => {
      // El admin principal (admin) no debería ser borrable para evitar dejar el sistema sin admin
      const isMainAdmin = u.username === 'admin';
      const deleteBtn = !isMainAdmin ? 
        `<button class="btn btn-outline btn-delete" data-id="${u.id}" style="padding: 0.25rem 0.5rem; border-color: var(--danger-color); color: var(--danger-color);" title="Eliminar"><i class="fa-solid fa-trash"></i></button>` : '';

      tableBody.innerHTML += `
        <tr>
          <td>#${u.id}</td>
          <td style="font-weight: 500;">${u.nombre}</td>
          <td>${u.username}</td>
          <td><span class="badge ${u.rol === 'ADMIN' ? 'badge-warning' : 'badge-success'}">${u.rol}</span></td>
          <td>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-outline btn-edit" data-id="${u.id}" style="padding: 0.25rem 0.5rem;" title="Editar"><i class="fa-solid fa-pen"></i></button>
              ${deleteBtn}
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
        if (confirm('¿Estás seguro de eliminar este empleado/usuario?')) {
          db.remove('usuarios', id);
          renderTable();
        }
      });
    });
  }

  // Manejo del Modal
  document.getElementById('btnNuevoEmpleado').addEventListener('click', () => openModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

  function openModal(id = null) {
    form.reset();
    if (id) {
      document.getElementById('modalTitle').textContent = 'Editar Empleado';
      const usuarios = db.get('usuarios') || [];
      const u = usuarios.find(item => item.id == id);
      if (u) {
        document.getElementById('empleadoId').value = u.id;
        document.getElementById('nombre').value = u.nombre;
        document.getElementById('username').value = u.username;
        document.getElementById('password').value = u.password;
        document.getElementById('rol').value = u.rol;
      }
    } else {
      document.getElementById('modalTitle').textContent = 'Nuevo Empleado';
      document.getElementById('empleadoId').value = '';
    }
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('empleadoId').value;
    const username = document.getElementById('username').value.trim();
    
    const empleadoData = {
      nombre: document.getElementById('nombre').value,
      username: username,
      password: document.getElementById('password').value,
      rol: document.getElementById('rol').value
    };

    const usuarios = db.get('usuarios') || [];
    const isDuplicate = usuarios.some(u => u.username === username && u.id != id);
    if (isDuplicate) {
      alert('Ese nombre de usuario ya está en uso. Por favor elige otro.');
      return;
    }

    if (id) {
      db.update('usuarios', id, empleadoData);
    } else {
      db.add('usuarios', empleadoData);
    }

    // Si también se necesita en la tabla "empleados" para control de asistencia:
    // (Por simplicidad, el sistema puede leer de 'usuarios' como empleados).

    closeModal();
    renderTable();
  });

  renderTable();
});
