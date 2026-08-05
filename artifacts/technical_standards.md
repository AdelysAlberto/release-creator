# 🛠️ Estándares Técnicos, Scaffolding y Convenciones de Código: Release Creator

> **Definido por**: Vicky (Technical Architect & Tech Lead)  
> **Estado**: Aprobado y Obligatorio para Todo el Código del Proyecto  
> **Criterios de Calidad**: Zero Warning Policy, 100% Functional Pure, Result Pattern Obligatorio.

---

## 1. Reglas No Negociables de Ingeniería (The Core Commandments)

1. **Código Funcional Puro (Sin `class` ni `this`)**:
   - Queda **estrictamente prohibido** el uso de las palabras clave `class`, `this`, `extends` o patrones de Programación Orientada a Objetos.
   - Todo el código backend y frontend debe estructurarse en **funciones puras**, **factories funcionales** y **módulos inmutables**.

2. **Vertical Slicing & Screaming Architecture**:
   - Todo el código de negocio vive agrupado por módulo funcional dentro de `src/modules/<NombreModulo>/` en backend y `src/renderer/modules/<NombreModulo>/` en frontend.
   - Prohibido crear carpetas genéricas como `src/helpers/`, `src/services/` o `src/components/` fuera de los límites de cada módulo.

3. **Manejo de Errores con Result Pattern**:
   - Ninguna función de servicio o utilidad puede lanzar un `throw`.
   - Todas las funciones asíncronas o propensas a fallos (operaciones git, llamadas HTTP a GitLab, manipulación de `package.json`, ejecución de scripts pnpm) deben retornar un tipo de resultado explícito `Result<T, E>`.

   ```typescript
   // Definición Estándar
   export type Result<T, E = string> =
     | { ok: true; value: T }
     | { ok: false; error: E };

   export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
   export const err = <E = string>(error: E): Result<never, E> => ({ ok: false, error });
   ```

4. **Selectores Atómicos en Zustand**:
   - Queda prohibido desestructurar stores enteras de Zustand (ej. `const { config, updateConfig } = useConfigStore()`).
   - Siempre se deben usar selectores atómicos con `useShallow`:
   ```typescript
   import { useShallow } from 'zustand/react/shallow';
   
   const gitlabUrl = useConfigStore(useShallow((state) => state.gitlabUrl));
   ```

5. **Estilos Aislados con CSS Modules**:
   - Uso exclusivo de CSS Modules (`*.module.css`). Prohibido TailwindCSS y prohibidos los estilos en línea (`style={{...}}`).
   - Se deben definir variables globales de diseño (Design Tokens) en `src/renderer/styles/tokens.css`.

6. **Internacionalización Obligatoria**:
   - Todo texto o mensaje visible para el usuario en la interfaz debe utilizar claves del sistema i18n mediante `t('key')`.

7. **Verificación Pre-Commit Estricta**:
   - Antes de dar por finalizada cualquier tarea de desarrollo o commit, se debe ejecutar y aprobar sin advertencias ni errores:
   ```bash
   pnpm fix && pnpm tsc --noEmit && pnpm build
   ```

---

## 2. Estructura de Scaffolding Completa (`src/`)

```text
/home/adalbeca/Dev/Sice/util/release-creator/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json
├── .spec/
│   ├── 00_strategy.md
│   ├── 04_architecture_specification.md
│   └── 05_technical_standards.md
├── artifacts/
│   ├── strategy.md
│   ├── architecture_specification.md
│   └── technical_standards.md
├── repositories/                  # Directorio de clonado temporal
└── src/
    ├── main/                      # Electron Main Process (Node.js Backend)
    │   ├── index.ts
    │   ├── preload.ts
    │   └── modules/
    │       ├── git/               # Servicios de Git (clone, checkout, push)
    │       │   ├── gitService.ts
    │       │   └── gitTypes.ts
    │       ├── gitlab/            # Cliente API GitLab Enterprise
    │       │   ├── gitlabService.ts
    │       │   └── gitlabTypes.ts
    │       ├── packageJson/       # Manipulador de semver y pnpm lockfile
    │       │   ├── packageJsonService.ts
    │       │   └── packageJsonTypes.ts
    │       ├── releaseEngine/     # Orquestador de 3 Fases
    │       │   ├── releaseOrchestrator.ts
    │       │   ├── phase1Execution.ts
    │       │   ├── phase2Execution.ts
    │       │   ├── phase3Execution.ts
    │       │   └── releaseEngineTypes.ts
    │       └── terminalStream/    # Emisor de logs IPC en tiempo real
    │           ├── terminalStreamService.ts
    │           └── terminalStreamTypes.ts
    ├── renderer/                  # Electron Renderer Process (React UI)
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── App.module.css
    │   ├── styles/
    │   │   ├── reset.css
    │   │   └── tokens.css
    │   ├── shared/
    │   │   ├── components/        # Componentes UI puros atomizados
    │   │   │   ├── Button/
    │   │   │   │   ├── Button.tsx
    │   │   │   │   └── Button.module.css
    │   │   │   └── Input/
    │   │   │       ├── Input.tsx
    │   │   │       └── Input.module.css
    │   │   ├── i18n/              # Textos traducidos
    │   │   │   ├── i18n.ts
    │   │   │   └── locales/
    │   │   │       └── es.json
    │   │   └── utils/             # Funciones puras compartidas
    │   │       └── resultUtils.ts
    │   └── modules/
    │       ├── configForm/        # Módulo UI Formulario Parámetros GitLab
    │       │   ├── components/
    │       │   │   ├── ConfigForm.tsx
    │       │   │   ├── ConfigForm.module.css
    │       │   │   ├── DependencyTable.tsx
    │       │   │   └── DependencyTable.module.css
    │       │   ├── configStore.ts
    │       │   └── configTypes.ts
    │       ├── terminalLog/       # Módulo UI Consola Terminal Live
    │       │   ├── components/
    │       │   │   ├── TerminalConsole.tsx
    │       │   │   └── TerminalConsole.module.css
    │       │   ├── terminalStore.ts
    │       │   └── terminalTypes.ts
    │       └── releaseControls/   # Módulo UI Botones Comenzar/Interrumpir/Etapas
    │           ├── components/
    │           │   ├── PhaseControls.tsx
    │           │   └── PhaseControls.module.css
    │           ├── releaseStore.ts
    │           └── releaseTypes.ts
    └── types/
        └── global.d.ts            # Extensiones window.api de Electron
```

---

## 3. Estándar de Implementación de Módulos (Ejemplo Funcional)

### Ejemplo de Servicio (`src/main/modules/git/gitService.ts`)

```typescript
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Result, ok, err } from '../../shared/utils/resultUtils';

const execAsync = promisify(exec);

export const createGitService = () => {
  const cloneRepository = async (
    repoUrl: string,
    targetDir: string
  ): Promise<Result<string, string>> => {
    try {
      const { stdout, stderr } = await execAsync(`git clone ${repoUrl} ${targetDir}`);
      return ok(stdout || stderr);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(`Error clonando repositorio en ${targetDir}: ${message}`);
    }
  };

  const createReleaseBranch = async (
    repoDir: string,
    branchName: string
  ): Promise<Result<string, string>> => {
    try {
      const { stdout } = await execAsync(`git checkout -b ${branchName} && git push origin ${branchName}`, {
        cwd: repoDir,
      });
      return ok(stdout);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(`Error creando rama ${branchName} en ${repoDir}: ${message}`);
    }
  };

  return {
    cloneRepository,
    createReleaseBranch,
  };
};
```

---

## 4. Estándar de Contrato IPC en Preload (`src/main/preload.ts`)

```typescript
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  startRelease: (config: unknown) => ipcRenderer.invoke('release:start', config),
  proceedPhase2: () => ipcRenderer.invoke('release:proceedPhase2'),
  proceedPhase3: () => ipcRenderer.invoke('release:proceedPhase3'),
  interruptRelease: () => ipcRenderer.invoke('release:interrupt'),
  onTerminalLog: (callback: (log: { stream: string; text: string; timestamp: number }) => void) => {
    const listener = (_: unknown, data: any) => callback(data);
    ipcRenderer.on('terminal:log', listener);
    return () => ipcRenderer.removeListener('terminal:log', listener);
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ApiBridge = typeof api;
```

---

## 5. Matriz de Verificación de Calidad

| Regla | Mecanismo de Verificación | Acción en Violación |
| :--- | :--- | :--- |
| **Uso de Class / OOP** | Linter Custom / Review | Rechazo inmediato del PR |
| **Manejo de Errores con Throw** | Linter TypeScript | Error de compilación |
| **Desestructuración Store Zustand** | Linter ESLint Rules | Error de build en `pnpm tsc` |
| **Uso de Tailwind / Inline Style** | Review + Linter | Fallo de build en `pnpm build` |
| **Falta de i18n** | Review de PR | Corrección requerida |
| **Error en Build / Types** | Script `pnpm fix && pnpm tsc --noEmit` | Rechazo automático |
