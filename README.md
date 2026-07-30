# TermoSim

Aplicación didáctica para diseñar y evaluar tratamientos térmicos mediante
reducciones decimales, valores D/z, letalidad y F acumulado.

## Flujo

1. **Diseño del tratamiento térmico:** define N₀, Nf, T, Tref, diferencia del
   punto frío, Dref y z.
2. **Evaluación del tratamiento térmico:** registra mediciones de tiempo y
   temperatura. La aplicación calcula Δt, letalidad, contribución ΔF y F
   acumulado.
3. **Resumen técnico:** consolida parámetros, mediciones, F real, F de diseño y
   el dictamen didáctico.

Los datos se guardan por usuario en SQLite y se comparten entre todas las
pantallas.

## Requisitos

- Node.js 20.9 o superior
- npm

## Configuración

1. Copia `.env.example` como `.env`.
2. Genera un secreto:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Coloca el resultado en `NEXTAUTH_SECRET`.
4. Instala y prepara la base:

```powershell
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
```

5. Inicia la aplicación:

```powershell
npm run dev
```

Acceso de demostración:

- Correo: `profesorColoma@gmail.com`
- Contraseña: `12345`

## Verificación

```powershell
npm test
npm run build
npm audit
```

## Modelo de cálculo

```text
n = log10(N0 / Nf)
D_T = D_ref × 10^((T_ref - T) / z)
F_T = n × D_T
L_i = 10^((T_i - T_ref) / z)
ΔF_i = L_i × Δt_i
F_real = Σ ΔF_i
```

La temperatura de cada fila representa el intervalo hasta la siguiente
medición. La última fila cierra el perfil y no añade un intervalo nuevo.

## Alcance

TermoSim es una herramienta académica y de diseño preliminar. No constituye
certificación, liberación sanitaria ni validación de un proceso industrial.
Una aplicación real debe usar parámetros microbiológicos documentados,
instrumentación calibrada, criterios regulatorios aplicables y revisión por
personal competente.

El diseño prioriza trazabilidad, validación de entradas, consistencia de datos,
seguridad de acceso, accesibilidad y mantenibilidad, en línea con principios de
calidad de ISO/IEC 25010 y gestión de inocuidad de ISO 22000/Codex.
