# Inventario de Carcasas para iPhone

Sistema profesional de gestión de inventario para carcasas de iPhone desarrollado con React, Vite, Supabase, Bootstrap y Vercel.

## Características

- 📊 Dashboard con estadísticas y métricas clave
- 📦 Gestión de inventario (CRUD de carcasas)
- ➕ Entradas de stock
- 💰 Ventas con control de stock
- 📋 Historial de movimientos
- 📄 Reportes con exportación a PDF y Excel
- 🔐 Autenticación con roles (Administrador y Vendedor)
- 📱 Diseño responsive

## Tecnologías

- **Frontend**: React 19, Vite, Bootstrap 5, React Bootstrap, React Router
- **Backend**: Supabase (PostgreSQL)
- **Exportaciones**: jsPDF, ExcelJS
- **Despliegue**: Vercel

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:

```bash
npm install
```

3. Copiar `.env.example` a `.env` y configurar las variables de entorno:

```env
VITE_SUPABASE_URL=tu-url-supabase
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-supabase
```

## Configuración de Supabase

1. Crear un proyecto en Supabase
2. Ejecutar el SQL del archivo `supabase.sql` en el SQL Editor de Supabase
3. Crear usuarios desde el panel de Auth de Supabase
4. Asignar rol de Administrador a un usuario actualizando la tabla `profiles` en la base de datos:

```sql
UPDATE public.profiles
SET role = 'administrador'
WHERE email = 'tu-email@ejemplo.com';
```

## Ejecutar el proyecto

```bash
npm run dev
```

## Construir para producción

```bash
npm run build
```

## Despliegue en Vercel

1. Conectar el repositorio a Vercel
2. Configurar las variables de entorno en Vercel
3. Desplegar

## Estructura del proyecto

```
src/
├── components/
│   └── Layout.jsx
├── hooks/
│   └── useAuth.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Inventario.jsx
│   ├── Entradas.jsx
│   ├── Ventas.jsx
│   ├── Movimientos.jsx
│   └── Reportes.jsx
├── services/
│   └── supabase.js
├── App.jsx
├── main.jsx
└── index.css
```

## Funcionamiento del sistema

### Roles

- **Administrador**: Puede gestionar todo el sistema (crear, editar, desactivar carcasas)
- **Vendedor**: Puede ver inventario, registrar ventas y ver reportes

### Módulos

1. **Dashboard: Muestra estadísticas, stock bajo, sin stock y últimas ventas
2. Inventario: Gestionar carcasas con filtros y búsqueda
3. Entradas: Registrar nuevas entradas de stock
4. Ventas: Registrar ventas con control de stock
5. Movimientos: Historial completo de todas las transacciones
6. Reportes: Generar reportes en PDF y Excel
