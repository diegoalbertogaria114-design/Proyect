// inventario.js - Lógica para el módulo de inventario

document.addEventListener('DOMContentLoaded', () => {
  // 1. Proteger ruta
  if (!auth.protect()) return;

  // 2. Info de usuario
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

  // 3. Lógica del Inventario
  const tableBody = document.querySelector('#productosTable tbody');
  const modal = document.getElementById('productoModal');
  const form = document.getElementById('productoForm');
  let currentImageBase64 = null;
  
  function renderTable() {
    const productos = db.get('productos') || [];
    tableBody.innerHTML = '';
    
    if (productos.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos registrados</td></tr>';
      return;
    }

    productos.forEach(p => {
      // Determinar estado por stock
      let badgeClass = 'badge-success';
      let estadoText = 'Disponible';
      
      if (p.stock === 0) {
        badgeClass = 'badge-danger';
        estadoText = 'Agotado';
      } else if (p.stock < 5) {
        badgeClass = 'badge-warning';
        estadoText = 'Stock Bajo';
      }

      // Botón de eliminar solo para admin
      const deleteBtn = auth.isAdmin() ? 
        `<button class="btn btn-outline btn-delete" data-id="${p.id}" style="padding: 0.25rem 0.5rem; border-color: var(--danger-color); color: var(--danger-color);" title="Eliminar"><i class="fa-solid fa-trash"></i></button>` : '';

      const reponerBtn = `<button class="btn btn-outline btn-reponer" data-id="${p.id}" style="padding: 0.25rem 0.5rem; border-color: var(--success-color); color: var(--success-color);" title="Reponer Stock"><i class="fa-solid fa-plus-minus"></i></button>`;

      tableBody.innerHTML += `
        <tr>
          <td>#${p.id}</td>
          <td style="font-weight: 500;">${p.nombre}</td>
          <td><span class="badge" style="background: rgba(255,255,255,0.1);">${p.categoria || 'Sin Categoría'}</span></td>
          <td>S/${parseFloat(p.precio).toFixed(2)}</td>
          <td>${p.stock}</td>
          <td><span class="badge ${badgeClass}">${estadoText}</span></td>
          <td>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-outline btn-edit" data-id="${p.id}" style="padding: 0.25rem 0.5rem;" title="Editar"><i class="fa-solid fa-pen"></i></button>
              ${reponerBtn}
              ${deleteBtn}
            </div>
          </td>
        </tr>
      `;
    });

    attachEventListeners();
  }

  function attachEventListeners() {
    // Editar
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openModal(id);
      });
    });

    document.querySelectorAll('.btn-reponer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openReponerModal(id);
      });
    });

    // Eliminar
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!auth.isAdmin()) return; // Doble validación
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Estás seguro de eliminar este producto?')) {
          db.remove('productos', id);
          renderTable();
        }
      });
    });
  }

  // Manejo del Modal
  document.getElementById('btnNuevoProducto').addEventListener('click', () => openModal());
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

  function openModal(id = null) {
    form.reset();
    currentImageBase64 = null;
    document.getElementById('imagenPreviewContainer').style.display = 'none';

    if (id) {
      document.getElementById('modalTitle').textContent = 'Editar Producto';
      const productos = db.get('productos') || [];
      const p = productos.find(item => item.id == id);
      if (p) {
        document.getElementById('productoId').value = p.id;
        document.getElementById('nombre').value = p.nombre;
        document.getElementById('categoria').value = p.categoria || '';
        document.getElementById('precio').value = p.precio;
        document.getElementById('stock').value = p.stock;
        
        if (p.imagen) {
          currentImageBase64 = p.imagen;
          document.getElementById('imagenPreview').src = p.imagen;
          document.getElementById('imagenPreviewContainer').style.display = 'block';
        }
      }
    } else {
      document.getElementById('modalTitle').textContent = 'Nuevo Producto';
      document.getElementById('productoId').value = '';
    }
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  // Procesar Imagen
  document.getElementById('imagen').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        // Comprimir imagen con Canvas
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a WebP o JPEG
        currentImageBase64 = canvas.toDataURL('image/webp', 0.8);
        document.getElementById('imagenPreview').src = currentImageBase64;
        document.getElementById('imagenPreviewContainer').style.display = 'block';
      }
      img.src = event.target.result;
    }
    reader.readAsDataURL(file);
  });

  // Guardar/Actualizar Producto
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('productoId').value;
    const productoData = {
      nombre: document.getElementById('nombre').value,
      categoria: document.getElementById('categoria').value,
      imagen: currentImageBase64,
      precio: parseFloat(document.getElementById('precio').value),
      stock: parseInt(document.getElementById('stock').value)
    };

    if (productoData.stock < 0) {
      alert('El stock no puede ser negativo');
      return;
    }

    if (id) {
      db.update('productos', id, productoData);
    } else {
      db.add('productos', productoData);
    }

    closeModal();
    renderTable();
  });

  // Modal de Reposición
  const reponerModal = document.getElementById('reponerModal');
  const reponerForm = document.getElementById('reponerForm');
  
  document.getElementById('closeReponerBtn').addEventListener('click', closeReponerModal);
  document.getElementById('cancelReponerBtn').addEventListener('click', closeReponerModal);

  function openReponerModal(id) {
    const productos = db.get('productos') || [];
    const p = productos.find(item => item.id == id);
    if (p) {
      reponerForm.reset();
      document.getElementById('reponerProductoId').value = p.id;
      document.getElementById('reponerProductoNombre').textContent = p.nombre;
      document.getElementById('reponerStockActual').textContent = p.stock;
      reponerModal.classList.add('active');
    }
  }

  function closeReponerModal() {
    reponerModal.classList.remove('active');
  }

  reponerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('reponerProductoId').value;
    const cantidadAgregar = parseInt(document.getElementById('cantidadReponer').value);
    
    if (cantidadAgregar <= 0) {
      alert('Debe agregar una cantidad válida.');
      return;
    }

    const productos = db.get('productos') || [];
    const p = productos.find(item => item.id == id);
    
    if (p) {
      // Registrar la reposición (opcionalmente guardar en una tabla de movimientos)
      const nuevaCantidad = parseInt(p.stock) + cantidadAgregar;
      db.update('productos', id, { stock: nuevaCantidad });
      
      closeReponerModal();
      renderTable();
    }
  });

  // Inicializar tabla
  renderTable();
});
