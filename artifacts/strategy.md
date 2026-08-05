# Plan Estratégico General: Release Creator (GitLab Release Automation)

## 📌 Visión del Proyecto
Desarrollar una aplicación de escritorio/web visual (Electron / Node.js + Frontend UI) para automatizar el proceso de creación de releases en múltiples repositorios de GitLab empresarial, gestionando dependencias de librerías internas en 3 etapas secuenciales con confirmación del usuario y salida de terminal en vivo.

---

## 🎯 Requerimientos y Flujo Funcional

### 1. Parámetros de Entrada (UI Panel Derecho)
- **URL de GitLab Empresa**: Endpoint base de la instancia GitLab (ej. `https://gitlab.empresa.com`).
- **IDs de Proyectos GitLab**: Lista de IDs numéricos/paths de los repositorios a procesar.
- **Mapeo de Dependencias de Librerías**: Tabla interactiva de relaciones (ID Proyecto Dependiente ➔ ID Librería).
- **Versión de Release a Crear**: String de versión objetivo (ej. `2.0.0`).
- **Controles**: Botón "Comenzar", Botón "Interrumpir", Botones de avance de etapa ("Continuar 2da Fase", "Continuar 3era Fase").

### 2. Terminal Live (UI Panel Izquierdo)
- Consola visual que muestra logs en tiempo real de comandos ejecutados, clones de git, builds, publicaciones de pnpm, errores y URLs de las Merge Requests (MR) generadas.

### 3. Etapas de Ejecución

#### 🚀 Primera Fase: Creación de MRs de Release
1. **Clonado**: Clonar proyectos dentro de la carpeta local `./repositories/`.
2. **Orden de Ejecución**: Procesar **librerías de componentes primero**.
3. **Procesamiento de Librería**:
   - Cambiar versión en `package.json`: `"2.0.0-SNAPSHOT"` ➔ `"2.0.0"`.
   - Ejecutar compilación: `pnpm build:lib`.
   - Ejecutar publicación: `pnpm build:prod`.
   - Si todo es exitoso, crear rama y MR en GitLab para el cambio de versión.
4. **Procesamiento de Proyectos Dependientes**:
   - Cambiar versión propia en `package.json` a `"2.0.0"`.
   - Buscar y actualizar la versión de la librería en `dependencies`/`devDependencies` a `"2.0.0"`.
   - Regenerar lockfile: `rm -rf node_modules pnpm-lock.yaml && pnpm i`.
   - Crear rama y MR en GitLab.
5. **Resto de Proyectos**:
   - Cambiar versión en `package.json` a `"2.0.0"`.
   - Crear rama y MR en GitLab.
6. **Entrega de MRs**: Presentar las URLs de las MRs generadas en la terminal y esperar confirmación del usuario para avanzar a la 2da Fase.

#### 🌿 Segunda Fase: Creación de Ramas de Release
1. Crear la rama de release `release/v<VERSION>` (ej. `release/v2.0.0`) en GitLab para todos los proyectos procesados.
2. Informar en la terminal la creación exitosa de las ramas en todos los proyectos.
3. Esperar confirmación del usuario para avanzar a la 3era Etapa.

#### 🔄 Tercera Fase: MRs para Nuevo Sprint (SNAPSHOT Bumping)
1. **Librerías primero**:
   - Incrementar versión minor en `package.json`: `"2.0.0"` ➔ `"2.1.0-SNAPSHOT"`.
   - Re-compilar (`pnpm build:lib`) y publicar (`pnpm build:prod`).
   - Si es exitoso, proceder con proyectos dependientes y el resto.
2. **Proyectos Dependientes y Resto**:
   - Incrementar versión minor a `"2.1.0-SNAPSHOT"`.
   - Actualizar versión de librería en `dependencies` si aplica.
   - Regenerar lockfile: `rm -rf node_modules pnpm-lock.yaml && pnpm i`.
   - Crear MR en GitLab.
3. **Cierre de Proceso**:
   - Mostrar URLs de las nuevas MRs en la terminal live.
   - Al finalizar satisfactoriamente las 3 etapas, vaciar la carpeta `./repositories/`.

---

## 🏛️ Hoja de Ruta de Orquestación del Equipo Krain

```text
[El Profesor] ──> [Sherlock Holmes] ──> [Roz] ──> [Edna Moda] ──> [Sheldon Cooper] ──> [Vicky] ──> [Adrian Monk]
  (/start)         (/brainstorm)       (/prd)     (/ux)           (/arch)           (/standards)     (/sprint)
```

1. **Sherlock Analyst** (`/brainstorm`): Análisis de mercado, herramientas comparables y patrones de automatización GitLab CI/CLI ➔ `artifacts/market_research.md` / `.spec/01_market_research.md`.
2. **Roz Product** (`/prd`): Especificación de requerimientos funcionales y no funcionales, reglas de validación y flujos detallados ➔ `artifacts/prd.md` / `.spec/02_prd.md`.
3. **Edna Moda** (`/ux`): Diseño UI/UX dramático, arquitectura visual basada en la maqueta adjunta, componentes y layout ➔ `artifacts/ux_specification.md` / `.spec/03_ux_specification.md`.
4. **Sheldon Cooper** (`/arch`): Arquitectura técnica Electron + Node.js IPC, Git Automation Service, GitLab API SDK, manejo de procesos child_process ➔ `artifacts/architecture_specification.md` / `.spec/04_architecture_specification.md`.
5. **Vicky Tech Lead** (`/standards`): Clean Architecture, Result Pattern, Screaming Architecture, estructura `src/modules/` y estándares de código ➔ `artifacts/technical_standards.md` / `.spec/05_technical_standards.md`.
6. **Adrian Monk Scrum Master** (`/sprint`): Desglose en Épicas y plan de tareas paso a paso para implementación ➔ `artifacts/sprint_plan.md` / `.spec/06_sprint_plan.md`.
