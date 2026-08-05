# 📋 Desglose de Épicas e Historias de Usuario: Release Creator

> **Planificado por**: Adrian Monk (Scrum Master & Task Planner)  
> **Estado**: Perfectamente Ordenado y Limpio  
> **Criterio de Aceptación**: Alineación al 100% con Requerimientos y Cero Ambigüedad.

---

## Épica 1: Scaffolding, Proyecto Base e Infraestructura
**Objetivo**: Establecer la estructura del proyecto Electron + Vite + React + TypeScript con CSS Modules, Zustand i18n y Result Pattern sin tolerar ningun desorden.

### Historia 1.1: Inicialización del Proyecto y Dependencias
- **Descripción**: Configurar `package.json`, `tsconfig.json`, `vite.config.ts` y `electron-builder.json`.
- **Criterios de Aceptación**:
  - [ ] Proyecto arranca con Vite y Electron.
  - [ ] Dependencias instaladas: `react`, `zustand`, `@gitbeaker/rest`, `axios`, `xterm`.
  - [ ] Sin advertencias en la configuración inicial.

### Historia 1.2: Sistema de Estilos y Design Tokens
- **Descripción**: Configurar CSS Modules, reset de CSS y tokens globales en `src/renderer/styles/tokens.css`.
- **Criterios de Aceptación**:
  - [ ] Variables CSS definidas para colores de la UI (Gris terminal `#3a3a3a`, Teal `#008b9b`, Rojo `#a01010`, Azul border `#007acc`).
  - [ ] Cero TailwindCSS, cero estilos inline.

### Historia 1.3: Internacionalización (i18n) y Result Pattern
- **Descripción**: Configurar i18n con claves `t('key')` y la utilidad estricta `Result<T, E>`.
- **Criterios de Aceptación**:
  - [ ] `src/renderer/shared/utils/resultUtils.ts` exporta `ok` y `err`.
  - [ ] Textos de la aplicación externalizados en `locales/es.json`.

---

## Épica 2: Servicios Backend Electron Main (Node.js Modules)
**Objetivo**: Construir los módulos funcionales puros en `src/main/modules/` para ejecutar git, consumir GitLab API, manipular package.json y transmitir logs.

### Historia 2.1: Módulo Git Service
- **Descripción**: Implementar `gitService.ts` para clonar repos en `./repositories/`, checkout de ramas `release/v<version>`, commit y push.
- **Criterios de Aceptación**:
  - [ ] Funciones puras con Result Pattern (`cloneRepository`, `checkoutReleaseBranch`, `commitAndPush`).
  - [ ] Cero uso de `class` o `this`.

### Historia 2.2: Módulo GitLab API Service
- **Descripción**: Implementar `gitlabService.ts` para autenticación con GitLab Enterprise y creación de Merge Requests.
- **Criterios de Aceptación**:
  - [ ] Método `createMergeRequest` que retorna la URL directa de la MR creada.
  - [ ] Manejo de errores con `Result<string, string>`.

### Historia 2.3: Módulo PackageJson & Lockfile Service
- **Descripción**: Implementar `packageJsonService.ts` para leer/escribir `package.json`, bump de versiones SemVer y ejecutar `rm -rf node_modules pnpm-lock.yaml && pnpm i`.
- **Criterios de Aceptación**:
  - [ ] Cambio de versión `"2.0.0-SNAPSHOT"` ➔ `"2.0.0"`.
  - [ ] Bumping a `"2.1.0-SNAPSHOT"`.
  - [ ] Actualización de versión de la librería en `dependencies`/`devDependencies` de proyectos dependientes.
  - [ ] Regeneración limpia del lockfile mediante ejecutor de subprocesos.

### Historia 2.4: Módulo Terminal Streamer & FS Cleaner
- **Descripción**: Implementar streaming de logs `stdout`/`stderr` en tiempo real hacia la UI y limpiador de `./repositories/`.
- **Criterios de Aceptación**:
  - [ ] Transmisión de logs en vivo a través del canal IPC `terminal:log`.
  - [ ] Función `cleanRepositoriesDir` que vacía `./repositories/` tras la Fase 3.

---

## Épica 3: Motor de Orquestación de 3 Fases (Release Engine)
**Objetivo**: Unificar el flujo de trabajo de 3 etapas con pausas interactivas y confirmación del usuario.

### Historia 3.1: Orquestador Fase 1 (Release MRs & Librerías First)
- **Descripción**: Clonar repos, procesar librerías primero (`pnpm build:lib` + `pnpm build:prod`), procesar proyectos dependientes (actualización de versión de librería + lockfile refresh), crear MRs y retornar URLs.
- **Criterios de Aceptación**:
  - [ ] Librerías procesadas obligatoriamente en primer lugar.
  - [ ] Proyectos dependientes actualizados correctamente.
  - [ ] MRs creadas y URLs enviadas a la terminal.
  - [ ] Estado en pausa esperando confirmación de la Fase 2.

### Historia 3.2: Orquestador Fase 2 (Release Branch Creation)
- **Descripción**: Crear la rama `release/v<VERSION>` en todos los repositorios.
- **Criterios de Aceptación**:
  - [ ] Ramas creadas y pushed a GitLab.
  - [ ] Log de éxito en terminal y pausa esperando confirmación de la Fase 3.

### Historia 3.3: Orquestador Fase 3 (Next Sprint SNAPSHOT & Cleanup)
- **Descripción**: Incrementar a versión minor SNAPSHOT (`2.1.0-SNAPSHOT`), compilación/publicación de librerías, actualización de proyectos dependientes, MRs y vaciado final de `./repositories/`.
- **Criterios de Aceptación**:
  - [ ] Versiones ajustadas a SNAPSHOT.
  - [ ] MRs de nuevo sprint generadas.
  - [ ] Directorio `./repositories/` vaciado por completo al terminar.

---

## Épica 4: Interfaz de Usuario UI (Renderer Process)
**Objetivo**: Construir la interfaz de usuario dividida según el diseño proporcionado (Terminal a la izquierda, Panel de Control a la derecha).

### Historia 4.1: Componente Terminal Console Live
- **Descripción**: Construir la consola de terminal (panel izquierdo) para visualizar logs ANSI en tiempo real y URLs de MRs.
- **Criterios de Aceptación**:
  - [ ] Fondo gris oscuro `#3a3a3a` con auto-scroll y formateo limpio.
  - [ ] Renderizado de enlaces clickeables de las MRs.

### Historia 4.2: Componente Formulario de Configuración
- **Descripción**: Formulario (panel derecho superior) con inputs para URL GitLab, IDs de proyectos, Versión Release y Tabla Dinámica de Dependencias Proyecto-Librería.
- **Criterios de Aceptación**:
  - [ ] Tabla interactiva para añadir pares (ID Proyecto | ID Librería).
  - [ ] Botón "Agregar" fila funcional.
  - [ ] Validación de campos obligatorios.

### Historia 4.3: Componente Botones de Control de Fase
- **Descripción**: Botones "Comenzar" (Teal), "Interrumpir" (Rojo) y botones de paso de fase ("Continuar 2da Fase", "Continuar 3era Etapa").
- **Criterios de Aceptación**:
  - [ ] Deshabilitación de botones según el estado actual de la máquina de estados.
  - [ ] Interrupción inmediata en caso de clic en "Interrumpir".

---

## Épica 5: Verificación Pre-Commit y Quality Assurance
**Objetivo**: Asegurar la calidad total del código previo al despliegue.

### Historia 5.1: Ejecución del Pipeline de Calidad
- **Descripción**: Ejecutar y validar `pnpm fix && pnpm tsc --noEmit && pnpm build`.
- **Criterios de Aceptación**:
  - [ ] 0 errores de TypeScript.
  - [ ] 0 advertencias de linter.
  - [ ] Build de producción generado exitosamente.
