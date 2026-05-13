// configuracion.js - Lógica para la configuración de empresa (Solo Admin)

document.addEventListener('DOMContentLoaded', () => {
  // Proteger ruta para ADMIN
  if (!auth.protect(true)) return;

  const user = auth.getCurrentUser();
  document.getElementById('displayUserName').textContent = user.nombre || user.username;
  document.getElementById('displayUserRole').textContent = user.rol;
  document.getElementById('displayUserAvatar').textContent = (user.nombre || user.username).charAt(0).toUpperCase();

  document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('admin-only'));

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });

  // Lógica de Configuración
  const form = document.getElementById('configForm');
  const msg = document.getElementById('saveMsg');
  
  // Cargar datos actuales
  const info = db.get('empresa_info');
  if (info) {
    document.getElementById('empresaNombre').value = info.nombre || '';
    document.getElementById('empresaDireccion').value = info.direccion || '';
    document.getElementById('empresaTelefono').value = info.telefono || '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const empresaData = {
      nombre: document.getElementById('empresaNombre').value,
      direccion: document.getElementById('empresaDireccion').value,
      telefono: document.getElementById('empresaTelefono').value
    };

    db.set('empresa_info', empresaData);
    
    // Mostrar mensaje de éxito
    msg.style.display = 'block';
    setTimeout(() => {
      msg.style.display = 'none';
    }, 3000);
  });

  // --- Lógica del Boletín ---
  let boletinActivo = false;
  let boletinImagenBase64 = null;

  // Cargar estado actual del boletín
  const boletinData = localStorage.getItem('diwifa_boletin');
  if (boletinData) {
    const boletin = JSON.parse(boletinData);
    boletinActivo = boletin.activo || false;
    boletinImagenBase64 = boletin.imagen || null;

    if (boletinImagenBase64) {
      document.getElementById('boletinPreview').src = boletinImagenBase64;
      document.getElementById('boletinPreviewContainer').style.display = 'block';
    }
  }
  actualizarBotonesEstado();

  function actualizarBotonesEstado() {
    const btnActivo = document.getElementById('btnBoletinActivo');
    const btnInactivo = document.getElementById('btnBoletinInactivo');
    if (boletinActivo) {
      btnActivo.style.background = 'var(--success-color)';
      btnActivo.style.color = 'white';
      btnActivo.style.borderColor = 'var(--success-color)';
      btnInactivo.style.background = '';
      btnInactivo.style.color = '';
      btnInactivo.style.borderColor = '';
    } else {
      btnInactivo.style.background = 'var(--danger-color)';
      btnInactivo.style.color = 'white';
      btnInactivo.style.borderColor = 'var(--danger-color)';
      btnActivo.style.background = '';
      btnActivo.style.color = '';
      btnActivo.style.borderColor = '';
    }
  }

  document.getElementById('btnBoletinActivo').addEventListener('click', () => {
    boletinActivo = true;
    actualizarBotonesEstado();
  });

  document.getElementById('btnBoletinInactivo').addEventListener('click', () => {
    boletinActivo = false;
    actualizarBotonesEstado();
  });

  // Subir imagen del boletín
  document.getElementById('boletinImagen').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar tamaño máximo (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      boletinImagenBase64 = event.target.result;
      document.getElementById('boletinPreview').src = boletinImagenBase64;
      document.getElementById('boletinPreviewContainer').style.display = 'block';
    };
    reader.onerror = function() {
      alert('Error al leer la imagen. Intente con otra.');
    };
    reader.readAsDataURL(file);
  });

  // Guardar boletín
  document.getElementById('btnGuardarBoletin').addEventListener('click', () => {
    const boletinObj = {
      activo: boletinActivo,
      imagen: boletinImagenBase64
    };
    localStorage.setItem('diwifa_boletin', JSON.stringify(boletinObj));
    
    const boletinMsg = document.getElementById('boletinMsg');
    boletinMsg.style.display = 'block';
    setTimeout(() => { boletinMsg.style.display = 'none'; }, 3000);
  });
});
