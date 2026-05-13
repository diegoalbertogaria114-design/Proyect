// db.js - Gestor de LocalStorage para diwifa

const DB_PREFIX = 'diwifa_';

const db = {
  // Inicializa la base de datos con valores por defecto si está vacía
  init: function () {
    if (!localStorage.getItem(`${DB_PREFIX}usuarios`)) {
      // Crear usuario admin por defecto
      const usuarios = [{
        id: 1,
        username: 'admin',
        password: '123', // En un sistema real esto iría encriptado
        nombre: 'Administrador Principal',
        rol: 'ADMIN'
      }];
      this.set('usuarios', usuarios);
    }

    if (!localStorage.getItem(`${DB_PREFIX}empresa_info`)) {
      this.set('empresa_info', {
        nombre: 'diwifa',
        direccion: 'Av. Principal 123, Ciudad',
        telefono: '+1 234 567 8900'
      });
    }

    const productosExistentes = localStorage.getItem(`${DB_PREFIX}productos`);
    if (!productosExistentes || JSON.parse(productosExistentes).length === 0) {
      this.set('productos', [
        { id: 1, nombre: 'Martillo de Uña 16oz', categoria: 'Herramientas Manuales', precio: 25.90, stock: 30, imagen: 'assets/productos/herramientas_manuales.png' },
        { id: 2, nombre: 'Destornillador Estrella Phillips', categoria: 'Herramientas Manuales', precio: 8.50, stock: 50, imagen: 'assets/productos/herramientas_manuales.png' },
        { id: 3, nombre: 'Alicate Universal 8"', categoria: 'Herramientas Manuales', precio: 18.90, stock: 25, imagen: 'assets/productos/herramientas_manuales.png' },
        { id: 4, nombre: 'Llave Inglesa Ajustable 10"', categoria: 'Herramientas Manuales', precio: 32.00, stock: 15, imagen: 'assets/productos/herramientas_manuales.png' },
        { id: 5, nombre: 'Cinta Métrica 5m', categoria: 'Herramientas Manuales', precio: 12.50, stock: 40, imagen: 'assets/productos/herramientas_manuales.png' },
        { id: 6, nombre: 'Taladro Percutor 750W', categoria: 'Herramientas Eléctricas', precio: 189.90, stock: 10, imagen: 'assets/productos/herramientas_electricas.png' },
        { id: 7, nombre: 'Amoladora Angular 4 1/2"', categoria: 'Herramientas Eléctricas', precio: 145.00, stock: 8, imagen: 'assets/productos/herramientas_electricas.png' },
        { id: 8, nombre: 'Sierra Caladora 650W', categoria: 'Herramientas Eléctricas', precio: 165.00, stock: 6, imagen: 'assets/productos/herramientas_electricas.png' },
        { id: 9, nombre: 'Cemento Portland 42.5kg', categoria: 'Materiales de Construcción', precio: 28.50, stock: 100, imagen: 'assets/productos/materiales_construccion.png' },
        { id: 10, nombre: 'Arena Fina x m³', categoria: 'Materiales de Construcción', precio: 45.00, stock: 50, imagen: 'assets/productos/materiales_construccion.png' },
        { id: 11, nombre: 'Fierro Corrugado 1/2" x 9m', categoria: 'Materiales de Construcción', precio: 32.00, stock: 80, imagen: 'assets/productos/materiales_construccion.png' },
        { id: 12, nombre: 'Tubería PVC 2" x 3m', categoria: 'Gasfitería', precio: 15.90, stock: 35, imagen: 'assets/productos/gasfiteria.png' },
        { id: 13, nombre: 'Codo PVC 1/2" x 90°', categoria: 'Gasfitería', precio: 1.50, stock: 100, imagen: 'assets/productos/gasfiteria.png' },
        { id: 14, nombre: 'Llave de Paso 1/2"', categoria: 'Gasfitería', precio: 12.00, stock: 20, imagen: 'assets/productos/gasfiteria.png' },
        { id: 15, nombre: 'Cable THW 14 AWG x 100m', categoria: 'Electricidad', precio: 89.90, stock: 15, imagen: 'assets/productos/electricidad.png' },
        { id: 16, nombre: 'Interruptor Simple', categoria: 'Electricidad', precio: 5.90, stock: 60, imagen: 'assets/productos/electricidad.png' },
        { id: 17, nombre: 'Tomacorriente Doble', categoria: 'Electricidad', precio: 7.50, stock: 55, imagen: 'assets/productos/electricidad.png' },
        { id: 18, nombre: 'Pintura Látex Blanca 4L', categoria: 'Pintura', precio: 48.00, stock: 20, imagen: 'assets/productos/pintura.png' },
        { id: 19, nombre: 'Rodillo para Pintar 9"', categoria: 'Pintura', precio: 14.90, stock: 25, imagen: 'assets/productos/pintura.png' },
        { id: 20, nombre: 'Thinner Acrílico 1L', categoria: 'Pintura', precio: 12.50, stock: 30, imagen: 'assets/productos/pintura.png' },
        { id: 21, nombre: 'Cerradura de Perilla', categoria: 'Cerrajería', precio: 35.00, stock: 18, imagen: 'assets/productos/cerrajeria.png' },
        { id: 22, nombre: 'Candado de Bronce 40mm', categoria: 'Cerrajería', precio: 22.00, stock: 25, imagen: 'assets/productos/cerrajeria.png' },
        { id: 23, nombre: 'Bisagra Capuchina 3"', categoria: 'Cerrajería', precio: 4.50, stock: 70, imagen: 'assets/productos/cerrajeria.png' },
        { id: 24, nombre: 'Disco de Corte 4 1/2"', categoria: 'Abrasivos', precio: 4.90, stock: 80, imagen: 'assets/productos/abrasivos.png' },
        { id: 25, nombre: 'Lija al Agua #120', categoria: 'Abrasivos', precio: 1.80, stock: 100, imagen: 'assets/productos/abrasivos.png' }
      ]);
    }

    if (!localStorage.getItem(`${DB_PREFIX}clientes`)) {
      this.set('clientes', []);
    }

    if (!localStorage.getItem(`${DB_PREFIX}empleados`)) {
      this.set('empleados', []);
    }

    if (!localStorage.getItem(`${DB_PREFIX}ventas`)) {
      this.set('ventas', []);
    }
  },

  // Obtener un item del localStorage
  get: function (key) {
    const data = localStorage.getItem(`${DB_PREFIX}${key}`);
    return data ? JSON.parse(data) : null;
  },

  // Guardar un item en el localStorage
  set: function (key, value) {
    localStorage.setItem(`${DB_PREFIX}${key}`, JSON.stringify(value));
  },

  // Añadir a un array
  add: function (key, item) {
    const list = this.get(key) || [];
    // Generar ID
    item.id = list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1;
    list.push(item);
    this.set(key, list);
    return item;
  },

  // Actualizar en un array
  update: function (key, id, updatedData) {
    const list = this.get(key) || [];
    const index = list.findIndex(item => item.id == id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedData };
      this.set(key, list);
      return list[index];
    }
    return null;
  },

  // Eliminar de un array
  remove: function (key, id) {
    const list = this.get(key) || [];
    const filtered = list.filter(item => item.id != id);
    this.set(key, filtered);
  }
};

// Inicializar al cargar el script
db.init();
