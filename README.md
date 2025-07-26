# 🛍️ Tienda Online - Sistema de E-commerce Completo

Una aplicación de e-commerce moderna desarrollada con React, Firebase y Vite. Sistema completo con gestión de usuarios, productos, pedidos y panel de administración.

## 🚀 Características Principales

- ✅ **Sistema de Autenticación** - Registro y login con Firebase Auth
- ✅ **Gestión de Productos** - Catálogo completo con categorías
- ✅ **Carrito de Compras** - Persistente con Firebase Firestore
- ✅ **Sistema de Pedidos** - Flujo completo de compra
- ✅ **Panel de Administración** - Gestión completa para administradores
- ✅ **Perfiles de Usuario** - Información personal y historial
- ✅ **Sistema de Favoritos** - Productos marcados como favoritos
- ✅ **Responsive Design** - Funciona en móviles, tablets y desktop

## 👑 Usuario Administrador

### **Credenciales de Acceso:**
```
📧 Email: admin@tienda.com
🔑 Contraseña: AdminTienda123@
👤 Rol: Administrador
```

### **Información del Administrador:**
- **Nombre:** Administrador Principal
- **Teléfono:** +1-555-ADMIN
- **Dirección:** Oficina Principal, Calle Administración 123
- **Creación:** Automática al cargar la aplicación

## 🎯 Funcionalidades por Tipo de Usuario

### 👤 **Usuarios Clientes**

#### **Registro y Autenticación:**
- Registro con validación de contraseñas seguras
- Login con email y contraseña
- Selección de rol durante el registro (Cliente/Administrador)
- Perfil de usuario editable

#### **Navegación y Compras:**
- Catálogo de productos con filtros por categoría
- Vista detallada de productos con galería de imágenes
- Carrito de compras persistente
- Sistema de favoritos
- Proceso de checkout completo

#### **Gestión Personal:**
- Perfil de usuario con información personal
- Historial de pedidos propios
- Lista de productos favoritos
- Edición de información personal (nombre, teléfono, dirección)

### 👑 **Usuarios Administradores**

#### **Panel de Administración Completo:**

##### **📦 Gestión de Pedidos Recibidos:**
- **Vista principal** con todos los pedidos de clientes
- **Información detallada** de cada pedido:
  - ID único del pedido
  - Datos completos del cliente (nombre, email, teléfono, dirección)
  - Lista de productos con imágenes y cantidades
  - Total del pedido
  - Fecha y hora de creación
- **Gestión de estados:**
  - 🟡 Pendiente - Pedido recién recibido
  - 🔵 Procesando - En preparación
  - 🟣 Enviado - Despachado al cliente
  - 🟢 Entregado - Recibido por el cliente
  - 🔴 Cancelado - Pedido cancelado
- **Herramientas avanzadas:**
  - Búsqueda por cliente, email o producto
  - Filtros por estado y fecha
  - Exportación de reportes en CSV
  - Actualización en tiempo real

##### **🛍️ Gestión de Productos:**
- **Subir nuevos productos** con formulario completo:
  - Nombre del producto
  - Descripción detallada
  - Precio
  - Categoría (Premium, Especial, Exclusivo, Básico)
  - Imagen principal
  - Imagen hover (efecto al pasar el mouse)
  - Galería de imágenes (hasta 4 imágenes adicionales)
- **Editar productos existentes**
- **Eliminar productos** del catálogo
- **Estadísticas por categoría:**
  - Contador total de productos
  - Productos por categoría (Premium, Especial, Exclusivo)
- **Vista de lista** con imágenes y acciones rápidas

##### **👥 Gestión de Usuarios:**
- **Lista completa** de usuarios registrados
- **Información de cada usuario:**
  - Nombre completo
  - Email de contacto
  - Rol asignado (Cliente/Administrador)
  - Fecha de registro
  - Último acceso al sistema

##### **📊 Resumen Rápido:**
- Vista condensada de pedidos
- Cambio rápido de estados
- Métricas importantes del negocio

#### **Acceso Especial en Perfil:**
- **Sección exclusiva** "Pedidos de Usuarios"
- **Vista completa** de todos los pedidos de todos los clientes
- **Información detallada** con datos del cliente y productos

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18 + Vite
- **Base de Datos:** Firebase Firestore
- **Autenticación:** Firebase Auth
- **Estilos:** CSS3 con variables personalizadas
- **Animaciones:** Framer Motion
- **Iconos:** Lucide React
- **Validaciones:** Validación personalizada de formularios

## 📱 Diseño Responsive

### **Desktop (1200px+):**
- Layout completo con sidebar
- Grids de productos en múltiples columnas
- Panel de administración con tabs horizontales

### **Tablet (768px - 1199px):**
- Layout adaptado a pantalla media
- Grids de productos en 2-3 columnas
- Navegación optimizada

### **Mobile (< 768px):**
- Layout de una columna
- Navegación tipo hamburger
- Formularios optimizados para touch
- Botones y elementos táctiles más grandes

## 🔐 Sistema de Seguridad

### **Validación de Contraseñas:**
- Mínimo 8 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un símbolo (@$!%*?&)

### **Protección de Rutas:**
- Panel de administración solo para usuarios con rol 'admin'
- Funciones de gestión protegidas por autenticación
- Validación de permisos en tiempo real

### **Seguridad de Datos:**
- Todas las operaciones validadas en Firebase
- Reglas de seguridad en Firestore
- Sanitización de inputs de usuario

## 🎨 Características de Diseño

### **Tema Visual:**
- **Colores principales:** Naranja (#ff6b35) y Negro (#1a1a1a)
- **Tipografía:** Fuentes modernas y legibles
- **Gradientes:** Efectos visuales atractivos
- **Sombras:** Profundidad y dimensión

### **Experiencia de Usuario:**
- **Animaciones suaves** con Framer Motion
- **Feedback visual** en todas las acciones
- **Estados de carga** informativos
- **Mensajes de error** claros y útiles
- **Confirmaciones** para acciones importantes

### **Componentes Interactivos:**
- **Modales** para formularios y detalles
- **Tooltips** informativos
- **Botones** con efectos hover
- **Cards** con animaciones de entrada
- **Formularios** con validación en tiempo real

## 📊 Flujo de Pedidos

### **1. Cliente Realiza Pedido:**
- Selecciona productos y los agrega al carrito
- Procede al checkout
- Confirma la compra
- **Estado inicial:** Pendiente

### **2. Administrador Recibe Pedido:**
- Ve el pedido en "Pedidos Recibidos"
- Revisa información del cliente y productos
- **Cambia estado a:** Procesando

### **3. Preparación y Envío:**
- Administrador prepara los productos
- **Cambia estado a:** Enviado
- Cliente puede ver el estado actualizado

### **4. Entrega:**
- Cliente recibe los productos
- **Administrador marca como:** Entregado
- Proceso completado

## 🚀 Instalación y Configuración

### **Prerrequisitos:**
- Node.js 16+ instalado
- Cuenta de Firebase configurada
- Variables de entorno configuradas

### **Pasos de Instalación:**

1. **Clonar el repositorio:**
```bash
git clone [url-del-repositorio]
cd tienda-online
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar Firebase:**
- Crear proyecto en Firebase Console
- Habilitar Authentication y Firestore
- Copiar configuración a `.env`

4. **Variables de entorno (.env):**
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

5. **Ejecutar en desarrollo:**
```bash
npm run dev
```

6. **Construir para producción:**
```bash
npm run build
```

## 📈 Métricas y Estadísticas

### **Panel de Administración incluye:**
- **Total de pedidos** recibidos
- **Valor total** de ventas
- **Pedidos pendientes** de procesar
- **Pedidos entregados** exitosamente
- **Productos por categoría**
- **Usuarios registrados**

## 🔄 Actualizaciones Automáticas

- **Usuario administrador** se crea automáticamente al cargar la aplicación
- **Datos en tiempo real** con Firebase
- **Estados sincronizados** entre cliente y administrador
- **Notificaciones visuales** de cambios de estado

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre el sistema:

- **Email del Administrador:** admin@tienda.com
- **Teléfono:** +1-555-ADMIN
- **Dirección:** Oficina Principal, Calle Administración 123

## 📝 Notas Importantes

- El usuario administrador se crea automáticamente al cargar la aplicación
- Todas las contraseñas deben cumplir con los requisitos de seguridad
- Los datos se almacenan en Firebase Firestore en tiempo real
- El sistema es completamente responsive y funciona en todos los dispositivos
- Las imágenes de productos deben ser URLs válidas y accesibles

## 🎯 Guía de Uso Rápido

### **Para Administradores:**

1. **Acceder al sistema:**
   - Abrir la aplicación
   - Hacer login con: `admin@tienda.com` / `AdminTienda123@`

2. **Gestionar pedidos:**
   - Ir al Panel de Administración
   - Pestaña "Pedidos Recibidos"
   - Cambiar estados según el progreso

3. **Subir productos:**
   - Pestaña "Gestión de Productos"
   - Clic en "Subir Nuevo Producto"
   - Llenar formulario completo

### **Para Clientes:**

1. **Registrarse:**
   - Clic en "Regístrate"
   - Seleccionar rol "Cliente"
   - Completar información

2. **Comprar:**
   - Navegar catálogo
   - Agregar al carrito
   - Proceder al checkout

3. **Seguimiento:**
   - Ver perfil personal
   - Pestaña "Pedidos"
   - Revisar estados

---

**🎉 ¡Sistema completo y listo para usar! El usuario administrador está disponible inmediatamente al cargar la aplicación.**#   0 - t i e n d a - 2 0 2 5 - r e a c t  
 