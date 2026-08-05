# 📅 Plan de Sprint y Desglose de Tareas Ejecutables paso a paso (1 a 1)

> **Scrum Master**: Adrian Monk  
> **Objetivo del Sprint**: Implementación completa y limpia de la herramienta Release Creator.  
> **Criterio Obsesivo de Aceptación**: Cada tarea debe ser ejecutada en orden secuencial exacto sin saltarse ningún paso.

---

## 🏃 Sprint Backlog: Lista Meticulosa de Tareas Ejecutables

```text
[Fase 1: Infrastructure] -> [Fase 2: Backend Modules] -> [Fase 3: Engine] -> [Fase 4: Frontend UI] -> [Fase 5: Verification]
```

### 🔹 Tarea 1: Configuración Inicial del Proyecto (Scaffolding Core)
- **Archivos**: `package.json`, `tsconfig.json`, `vite.config.ts`, `electron-builder.json`
- **Acción**: Inicializar repositorio con Vite + Electron + React + TypeScript. Instalar dependencias de desarrollo y producción (`electron`, `react`, `zustand`, `@gitbeaker/rest`, `axios`, `xterm`).
- **Verificación**: Ejecutar `pnpm i` y verificar que la estructura de carpetas `src/main/` y `src/renderer/` esté perfectamente alineada.

### 🔹 Tarea 2: Design Tokens y CSS Modules Core
- **Archivos**: `src/renderer/styles/tokens.css`, `src/renderer/styles/reset.css`
- **Acción**: Crear las variables de CSS globales para colores, fuentes Inter/Roboto, bordes y espaciados basados en la maqueta de UI.
- **Verificación**: Asegurar cero uso de Tailwind y cero estilos inline.

### 🔹 Tarea 3: Utility de Manejo de Errores Result Pattern
- **Archivos**: `src/renderer/shared/utils/resultUtils.ts`
- **Acción**: Escribir las funciones puras `ok<T>(value: T)` y `err<E>(error: E)` para el tipo `Result<T, E>`.
- **Verificación**: Comprobar que no exista ningún `throw` en todo el proyecto.

### 🔹 Tarea 4: Sistema de Internacionalización (i18n)
- **Archivos**: `src/renderer/shared/i18n/i18n.ts`, `src/renderer/shared/i18n/locales/es.json`
- **Acción**: Crear el diccionario de claves traducibles para todos los botones, títulos, labels e instrucciones de la UI.
- **Verificación**: Comprobar que no queden strings quemados (hardcoded) en la UI.

### 🔹 Tarea 5: Módulo Git Backend (Node.js Service)
- **Archivos**: `src/main/modules/git/gitService.ts`, `src/main/modules/git/gitTypes.ts`
- **Acción**: Crear el servicio funcional puro para clonar repositorios en `./repositories/`, checkout de ramas de release `release/v<version>`, git commit y git push.
- **Verificación**: Probar funciones puras retornando `Result<string, string>`.

### 🔹 Tarea 6: Módulo GitLab API Backend
- **Archivos**: `src/main/modules/gitlab/gitlabService.ts`, `src/main/modules/gitlab/gitlabTypes.ts`
- **Acción**: Crear el cliente de la API de GitLab para autenticación y generación de Merge Requests (MRs).
- **Verificación**: Retornar URL directa formateada de cada MR creada.

### 🔹 Tarea 7: Módulo PackageJson & Lockfile Service
- **Archivos**: `src/main/modules/packageJson/packageJsonService.ts`, `src/main/modules/packageJson/packageJsonTypes.ts`
- **Acción**: Implementar lectura/escritura de `package.json`, bumping de versión SemVer (`SNAPSHOT` a release y release a `SNAPSHOT`), actualización de dependencia de librería y ejecución del comando `rm -rf node_modules pnpm-lock.yaml && pnpm i`.
- **Verificación**: Verificar modificación correcta de campos JSON sin corruptos.

### 🔹 Tarea 8: Módulo Terminal Streamer & Cleaner
- **Archivos**: `src/main/modules/terminalStream/terminalStreamService.ts`, `src/main/modules/fsCleaner/fsCleanerService.ts`
- **Acción**: Capturar `stdout`/`stderr` de los comandos `pnpm build:lib` y `pnpm build:prod`, emitir eventos IPC `terminal:log` y crear función para vaciar `./repositories/` al finalizar Fase 3.
- **Verificación**: Transmisión de logs en vivo verificada.

### 🔹 Tarea 9: Contrato Preload IPC
- **Archivos**: `src/main/preload.ts`, `src/types/global.d.ts`
- **Acción**: Exponer `window.api` a través de `contextBridge` con los métodos `startRelease`, `proceedPhase2`, `proceedPhase3`, `interruptRelease` y `onTerminalLog`.
- **Verificación**: Tipado TypeScript estricto en `global.d.ts`.

### 🔹 Tarea 10: Release Engine - Fase 1 Implementation
- **Archivos**: `src/main/modules/releaseEngine/phase1Execution.ts`
- **Acción**: Implementar la lógica de clonado, compilación/publicación prioritaria de librerías, actualización de proyectos dependientes, refresco de lockfile y generación de MRs.
- **Verificación**: Generación de array con las URLs de las MRs creadas.

### 🔹 Tarea 11: Release Engine - Fase 2 Implementation
- **Archivos**: `src/main/modules/releaseEngine/phase2Execution.ts`
- **Acción**: Implementar creación de la rama `release/v<VERSION>` en todos los repositorios clonados.
- **Verificación**: Confirmar notificación de ramas creadas.

### 🔹 Tarea 12: Release Engine - Fase 3 Implementation & Cleanup
- **Archivos**: `src/main/modules/releaseEngine/phase3Execution.ts`
- **Acción**: Incrementar versión minor a `2.1.0-SNAPSHOT`, re-compilar y publicar librerías, actualizar proyectos dependientes, refrescar lockfiles, crear MRs de nuevo sprint y vaciar el directorio `./repositories/`.
- **Verificación**: Limpieza de carpeta `./repositories/` confirmada al concluir.

### 🔹 Tarea 13: Release Engine Orchestrator Main
- **Archivos**: `src/main/modules/releaseEngine/releaseOrchestrator.ts`
- **Acción**: Conectar las 3 fases a los handlers de IPC de Electron Main (`release:start`, `release:proceedPhase2`, etc.).
- **Verificación**: Manejo de interrupción limpia ante el evento `release:interrupt`.

### 🔹 Tarea 14: Frontend UI - Store Global Zustand
- **Archivos**: `src/renderer/modules/configForm/configStore.ts`, `src/renderer/modules/terminalLog/terminalStore.ts`, `src/renderer/modules/releaseControls/releaseStore.ts`
- **Acción**: Crear tiendas Zustand inmutables consumibles únicamente mediante selectores con `useShallow`.
- **Verificación**: Cero re-renders globales.

### 🔹 Tarea 15: Frontend UI - Componente Terminal Log Live
- **Archivos**: `src/renderer/modules/terminalLog/components/TerminalConsole.tsx`, `src/renderer/modules/terminalLog/components/TerminalConsole.module.css`
- **Acción**: Crear el visor de consola en el panel izquierdo (fondo gris `#3a3a3a`) con renderizado de logs y enlaces clickeables de las MRs.
- **Verificación**: Scroll automático activado.

### 🔹 Tarea 16: Frontend UI - Componente ConfigForm & Dependency Table
- **Archivos**: `src/renderer/modules/configForm/components/ConfigForm.tsx`, `src/renderer/modules/configForm/components/DependencyTable.tsx`
- **Acción**: Construir el panel derecho superior con inputs de URL GitLab, IDs de repositorios, Versión Release y Tabla interactiva para mapear ID Proyecto vs ID Librería con botón "Agregar".
- **Verificación**: Agregar y remover filas de la tabla de dependencias.

### 🔹 Tarea 17: Frontend UI - Componente PhaseControls
- **Archivos**: `src/renderer/modules/releaseControls/components/PhaseControls.tsx`, `src/renderer/modules/releaseControls/components/PhaseControls.module.css`
- **Acción**: Renderizar los botones "Comenzar" (Teal), "Interrumpir" (Rojo) y los botones dinámicos "Continuar 2da Fase" / "Continuar 3era Etapa".
- **Verificación**: Habilitación/Deshabilitación limpia de acuerdo con la máquina de estados.

### 🔹 Tarea 18: Frontend UI - Layout Principal `App.tsx`
- **Archivos**: `src/renderer/App.tsx`, `src/renderer/App.module.css`
- **Acción**: Ensamblar el layout de 2 columnas (Terminal Live a la izquierda, Panel de Control a la derecha) respetando la maqueta visual.
- **Verificación**: Ajuste visual impecable y responsive.

### 🔹 Tarea 19: Verificación Pre-Commit Final
- **Comando**: `pnpm fix && pnpm tsc --noEmit && pnpm build`
- **Acción**: Ejecutar el script completo de linting, comprobación de tipos y build de producción.
- **Verificación**: Zero errores, zero warnings, build completado exitosamente.
