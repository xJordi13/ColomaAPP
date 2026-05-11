# Pepa - Validador de Esterilidad Térmica (Full-stack)

Stack completo con **Next.js 13** + **JavaScript/React** + **Tailwind CSS** + **Prisma** + **SQLite** + **NextAuth**

## 📋 Requisitos

- Node.js 16+ y npm
- Eso es todo (SQLite es local, sin dependencias externas)

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
cd pepa
npm install --legacy-peer-deps
```

### 2. Configurar Prisma y crear BD

```bash
npx prisma migrate dev --name init
npm run seed
```

Esto creará:
- Base de datos SQLite en `prisma/pepa.db` (archivo local)
- Usuario de prueba: **profesorColoma@gmail.com** / **12345**

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 🔐 Autenticación

- Usa **NextAuth.js** con proveedores Credentials
- El usuario `profesorColoma@gmail.com` / `12345` está preconfigurado
- Las sesiones se mantienen usando JWT
- Página protegida: `/dashboard` (requiere login)

## 📁 Estructura

```
pepa/
├── pages/
│   ├── index.tsx          # Login page
│   ├── dashboard.js       # Dashboard protegido (con calculadora)
│   ├── _app.js            # App wrapper con SessionProvider
│   ├── globals.css        # Estilos globales (Tailwind)
│   └── api/
│       └── auth/
│           └── [...nextauth].js  # Configuración NextAuth
├── prisma/
│   ├── schema.prisma      # Modelo de datos (SQLite)
│   ├── seed.js            # Script de seeding
│   └── pepa.db            # Base de datos SQLite (creada auto)
├── .env                   # Variables de entorno
├── tsconfig.json          # Config TypeScript
├── next.config.js         # Config Next.js
└── tailwind.config.js     # Config Tailwind

```

## 🛠️ Comandos útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build
npm start

# Prisma
npx prisma migrate dev --name [name]    # Nueva migración
npx prisma studio                       # GUI para explorar BD
npm run seed                            # Re-seed de datos
```

## 📊 Base de datos

- **Provider:** SQLite (archivo local)
- **Ubicación:** `prisma/pepa.db`
- **Ventajas:** Sin instalación, sin servidor externo, perfecto para desarrollo

Explora con:
```bash
npx prisma studio
```

## 🌍 Despliegue

### Vercel (Recomendado para Next.js)
```bash
npm install -g vercel
vercel
```

Luego configurar variables en Vercel dashboard:
- `DATABASE_URL` (si usas Postgres en producción)
- `NEXTAUTH_SECRET` (generar valor seguro)
- `NEXTAUTH_URL` (tu dominio en producción)

## 📝 Próximos pasos

- [ ] Agregar más usuarios en la UI admin
- [ ] Integrar base de datos de cálculos históricos
- [ ] Exportar reportes (PDF/Excel)
- [ ] Mejorar diseño con más componentes Tailwind
- [ ] Tests (Jest + React Testing Library)


