# 🚀 Release Creator

**Release Creator** es una aplicación de escritorio desarrollada con Electron, Vite, React y TypeScript diseñada para automatizar el flujo completo de creación de releases en múltiples repositorios de GitLab empresarial, gestionando la propagación de dependencias de librerías internas en 3 fases secuenciales con confirmación de usuario y consola interactiva en tiempo real.

---

## 🏛️ Arquitectura Técnica & Principios de Diseño

El sistema está diseñado bajo **Programación Funcional Pura** (sin uso de `class` ni `this`), **Clean Architecture**, **Screaming Architecture** y **Vertical Slicing**.

### 🛠️ Stack Tecnológico
- **Runtime & Desktop App**: Electron 33 + Node.js
- **Bundler & Frontend Engine**: Vite 6 + React 18 + TypeScript 5
- **Gestión de Estado**: Zustand 4 (con selectores `useShallow`)
- **Estilos**: CSS Modules (`*.module.css`) + Variables CSS (Diseño responsivo sin Tailwind)
- **Integración GitLab & Git**: Axios + Comandos Git en procesos locales (`child_process`)
- **Gestor de Paquetes**: `pnpm`

### 📁 Estructura del Proyecto

```text
release-creator/
├── .spec/                         # Documentación estratégica y especificaciones tecnicas
├── artifacts/                      # Artefactos de arquitectura, estándares y sprint plan
├── src/
│   ├── main/                       # Proceso Main de Electron (Backend Node.js)
│   │   ├── index.ts               # Entry point del proceso Main
│   │   ├── preload.ts             # ContextBridge e IPC handlers
│   │   └── modules/               # Módulos verticales backend (Funcionales)
│   │       ├── fsCleaner/         # Limpieza del directorio temporal ./repositories
│   │       ├── git/               # Automatización de operaciones Git (clone, branch, push)
│   │       ├── gitlab/            # Integración con la API REST de GitLab Empresarial
│   │       ├── obsidianReport/    # Generación de reportes
│   │       ├── packageJson/       # Manipulación de SemVer y dependencias en package.json
│   │       ├── releaseEngine/     # Orquestador principal de las 3 Fases de Release
│   │       └── terminalStream/    # Transmisión en vivo de stdout/stderr a la UI
│   ├── renderer/                  # Proceso Renderer de Electron (Frontend React)
│   │   ├── App.tsx                # Componente principal / Layout
│   │   ├── modules/               # Módulos verticales frontend UI
│   │   │   ├── configForm/        # Configuración de URLs, Tokens, Proyectos y Dependencias
│   │   │   ├── releaseControls/   # Controles de ejecución y avance de fases
│   │   │   └── terminalLog/       # Consola de transmisión de logs en tiempo real
│   │   └── shared/                # Estilos globales, i18n y utilidades UI
│   ├── shared/                    # Utilidades compartidas (Result Pattern, Types)
│   └── types/                     # Definiciones de tipos globales y CSS modules
├── electron-builder.json          # Configuración de empaquetado para distribución
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔄 Flujo Orquestado en 3 Fases

1. **🚀 Primera Fase — MRs de Release**:
   - Clona repositorios en `./repositories/`.
   - Procesa primero las **librerías internas**: incrementa versión en `package.json` (`X.X.X-SNAPSHOT` ➔ `X.X.X`), ejecuta build y publica versión local/remota.
   - Procesa los **proyectos dependientes**: actualiza la versión de la librería en `dependencies`/`devDependencies`, regenera el lockfile (`pnpm install`) y crea la MR en GitLab.
   - Genera MRs de release para los demás repositorios.

2. **🌿 Segunda Fase — Ramas de Release**:
   - Crea la rama `release/v<VERSION>` en GitLab para todos los repositorios procesados.

3. **🔄 Tercera Fase — SNAPSHOT Bumping para Nuevo Sprint**:
   - Incrementa la versión minor a `X.Y.0-SNAPSHOT` en librerías y proyectos.
   - Actualiza dependencias de librerías en proyectos dependientes.
   - Genera las correspondientes MRs en GitLab y vacía el directorio de trabajo `./repositories/`.

---

## 📋 Requisitos Previos

- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`
- **Git**: Configurado en la máquina local con permisos de acceso/SSH o PAT a GitLab.

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone git@github.com:AdelysAlberto/release-creator.git
cd release-creator
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Ejecutar en Modo Desarrollo
```bash
pnpm dev
```
O también:
```bash
pnpm app:dev
```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `pnpm dev` / `pnpm app:dev` | Inicia la aplicación en modo desarrollo con Vite HMR y Electron Sandbox desactivado. |
| `pnpm build` | Valida tipos de TypeScript (`tsc --noEmit`) y compila el bundle de producción con Vite. |
| `pnpm app:build` | Compila la aplicación y genera el ejecutable distribuible mediante `electron-builder`. |
| `pnpm lint` | Audita el código fuente mediante ESLint. |
| `pnpm fix` | Corrige errores de formato y linter automáticamente. |
| `pnpm preview` | Previsualiza el build de Vite. |

---

## 📄 Licencia

Propiedad interna de automatización de releases.
