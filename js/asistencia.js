// asistencia.js - Lógica para el control de asistencia

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

  // Reloj en vivo
  const relojEl = document.getElementById('relojActual');
  const fechaEl = document.getElementById('fechaActual');
  
  function updateReloj() {
    const now = new Date();
    relojEl.textContent = now.toLocaleTimeString('es-ES');
    fechaEl.textContent = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  setInterval(updateReloj, 1000);
  updateReloj();

  // Lógica de Asistencia
  const btnEntrada = document.getElementById('btnEntrada');
  const btnSalida = document.getElementById('btnSalida');
  const statusMsg = document.getElementById('statusMsg');
  const infoEntrada = document.getElementById('infoEntrada');
  const infoSalida = document.getElementById('infoSalida');
  const badgeEstado = document.getElementById('badgeEstado');
  const tbody = document.querySelector('#asistenciaTable tbody');

  // Obtener fecha actual en formato YYYY-MM-DD
  const hoy = new Date().toISOString().split('T')[0];

  function getMisAsistencias() {
    const asistencias = db.get('asistencias') || [];
    return asistencias.filter(a => a.empleadoId === user.id);
  }

  function renderEstadoHoy() {
    const misAsistencias = getMisAsistencias();
    const asistenciaHoy = misAsistencias.find(a => a.fecha === hoy);

    if (!asistenciaHoy) {
      btnEntrada.disabled = false;
      btnSalida.disabled = true;
      infoEntrada.textContent = '--:--:--';
      infoSalida.textContent = '--:--:--';
      badgeEstado.textContent = 'Sin Registrar';
      badgeEstado.className = 'badge badge-warning';
    } else {
      infoEntrada.textContent = asistenciaHoy.horaEntrada || '--:--:--';
      
      if (asistenciaHoy.horaSalida) {
        // Ya salió
        infoSalida.textContent = asistenciaHoy.horaSalida;
        btnEntrada.disabled = true;
        btnSalida.disabled = true;
        badgeEstado.textContent = 'Jornada Completada';
        badgeEstado.className = 'badge badge-success';
      } else {
        // Trabajando
        infoSalida.textContent = '--:--:--';
        btnEntrada.disabled = true;
        btnSalida.disabled = false;
        badgeEstado.textContent = 'Trabajando';
        badgeEstado.className = 'badge badge-primary';
      }
    }
  }

  function renderHistorial() {
    const misAsistencias = getMisAsistencias().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Orden descendente
    tbody.innerHTML = '';

    if (misAsistencias.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay registros de asistencia</td></tr>';
      return;
    }

    misAsistencias.forEach(a => {
      let horas = '-';
      if (a.horaEntrada && a.horaSalida) {
        // Calcular horas
        const entrada = new Date(`${a.fecha}T${a.horaEntrada}`);
        const salida = new Date(`${a.fecha}T${a.horaSalida}`);
        const diffMs = salida - entrada;
        const diffHrs = diffMs / (1000 * 60 * 60);
        horas = diffHrs.toFixed(2) + ' h';
      }

      tbody.innerHTML += `
        <tr>
          <td>${a.fecha}</td>
          <td>${a.horaEntrada}</td>
          <td>${a.horaSalida || '<em>Sin registrar</em>'}</td>
          <td>${horas}</td>
        </tr>
      `;
    });
  }

  btnEntrada.addEventListener('click', () => {
    const ahora = new Date().toLocaleTimeString('es-ES', { hour12: false });
    
    const nuevaAsistencia = {
      empleadoId: user.id,
      empleadoNombre: user.nombre || user.username,
      fecha: hoy,
      horaEntrada: ahora,
      horaSalida: null
    };

    db.add('asistencias', nuevaAsistencia);
    
    statusMsg.textContent = 'Entrada registrada correctamente.';
    setTimeout(() => statusMsg.textContent = '', 3000);
    
    renderEstadoHoy();
    renderHistorial();
  });

  btnSalida.addEventListener('click', () => {
    const ahora = new Date().toLocaleTimeString('es-ES', { hour12: false });
    const asistencias = db.get('asistencias') || [];
    
    const index = asistencias.findIndex(a => a.empleadoId === user.id && a.fecha === hoy);
    if (index !== -1) {
      asistencias[index].horaSalida = ahora;
      db.set('asistencias', asistencias);
      
      statusMsg.textContent = 'Salida registrada correctamente.';
      setTimeout(() => statusMsg.textContent = '', 3000);
      
      renderEstadoHoy();
      renderHistorial();
    }
  });

  // Inicializar UI
  renderEstadoHoy();
  renderHistorial();
});
