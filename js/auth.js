// auth.js - Autenticación y control de acceso

const auth = {
  // Iniciar sesión
  login: function(username, password) {
    const usuarios = db.get('usuarios') || [];
    const user = usuarios.find(u => u.username === username && u.password === password);
    
    if (user) {
      // Eliminar password del objeto de sesión por seguridad
      const { password, ...sessionUser } = user;
      db.set('auth_session', sessionUser);
      return true;
    }
    return false;
  },

  // Cerrar sesión
  logout: function() {
    localStorage.removeItem(DB_PREFIX + 'auth_session');
    // Redirigir a la landing page o login
    const isRoot = window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html');
    if (!isRoot) {
      window.location.href = '../index.html';
    }
  },

  // Obtener usuario actual
  getCurrentUser: function() {
    return db.get('auth_session');
  },

  // Verificar si hay sesión activa
  isAuthenticated: function() {
    return this.getCurrentUser() !== null;
  },

  // Verificar si es admin
  isAdmin: function() {
    const user = this.getCurrentUser();
    return user && user.rol === 'ADMIN';
  },

  // Proteger ruta: redirige si no está autenticado o no tiene permisos
  protect: function(requireAdmin = false) {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html'; // asumiendo que estamos en pages/
      return false;
    }
    if (requireAdmin && !this.isAdmin()) {
      alert('No tienes permisos de administrador para acceder a esta sección.');
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  }
};

// L�gica para Toggle Sidebar en M�viles
document.addEventListener('DOMContentLoaded', () => {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (sidebarToggle && sidebar && overlay) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
});

