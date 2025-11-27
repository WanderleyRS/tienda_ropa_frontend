# Tienda Ropa MVP - Frontend

Frontend de Next.js para el sistema MVP de compra y venta de ropa de segunda mano.

## Características

- ✅ Autenticación JWT con FastAPI
- ✅ Dashboard de gestión de inventario
- ✅ Tabla de ítems con edición rápida (stock y precio)
- ✅ Formulario modal para crear nuevos ítems
- ✅ Filtros por estado (disponible/vendido)
- ✅ Protección de rutas basada en roles
- ✅ UI moderna con Shadcn UI y Tailwind CSS

## Tecnologías

- **Next.js 16** (App Router)
- **TypeScript**
- **Shadcn UI** (componentes)
- **Tailwind CSS** (estilos)
- **React Hook Form** (formularios)
- **Zod** (validación)
- **Axios** (cliente HTTP)
- **Sonner** (notificaciones)

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar la URL del backend (opcional):
Crea un archivo `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Por defecto, la aplicación usa `http://localhost:8000` si no se especifica.

3. Ejecutar en desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
tienda_ropa_mvp-frontend/
├── app/
│   ├── dashboard/        # Página del dashboard
│   ├── login/            # Página de login
│   ├── layout.tsx        # Layout principal con AuthProvider
│   └── page.tsx          # Página principal (redirige)
├── components/
│   ├── ui/               # Componentes de Shadcn UI
│   ├── CreateItemDialog.tsx
│   ├── ItemsTable.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx   # Contexto de autenticación
└── lib/
    ├── api.ts            # Cliente HTTP y funciones de API
    └── utils.ts
```

## Uso

### Autenticación

1. Accede a `/login`
2. Ingresa tus credenciales (deben estar registradas en el backend)
3. El token JWT se guarda automáticamente en localStorage
4. Todas las peticiones incluyen el token en el header `Authorization`

### Dashboard

- **Ver inventario**: La tabla muestra todos los ítems
- **Filtrar**: Usa los botones "Todos", "Disponibles", "Vendidos"
- **Crear ítem**: Click en "Nuevo Ítem" (requiere rol admin o vendedor)
- **Editar stock/precio**: Click en el ícono de editar junto al valor
- **Cambiar estado**: Click en "Marcar Disponible/Vendido" (requiere rol admin o vendedor)

## Roles

- **admin**: Acceso completo (crear, editar, eliminar)
- **vendedor**: Puede crear y editar ítems, pero no eliminar

## Endpoints Consumidos

- `POST /auth/token` - Login
- `GET /auth/me` - Obtener usuario actual
- `GET /items/` - Listar ítems
- `POST /items/` - Crear ítem
- `PATCH /items/{id}/stock` - Actualizar stock
- `PATCH /items/{id}/price` - Actualizar precio
- `PUT /items/{id}` - Actualizar ítem completo

## Notas
// test

- El backend debe estar corriendo en `http://localhost:8000`
- Las imágenes se muestran desde la URL proporcionada o desde el servidor backend
- El token JWT expira después de 30 minutos (configurable en el backend)
