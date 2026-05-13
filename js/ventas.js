// ventas.js - Lógica para el módulo de ventas (POS)

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

  // Estado del Carrito
  let carrito = [];
  const dbProductos = db.get('productos') || [];
  const dbClientes = db.get('clientes') || [];
  const empresaInfo = db.get('empresa_info') || { nombre: 'diwifa', direccion: '', telefono: '' };

  // Elementos DOM
  const selectProducto = document.getElementById('productoSelect');
  const inputCantidad = document.getElementById('cantidadInput');
  const inputDescuento = document.getElementById('descuentoInput');
  const btnAgregar = document.getElementById('btnAgregar');
  const tablaCarrito = document.querySelector('#carritoTable tbody');
  const emptyCartRow = document.getElementById('emptyCartRow');
  const subtotalLabel = document.getElementById('subtotalLabel');
  const totalLabel = document.getElementById('totalLabel');
  const btnRegistrarVenta = document.getElementById('btnRegistrarVenta');
  const modalComprobante = document.getElementById('comprobanteModal');
  const dniInput = document.getElementById('dniComprador');
  const nombreInput = document.getElementById('nombreComprador');
  const clienteIdHidden = document.getElementById('clienteIdSeleccionado');

  // --- Buscador de Productos ---
  const productoBuscar = document.getElementById('productoBuscar');
  const sugerenciasProd = document.getElementById('sugerenciasProductos');

  productoBuscar.addEventListener('input', () => {
    const query = productoBuscar.value.trim().toLowerCase();
    selectProducto.value = '';
    sugerenciasProd.innerHTML = '';

    if (query.length < 1) { sugerenciasProd.style.display = 'none'; return; }

    const resultados = dbProductos.filter(p => 
      p.stock > 0 && (p.nombre.toLowerCase().includes(query) || (p.categoria && p.categoria.toLowerCase().includes(query)))
    ).slice(0, 8);

    if (resultados.length === 0) {
      sugerenciasProd.innerHTML = '<div style="padding: 0.75rem 1rem; font-size: 0.9rem; color: var(--text-secondary);">No se encontraron productos</div>';
      sugerenciasProd.style.display = 'block';
      return;
    }

    resultados.forEach(p => {
      const div = document.createElement('div');
      div.style.cssText = 'padding: 0.6rem 1rem; cursor: pointer; font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;';
      div.innerHTML = `
        <div><strong>${p.nombre}</strong> <span style="font-size: 0.75rem; color: var(--text-secondary);">${p.categoria || ''}</span></div>
        <div style="text-align: right; white-space: nowrap;">
          <span style="color: var(--primary-color); font-weight: 600;">S/${parseFloat(p.precio).toFixed(2)}</span>
          <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: 0.5rem;">Stock: ${p.stock}</span>
        </div>
      `;
      div.addEventListener('click', () => {
        selectProducto.value = p.id;
        productoBuscar.value = p.nombre;
        sugerenciasProd.style.display = 'none';
      });
      div.addEventListener('mouseenter', () => div.style.background = 'rgba(255,255,255,0.05)');
      div.addEventListener('mouseleave', () => div.style.background = '');
      sugerenciasProd.appendChild(div);
    });
    sugerenciasProd.style.display = 'block';
  });

  // Mostrar todos al hacer focus si está vacío
  productoBuscar.addEventListener('focus', () => {
    if (productoBuscar.value.trim() === '') {
      productoBuscar.dispatchEvent(new Event('input'));
    }
  });

  // Cerrar sugerencias de productos al clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#productoBuscar') && !e.target.closest('#sugerenciasProductos')) {
      sugerenciasProd.style.display = 'none';
    }
  });

  // --- Buscar DNI con RENIEC ---
  document.getElementById('btnBuscarDniVenta').addEventListener('click', async () => {
    const dni = dniInput.value.trim();
    if (dni.length !== 8) { alert('Ingrese un DNI válido de 8 dígitos'); return; }

    const btn = document.getElementById('btnBuscarDniVenta');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    // Primero buscar en clientes locales
    const clientesDB = db.get('clientes') || [];
    const clienteLocal = clientesDB.find(c => c.dni === dni);
    if (clienteLocal) {
      nombreInput.value = clienteLocal.nombre;
      clienteIdHidden.value = clienteLocal.id;
      mostrarInfoComprador(clienteLocal.nombre + ' (Cliente registrado)');
      btn.innerHTML = '<i class="fa-solid fa-search"></i> RENIEC';
      btn.disabled = false;
      return;
    }

    // Si no existe, buscar en RENIEC
    try {
      const response = await fetch('https://api.codetabs.com/v1/proxy/?quest=https://api.apis.net.pe/v1/dni?numero=' + dni);
      if (response.ok) {
        const data = await response.json();
        if (data && data.nombre) {
          nombreInput.value = data.nombre;
          clienteIdHidden.value = '0'; // Nuevo, se registrará al hacer la venta
          mostrarInfoComprador(data.nombre + ' (Nuevo - se registrará automáticamente)');
        } else {
          alert('DNI no encontrado.');
        }
      } else {
        alert('Error en la API RENIEC.');
      }
    } catch (error) {
      alert('Error de conexión con RENIEC.');
    } finally {
      btn.innerHTML = '<i class="fa-solid fa-search"></i> RENIEC';
      btn.disabled = false;
    }
  });

  function mostrarInfoComprador(texto) {
    document.getElementById('infoComprador').style.display = 'block';
    document.getElementById('infoCompradorTexto').textContent = texto;
  }

  // --- Búsqueda por nombre (autocompletado) ---
  nombreInput.addEventListener('input', () => {
    const query = nombreInput.value.trim().toLowerCase();
    const sugerencias = document.getElementById('sugerenciasClientes');
    clienteIdHidden.value = '0';
    document.getElementById('infoComprador').style.display = 'none';

    if (query.length < 2) { sugerencias.style.display = 'none'; return; }

    const clientesDB = db.get('clientes') || [];
    const resultados = clientesDB.filter(c => c.nombre.toLowerCase().includes(query)).slice(0, 5);

    if (resultados.length === 0) { sugerencias.style.display = 'none'; return; }

    sugerencias.innerHTML = '';
    resultados.forEach(c => {
      const div = document.createElement('div');
      div.style.cssText = 'padding: 0.5rem 1rem; cursor: pointer; font-size: 0.9rem; border-bottom: 1px solid var(--surface-border);';
      div.innerHTML = `<strong>${c.nombre}</strong> <span style="color: var(--text-secondary); font-size: 0.8rem;">${c.dni || ''}</span>`;
      div.addEventListener('click', () => {
        nombreInput.value = c.nombre;
        dniInput.value = c.dni || '';
        clienteIdHidden.value = c.id;
        sugerencias.style.display = 'none';
        mostrarInfoComprador(c.nombre + ' (Cliente registrado)');
      });
      div.addEventListener('mouseenter', () => div.style.background = 'rgba(255,255,255,0.05)');
      div.addEventListener('mouseleave', () => div.style.background = '');
      sugerencias.appendChild(div);
    });
    sugerencias.style.display = 'block';
  });

  // Cerrar sugerencias al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#nombreComprador') && !e.target.closest('#sugerenciasClientes')) {
      document.getElementById('sugerenciasClientes').style.display = 'none';
    }
  });

  // Agregar al Carrito
  btnAgregar.addEventListener('click', () => {
    const prodId = selectProducto.value;
    const cantidad = parseInt(inputCantidad.value);

    if (!prodId) {
      alert('Por favor seleccione un producto.');
      return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
      alert('Cantidad inválida.');
      return;
    }

    const producto = dbProductos.find(p => p.id == prodId);
    
    // Verificar stock
    if (producto.stock < cantidad) {
      alert(`No hay suficiente stock. Disponible: ${producto.stock}`);
      return;
    }

    // Verificar si ya está en el carrito
    const itemEnCarrito = carrito.find(item => item.productoId == prodId);
    if (itemEnCarrito) {
      if (itemEnCarrito.cantidad + cantidad > producto.stock) {
        alert(`No puedes exceder el stock disponible (${producto.stock}).`);
        return;
      }
      itemEnCarrito.cantidad += cantidad;
      itemEnCarrito.subtotal = itemEnCarrito.cantidad * producto.precio;
    } else {
      carrito.push({
        productoId: producto.id,
        nombre: producto.nombre,
        precio: parseFloat(producto.precio),
        cantidad: cantidad,
        subtotal: cantidad * parseFloat(producto.precio)
      });
    }

    // Resetear inputs
    selectProducto.value = '';
    productoBuscar.value = '';
    inputCantidad.value = 1;

    actualizarCarrito();
  });

  // Actualizar UI del Carrito
  function actualizarCarrito() {
    tablaCarrito.innerHTML = '';
    
    if (carrito.length === 0) {
      tablaCarrito.appendChild(emptyCartRow);
      emptyCartRow.style.display = 'table-row';
      document.getElementById('subtotalSinIgvLabel').textContent = 'S/0.00';
      document.getElementById('igvLabel').textContent = 'S/0.00';
      subtotalLabel.textContent = 'S/0.00';
      totalLabel.textContent = 'S/0.00';
      btnRegistrarVenta.disabled = true;
      return;
    }

    let total = 0;

    carrito.forEach((item, index) => {
      total += item.subtotal;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 500;">${item.nombre}</td>
        <td>${item.cantidad}</td>
        <td>S/${item.precio.toFixed(2)}</td>
        <td>S/${item.subtotal.toFixed(2)}</td>
        <td>
          <button class="btn btn-outline" onclick="eliminarItem(${index})" style="padding: 0.25rem 0.5rem; border-color: var(--danger-color); color: var(--danger-color);"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tablaCarrito.appendChild(tr);
    });

    // Calcular IGV (18%) - El precio ya incluye IGV
    const subtotalConIgv = total;
    const subtotalSinIgv = subtotalConIgv / 1.18;
    const igv = subtotalConIgv - subtotalSinIgv;

    let descuentoInputVal = parseFloat(inputDescuento.value) || 0;
    if (descuentoInputVal < 0) descuentoInputVal = 0;
    if (descuentoInputVal > 100) descuentoInputVal = 100;
    
    const descuentoAmt = subtotalConIgv * (descuentoInputVal / 100);
    const totalConDescuento = subtotalConIgv - descuentoAmt;

    document.getElementById('subtotalSinIgvLabel').textContent = `S/${subtotalSinIgv.toFixed(2)}`;
    document.getElementById('igvLabel').textContent = `S/${igv.toFixed(2)}`;
    subtotalLabel.textContent = `S/${subtotalConIgv.toFixed(2)}`;
    totalLabel.textContent = `S/${totalConDescuento.toFixed(2)}`;
    btnRegistrarVenta.disabled = false;
  }

  inputDescuento.addEventListener('input', actualizarCarrito);

  // Hacer función accesible globalmente
  window.eliminarItem = (index) => {
    carrito.splice(index, 1);
    actualizarCarrito();
  };

  // Registrar Venta
  btnRegistrarVenta.addEventListener('click', () => {
    if (carrito.length === 0) return;

    const clientId = clienteIdHidden.value;
    const nombreCliente = nombreInput.value.trim();
    const dniCliente = dniInput.value.trim();
    const totalSub = carrito.reduce((acc, item) => acc + item.subtotal, 0);
    
    // Si es un cliente nuevo (no registrado), registrarlo automáticamente
    let finalClientId = clientId;
    if (finalClientId == '0' && nombreCliente) {
      // Verificar que no exista ya por DNI
      const clientesDB = db.get('clientes') || [];
      const yaExiste = dniCliente ? clientesDB.find(c => c.dni === dniCliente) : null;
      if (yaExiste) {
        finalClientId = yaExiste.id;
      } else {
        const nuevoCliente = db.add('clientes', {
          nombre: nombreCliente,
          dni: dniCliente,
          celular: '',
          correo: ''
        });
        finalClientId = nuevoCliente.id;
      }
    }
    
    let descVal = parseFloat(inputDescuento.value) || 0;
    const descuentoAmt = totalSub * (descVal / 100);
    const totalFinal = totalSub - descuentoAmt;
    
    const venta = {
      fecha: new Date().toISOString(),
      clientId: finalClientId == "0" ? null : finalClientId,
      clienteDni: dniCliente,
      clienteNombre: nombreCliente,
      vendedorId: user.id,
      vendedorNombre: user.nombre || user.username,
      subtotal: totalSub,
      subtotalSinIgv: totalSub / 1.18,
      igv: totalSub - (totalSub / 1.18),
      descuentoPct: descVal,
      descuentoAmt: descuentoAmt,
      total: totalFinal,
      metodoPago: document.getElementById('metodoPagoSelect').value,
      productos: carrito.map(item => ({
        productId: item.productoId,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        subtotal: item.subtotal
      }))
    };

    // Guardar Venta
    const savedVenta = db.add('ventas', venta);

    // Descontar Stock
    const productosDB = db.get('productos');
    carrito.forEach(cartItem => {
      const pIndex = productosDB.findIndex(p => p.id == cartItem.productoId);
      if (pIndex !== -1) {
        productosDB[pIndex].stock -= cartItem.cantidad;
      }
    });
    db.set('productos', productosDB);

    // Generar Comprobante
    generarComprobante(savedVenta);
    
    // Limpiar carrito
    carrito = [];
    actualizarCarrito();
    
    // Mostrar Modal
    modalComprobante.classList.add('active');
  });

  // Generar Factura Visual
  function generarComprobante(venta) {
    document.getElementById('facturaEmpresa').textContent = empresaInfo.nombre;
    document.getElementById('facturaDireccion').textContent = empresaInfo.direccion;
    document.getElementById('facturaTelefono').textContent = empresaInfo.telefono;

    document.getElementById('facturaId').textContent = String(venta.id).padStart(6, '0');
    document.getElementById('facturaFecha').textContent = new Date(venta.fecha).toLocaleString();
    
    let nombreCliente = 'Consumidor Final';
    let dniCliente = venta.clienteDni || '';
    if (venta.clientId) {
      const cliente = (db.get('clientes') || []).find(c => c.id == venta.clientId);
      if (cliente) {
        nombreCliente = cliente.nombre;
        dniCliente = cliente.dni || dniCliente;
      }
    } else if (venta.clienteNombre) {
      nombreCliente = venta.clienteNombre;
    }
    document.getElementById('facturaCliente').textContent = nombreCliente;
    document.getElementById('facturaDniCliente').textContent = dniCliente || 'Sin DNI';
    document.getElementById('facturaVendedor').textContent = venta.vendedorNombre;

    const tbody = document.querySelector('#facturaItems tbody');
    tbody.innerHTML = '';
    
    venta.productos.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td style="text-align: left;">${p.cantidad}</td>
          <td style="text-align: left;">${p.nombre}</td>
          <td style="text-align: right;">S/${p.subtotal.toFixed(2)}</td>
        </tr>
      `;
    });

    const subtotalSinIgv = (venta.subtotal || venta.total) / 1.18;
    const igv = (venta.subtotal || venta.total) - subtotalSinIgv;

    document.getElementById('facturaSubtotalSinIgv').textContent = `S/${subtotalSinIgv.toFixed(2)}`;
    document.getElementById('facturaIgv').textContent = `S/${igv.toFixed(2)}`;
    document.getElementById('facturaSubtotal').textContent = `S/${(venta.subtotal || venta.total).toFixed(2)}`;
    document.getElementById('facturaDescuento').textContent = venta.descuentoAmt ? `-S/${venta.descuentoAmt.toFixed(2)} (${venta.descuentoPct}%)` : 'S/0.00';
    document.getElementById('facturaTotal').textContent = `S/${venta.total.toFixed(2)}`;
    document.getElementById('facturaMetodoPago').textContent = venta.metodoPago || 'Efectivo';
  }

  // Controles Modal Factura
  document.getElementById('closeComprobanteBtn').addEventListener('click', () => {
    modalComprobante.classList.remove('active');
  });
  
  document.getElementById('btnNuevaVenta').addEventListener('click', () => {
    modalComprobante.classList.remove('active');
    // Actualizar select de productos para reflejar nuevo stock
    location.reload(); 
  });

  document.getElementById('btnImprimir').addEventListener('click', () => {
    window.print();
  });
});
