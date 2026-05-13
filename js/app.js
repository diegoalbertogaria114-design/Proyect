// app.js - Lógica general para la Landing Page

document.addEventListener('DOMContentLoaded', () => {
  // --- Lógica del Boletín / Pop-up ---
  const boletinModal = document.getElementById('boletinModal');
  const boletinImg = document.getElementById('boletinImagen');
  const cerrarBtn = document.getElementById('cerrarBoletin');

  if (boletinModal && boletinImg) {
    const boletinData = localStorage.getItem('diwifa_boletin');
    if (boletinData) {
      const boletin = JSON.parse(boletinData);
      if (boletin.activo && boletin.imagen) {
        boletinImg.src = boletin.imagen;
        boletinModal.style.display = 'flex';
      }
    }

    if (cerrarBtn) {
      cerrarBtn.addEventListener('click', () => {
        boletinModal.style.display = 'none';
      });
    }
    // Cerrar al hacer clic fuera de la imagen
    boletinModal.addEventListener('click', (e) => {
      if (e.target === boletinModal) {
        boletinModal.style.display = 'none';
      }
    });
  }

  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button');
      const originalText = btn.innerHTML;
      
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
      btn.disabled = true;
      
      setTimeout(() => {
        // Guardar mensaje en localStorage
        const mensajes = JSON.parse(localStorage.getItem('diwifa_mensajes') || '[]');
        mensajes.push({
          id: mensajes.length > 0 ? Math.max(...mensajes.map(m => m.id)) + 1 : 1,
          nombre: document.getElementById('name').value,
          correo: document.getElementById('email').value,
          mensaje: document.getElementById('message').value,
          fecha: new Date().toISOString(),
          leido: false
        });
        localStorage.setItem('diwifa_mensajes', JSON.stringify(mensajes));

        btn.innerHTML = '<i class="fa-solid fa-check"></i> Mensaje Enviado';
        btn.style.background = 'var(--success-color)';
        btn.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
        
        contactForm.reset();
        
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
          btn.style.background = '';
          btn.style.boxShadow = '';
        }, 3000);
      }, 800);
    });
  }

  // --- Lógica del Catálogo de Productos ---
  const catalogoGrid = document.getElementById('productosGrid');
  const categoryFilters = document.getElementById('categoryFilters');

  if (catalogoGrid && categoryFilters) {
    // Obtener productos desde localStorage (asumiendo que db.js cargó primero)
    // El prefix es 'diwifa_' según db.js
    const dataStr = localStorage.getItem('diwifa_productos');
    const productos = dataStr ? JSON.parse(dataStr) : [];
    
    // Extraer categorías únicas
    const categorias = [...new Set(productos.map(p => p.categoria || 'Otros'))].filter(c => c.trim() !== '');
    
    // Renderizar botones de filtro
    categorias.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary filter-btn';
      // Por defecto no activo
      btn.classList.remove('active');
      btn.setAttribute('data-categoria', cat);
      btn.textContent = cat;
      categoryFilters.appendChild(btn);
    });

    // Función para renderizar tarjetas
    const LIMITE_INICIAL = 6;
    let mostrandoTodos = false;

    function renderCatalogo(categoriaSeleccionada = 'all') {
      catalogoGrid.innerHTML = '';
      
      const productosFiltrados = productos.filter(p => {
        const pCat = p.categoria || 'Otros';
        if (categoriaSeleccionada === 'all') return true;
        return pCat === categoriaSeleccionada;
      });

      if (productosFiltrados.length === 0) {
        catalogoGrid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;">No hay productos disponibles en esta categoría.</p>';
        const oldBtn = document.getElementById('btnVerMas');
        if (oldBtn) oldBtn.remove();
        return;
      }

      const productosAMostrar = mostrandoTodos ? productosFiltrados : productosFiltrados.slice(0, LIMITE_INICIAL);

      productosAMostrar.forEach(p => {
        let estadoBadge = '';
        if (p.stock > 0) {
          estadoBadge = '<span class="badge" style="background: var(--success-color); color: white;">Disponible</span>';
        } else {
          estadoBadge = '<span class="badge" style="background: var(--danger-color); color: white;">Agotado</span>';
        }

        const imgHtml = p.imagen 
          ? `<img src="${p.imagen}" alt="${p.nombre}" class="product-image">`
          : `<div class="product-image"><i class="fa-solid fa-image fa-3x"></i></div>`;

        const card = document.createElement('div');
        card.className = 'product-card glass-card';
        card.style.padding = '0';
        
        card.innerHTML = `
          ${imgHtml}
          <div class="product-details">
            <div class="product-category">${p.categoria || 'Otros'}</div>
            <div class="product-name">${p.nombre}</div>
            <div class="product-footer">
              <div class="product-price">S/${parseFloat(p.precio).toFixed(2)}</div>
              ${estadoBadge}
            </div>
          </div>
        `;
        catalogoGrid.appendChild(card);
      });

      // Botón Ver más / Ver menos
      let btnVerMas = document.getElementById('btnVerMas');
      if (btnVerMas) btnVerMas.remove();

      if (productosFiltrados.length > LIMITE_INICIAL) {
        btnVerMas = document.createElement('button');
        btnVerMas.id = 'btnVerMas';
        btnVerMas.className = 'btn btn-outline';
        btnVerMas.style.cssText = 'margin: 2rem auto 0; display: block; padding: 0.75rem 2.5rem; font-size: 1rem;';
        
        if (mostrandoTodos) {
          btnVerMas.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Ver menos';
        } else {
          btnVerMas.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Ver más (' + (productosFiltrados.length - LIMITE_INICIAL) + ' productos)';
        }

        btnVerMas.addEventListener('click', () => {
          mostrandoTodos = !mostrandoTodos;
          renderCatalogo(categoriaSeleccionada);
        });

        catalogoGrid.parentNode.insertBefore(btnVerMas, catalogoGrid.nextSibling);
      }
    }

    // Inicializar catálogo (solo primeros 6)
    renderCatalogo('all');

    // Lógica de filtrado al hacer clic
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Quitar 'active' a todos
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        // Poner 'active' al presionado
        const currentBtn = e.currentTarget;
        currentBtn.classList.add('active');
        
        const cat = currentBtn.getAttribute('data-categoria');
        renderCatalogo(cat);
      });
    });
  }

  // --- Lógica del Contador de Visitas ---
  const contadorEl = document.getElementById('contadorVisitas');
  if (contadorEl) {
    let visitas = localStorage.getItem('diwifa_visitas');
    if (!visitas) {
      visitas = 1500; // Un número base para que no empiece de 0
    } else {
      visitas = parseInt(visitas) + 1;
    }
    localStorage.setItem('diwifa_visitas', visitas);
    contadorEl.textContent = visitas.toLocaleString();
  }
});
