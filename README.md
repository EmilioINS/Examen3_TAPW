# SII Celaya — Portal Estudiantil

Aplicación web para consultar información académica de estudiantes del **Tecnológico Nacional de México Campus Celaya**, consumiendo la API del Sistema de Información Institucional (SII).

---

## Tabla de contenidos

- [Tecnología](#tecnología)
- [Requisitos del entorno](#requisitos-del-entorno)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [API — endpoints consumidos](#api--endpoints-consumidos)
- [Autenticación y sesión](#autenticación-y-sesión)
- [Capturas de pantalla](#capturas-de-pantalla)

---

## Tecnología

| Tecnología | Versión | Rol |
|---|---|---|
| **React 19** | `^19.2.5` | UI library — componentes, estado, contexto |
| **TypeScript** | `~6.0.2` | Tipado estático sobre JavaScript |
| **Vite 8** | `^8.0.10` | Build tool y servidor de desarrollo |
| **React Router v7** | `^7.14.2` | Enrutamiento SPA del lado del cliente |
| **Recharts** | `^3.8.1` | Gráficas de datos académicos |
| **Font Awesome 7** | `^7.2.0` | Iconografía (paquetes solid y regular) |

### Por qué React + Vite

React permite construir interfaces reactivas a partir de componentes reutilizables. Vite ofrece un servidor de desarrollo con HMR (Hot Module Replacement) instantáneo y builds de producción optimizados con Rolldown. La combinación con TypeScript garantiza tipado end-to-end desde los contratos de la API hasta la capa de presentación.

---

## Requisitos del entorno

| Herramienta | Versión recomendada |
|---|---|
| Node.js | `v24.x` (LTS) |
| npm | `11.x` |

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/EmilioINS/Examen3_TAPW.git
cd Examen3_TAPW
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto (o verifica que ya exista):

```env
VITE_API_URL=/api
VITE_REVIEWS_API_URL=https://tu-backend-resenas.onrender.com/api/v1
```

> `VITE_API_URL=/api` activa el proxy de Vite en desarrollo. En producción, Vercel usa el rewrite definido en `vercel.json` para resolver la misma ruta.

### 4. Servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 5. Build de producción

```bash
npm run build      # compila TypeScript y genera dist/
npm run preview    # sirve el build localmente para verificar
```

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | Ruta base de la API del SII | `/api` |
| `VITE_REVIEWS_API_URL` | URL del microservicio de reseñas | — |

En **Vercel**, asegúrate de que `VITE_API_URL` esté definida como `/api` (o no definida, ya que el fallback en `api.ts` lo establece). Si se define como la URL completa del SII, el rewrite de Vercel no se activará y ocurrirán errores de CORS.

---

## Despliegue en Vercel

El archivo `vercel.json` en la raíz configura dos comportamientos clave:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://sii.celaya.tecnm.mx/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

| Rewrite | Propósito |
|---|---|
| `/api/:path*` | Proxy server-side hacia el SII — elimina el error CORS porque la petición sale de los servidores de Vercel, no del browser |
| `/(.*) → /index.html` | SPA fallback — evita 404 al navegar directamente a rutas como `/dashboard` o `/login` |

El despliegue es automático: cualquier push a `main` dispara un nuevo build en Vercel.

URL de producción: **https://examen3-tapw.vercel.app**

---

## API — endpoints consumidos

**Base URL (producción):** `https://sii.celaya.tecnm.mx/api`  
**Base URL (desarrollo local):** `/api` → proxy Vite → `https://sii.celaya.tecnm.mx/api`

### Autenticación

| Método | Endpoint | Autenticación | Descripción |
|---|---|---|---|
| `POST` | `/login` | `email` + `password` en JSON body | Devuelve JWT. El token se extrae de `response.message.login.token` |

**Body de la petición:**
```json
{
  "email": "l21030679@celaya.tecnm.mx",
  "password": "password"
}
```

**Respuesta exitosa:**
```json
{
  "responseCodeTxt": "200 OK",
  "message": { "login": { "token": "eyJ..." } },
  "status": 200,
  "flag": "success",
  "type": "estudiante"
}
```

### Endpoints protegidos (requieren `Authorization: Bearer <token>`)

| Método | Endpoint | Página | Descripción |
|---|---|---|---|
| `GET` | `/movil/estudiante` | Dashboard | Perfil completo del estudiante (nombre, matrícula, promedios, créditos, foto en base64) |
| `GET` | `/movil/estudiante/calificaciones` | Calificaciones | Calificaciones del periodo actual agrupadas por materia y parcial |
| `GET` | `/movil/estudiante/kardex` | Kardex | Historial académico completo agrupado por semestre |
| `GET` | `/movil/estudiante/horarios` | Horario | Horario del semestre actual con aulas por día |

---

## Autenticación y sesión

### Inicio de sesión

1. El usuario ingresa su correo institucional y contraseña en `/login`.
2. La app llama a `POST /api/login`.
3. En caso de éxito, el token JWT se almacena en **`sessionStorage`** bajo la clave `sii_token`.
4. La app redirige automáticamente a `/dashboard`.

> **sessionStorage** fue elegido sobre localStorage porque se limpia al cerrar la pestaña, reduciendo el riesgo de sesiones huérfanas.

### Credenciales

```
Correo:     lXXXXXXXX@celaya.tecnm.mx
Contraseña: password
```

### Protección de rutas

`ProtectedRoute` verifica la existencia del token antes de renderizar cualquier página autenticada. Si no hay token, redirige a `/login`. La verificación combina dos capas:

| Capa | Mecanismo | Cuándo actúa |
|---|---|---|
| **Local (JWT decode)** | Decodifica el campo `exp` del payload sin verificar firma | Al cargar la app — evita usar tokens visiblemente expirados |
| **Global 401 interceptor** | Intercepta cualquier respuesta 401/403 de la API | En tiempo de ejecución — captura tokens revocados o expirados en servidor |

### Cierre de sesión

- El botón **"Cerrar sesión"** (disponible en el dropdown de perfil del navbar y en el menú móvil) llama a `logout()`.
- `logout()` elimina `sii_token` de `sessionStorage` y redirige a `/login`.
- Si el token expira mientras la app está abierta, el interceptor global elimina la sesión y redirige a `/login?expired=1`, mostrando un aviso en el formulario.

---

## Capturas de pantalla

### Login
![Login](src/assets/screenshots/scr_1.png)
> Pantalla de inicio de sesión con fondo de constelaciones animado, slideshow de imágenes del campus y formulario con el lince mascota.

### Dashboard
![Dashboard](src/assets/screenshots/scr_2.png)
> Panel principal con información del estudiante, tarjetas de estadísticas, gráficas (distribución de materias, comparativa de promedios, avance de carrera) y accesos rápidos.

### Calificaciones
![Calificaciones](src/assets/screenshots/scr_3.png)
> Tabla con las calificaciones del periodo actual. Cada parcial muestra un badge de color según el rendimiento (verde ≥80, lima ≥70, ámbar ≥60, rojo <60).

### Kardex
![Kardex](src/assets/screenshots/scr_4.png)
> Historial académico completo agrupado por semestre. Muestra resumen de créditos y promedio por semestre.

### Horario
![Horario](src/assets/screenshots/scr_5.png)
> Horario semanal del semestre actual. Cada día muestra el rango de horas y el aula asignada.

### Reseñas
![Resenas](src/assets/screenshots/scr_6.png)
> Usando el backend propio como microservicio presenta informacion de reseñas a profesores, teniendo opcion de presentar una reseña (se debe tener autorización para hacerla pública).


---

## Estructura del proyecto

```
src/
├── assets/
│   ├── bg/              # Imágenes de fondo (slideshow login)
│   └── screenshots/     # Capturas de pantalla del README
├── components/
│   ├── ConstellationCanvas.tsx   # Animación de constelaciones (canvas)
│   ├── Navbar.tsx / .css         # Barra de navegación (responsive)
│   └── ProtectedRoute.tsx        # Guard de rutas autenticadas
├── contexts/
│   ├── AuthContext.tsx     # Token JWT — login, logout, interceptor
│   └── StudentContext.tsx  # Datos del estudiante (caché compartido)
├── pages/
│   ├── Login.tsx / .css
│   ├── Dashboard.tsx / .css
│   ├── Calificaciones.tsx / .css
│   ├── Kardex.tsx / .css
│   └── Horario.tsx / .css
├── services/
│   └── api.ts             # Wrappers tipados para todos los endpoints del SII
├── styles/
│   └── page.css           # Estilos compartidos entre páginas autenticadas
└── utils/
    └── jwt.ts             # Decode local del campo exp del JWT
vercel.json                # Rewrites: proxy API + SPA fallback
```
