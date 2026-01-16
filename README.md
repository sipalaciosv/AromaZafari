# DupeZOFRI API

API Backend para DupeZOFRI - Catálogo de perfumes y dupes.

## Requisitos

- Node.js 18+
- MySQL/MariaDB 8+

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales de base de datos

# Ejecutar script de base de datos
mysql -u root -p < database_schema.sql

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | 3000 |
| `NODE_ENV` | Entorno (development/production) | development |
| `DB_HOST` | Host de la base de datos | localhost |
| `DB_PORT` | Puerto de la base de datos | 3306 |
| `DB_USER` | Usuario de la base de datos | root |
| `DB_PASSWORD` | Contraseña de la base de datos | - |
| `DB_NAME` | Nombre de la base de datos | dupezofri |
| `JWT_SECRET` | Secreto para firmar tokens JWT | - |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | 7d |
| `CORS_ORIGIN` | Origen permitido para CORS | * |

## Endpoints de la API

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/google` | Login con Google OAuth | No |
| POST | `/logout` | Cerrar sesión | Sí |
| GET | `/me` | Obtener usuario actual | Sí |

### Usuarios (`/api/users`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/:id` | Obtener perfil de usuario | Sí |
| PUT | `/:id` | Actualizar perfil (solo propio) | Sí |

### Perfumes (`/api/perfumes`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Listar catálogo (aprobados) | Opcional |
| GET | `/search?q=` | Buscar perfumes | Opcional |
| GET | `/tags/popular` | Tags más usados | No |
| POST | `/propose` | Proponer nuevo perfume | Sí |
| GET | `/:id` | Detalle de perfume | Opcional |
| GET | `/:id/dupes` | Listar dupes de un original | No |
| GET | `/:id/votes` | Votos globales del perfume | No |
| PUT | `/:id` | Actualizar perfume | Moderador |
| DELETE | `/:id` | Eliminar perfume | Moderador |

### Moderación (`/api/admin`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/proposals` | Lista de propuestas pendientes | Moderador |
| POST | `/proposals/:id/approve` | Aprobar propuesta | Moderador |
| POST | `/proposals/:id/reject` | Rechazar propuesta | Moderador |

### Grupos (`/api/groups`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Mis grupos | Sí |
| POST | `/` | Crear grupo | Sí |
| GET | `/public/:slug` | Vista pública | No |
| POST | `/join/:code` | Unirse con código | Sí |
| GET | `/:id` | Detalle grupo | Miembro |
| PUT | `/:id` | Editar grupo | Owner/Editor |
| DELETE | `/:id` | Eliminar grupo | Owner |

#### Miembros del Grupo

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/:id/members` | Listar miembros | Miembro |
| POST | `/:id/members` | Añadir miembro | Owner/Editor |
| PUT | `/:id/members/:userId` | Cambiar rol | Owner |
| DELETE | `/:id/members/:userId` | Expulsar | Owner/Editor |

#### Tiendas del Grupo

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/:id/stores` | Listar tiendas | Miembro |
| POST | `/:id/stores` | Crear tienda | Owner/Editor |
| PUT | `/:id/stores/:storeId` | Editar tienda | Owner/Editor |
| DELETE | `/:id/stores/:storeId` | Eliminar tienda | Owner/Editor |

#### Precios del Grupo

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/:id/prices` | Precios actuales | Miembro |
| POST | `/:id/prices` | Agregar/actualizar precio | Miembro |
| GET | `/:id/perfumes/:perfumeId/prices` | Precios de un perfume | Miembro |
| GET | `/:id/perfumes/:perfumeId/price-history` | Historial de precios | Miembro |

#### Votos del Grupo

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/:id/votes` | Votos del grupo | Miembro |
| GET | `/:id/perfumes/:perfumeId/votes` | Votos de perfume en grupo | Miembro |

### Votos (`/api/votes`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/global` | Voto global | Sí |
| POST | `/group/:groupId` | Voto de grupo | Miembro |
| GET | `/mine` | Mis votos | Sí |
| PUT | `/:id` | Editar voto | Sí |
| DELETE | `/:id` | Eliminar voto | Sí |

### Expediciones (`/api/expeditions`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/` | Crear expedición | Sí |
| GET | `/` | Mis expediciones | Sí |
| GET | `/groups/:groupId` | Expediciones del grupo | Miembro |
| GET | `/:id` | Obtener expedición | Miembro |
| PUT | `/:id` | Actualizar | Owner/Editor |
| DELETE | `/:id` | Eliminar | Owner |
| GET | `/:id/members` | Listar miembros | Miembro |
| POST | `/:id/members` | Añadir miembro | Owner/Editor |
| DELETE | `/:id/members/:userId` | Eliminar miembro | Owner |
| GET | `/:id/items` | Listar items | Miembro |
| POST | `/:id/items` | Añadir item | Owner/Editor |
| PUT | `/:id/items/:itemId/status` | Cambiar estado | Owner/Editor |
| DELETE | `/:id/items/:itemId` | Eliminar item | Owner/Editor |
| GET | `/:id/items/:itemId/notes` | Notas del item | Miembro |
| POST | `/:id/items/:itemId/notes` | Añadir nota | Miembro |
| DELETE | `/:id/items/:itemId/notes/:noteId` | Eliminar nota | Owner/Editor |

## Estructura del Proyecto

```
src/
├── config/
│   ├── database.js    # Conexión a MySQL
│   └── jwt.js         # Configuración JWT
├── controllers/       # Lógica de negocio
│   ├── auth.controller.js
│   ├── expedition.controller.js
│   ├── group.controller.js
│   ├── perfume.controller.js
│   ├── price.controller.js
│   ├── proposal.controller.js
│   ├── store.controller.js
│   ├── user.controller.js
│   └── vote.controller.js
├── middlewares/
│   ├── auth.js        # Autenticación JWT
│   ├── errorHandler.js
│   └── membership.js  # Permisos de grupo/expedición
├── models/            # Acceso a datos
│   ├── Expedition.js
│   ├── Group.js
│   ├── index.js
│   ├── Perfume.js
│   ├── Price.js
│   ├── Proposal.js
│   ├── Store.js
│   ├── User.js
│   └── Vote.js
├── routes/            # Definición de rutas
│   ├── auth.routes.js
│   ├── expedition.routes.js
│   ├── group.routes.js
│   ├── perfume.routes.js
│   ├── price.routes.js
│   ├── proposal.routes.js
│   ├── store.routes.js
│   ├── user.routes.js
│   └── vote.routes.js
├── app.js             # Configuración Express
└── index.js           # Entry point
```

## Autenticación

La API usa JWT (JSON Web Tokens). Incluye el token en el header:

```
Authorization: Bearer <token>
```

## Licencia

ISC
