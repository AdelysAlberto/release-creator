import path from 'node:path';
import fs from 'node:fs';
import type { BrowserWindow } from 'electron';
import type { ReleaseConfig, StatusPayload, MrUrlItem } from '../../../types/global.d.ts';
import { Result, ok, err } from '../../../shared/utils/resultUtils.js';
import { createGitService } from '../git/gitService.js';
import { createGitLabService } from '../gitlab/gitlabService.js';
import { createPackageJsonService } from '../packageJson/packageJsonService.js';
import { createFsCleanerService } from '../fsCleaner/fsCleanerService.js';
import { createTerminalStreamService } from '../terminalStream/terminalStreamService.js';
import { createObsidianReportService } from '../obsidianReport/obsidianReportService.js';

export interface OrchestratorState {
  config: ReleaseConfig | null;
  currentPhase: 1 | 2 | 3;
  status: 'idle' | 'running' | 'waiting_user' | 'error' | 'success' | 'interrupted';
  mrListPhase1: MrUrlItem[];
  mrListPhase3: MrUrlItem[];
}

export const createReleaseOrchestrator = (baseDir: string) => {
  const gitService = createGitService();
  const gitLabService = createGitLabService();
  const packageService = createPackageJsonService();
  const fsCleanerService = createFsCleanerService();
  const terminalStream = createTerminalStreamService();
  const obsidianReportService = createObsidianReportService();

  let state: OrchestratorState = {
    config: null,
    currentPhase: 1,
    status: 'idle',
    mrListPhase1: [],
    mrListPhase3: [],
  };

  const getNextMinorSnapshot = (version: string): string => {
    const cleanVer = version.replace(/-SNAPSHOT$/i, '');
    const parts = cleanVer.split('.');
    if (parts.length >= 2) {
      const major = parts[0];
      const minor = parseInt(parts[1], 10) + 1;
      return `${major}.${minor}.0-SNAPSHOT`;
    }
    return `${version}-SNAPSHOT`;
  };

  const emitStatus = (window: BrowserWindow | null, message: string) => {
    const payload: StatusPayload = {
      currentPhase: state.currentPhase,
      status: state.status,
      message,
    };
    if (window && !window.isDestroyed()) {
      window.webContents.send('release:statusChange', payload);
    }
  };

  const log = (window: BrowserWindow | null, text: string, stream: 'stdout' | 'stderr' | 'system' = 'stdout') => {
    terminalStream.emitLog(window, text, stream);
  };

  const ensureRepoCloned = async (gitlabUrl: string, projId: string, reposDir: string): Promise<string> => {
    const folderName = projId.replace(/\//g, '__');
    const repoPath = path.join(reposDir, folderName);
    if (!fs.existsSync(repoPath)) {
      const detailsRes = await gitLabService.getProjectDetails(gitlabUrl, projId);
      const httpUrl = detailsRes.ok ? detailsRes.value.httpUrlToRepo : `${gitlabUrl}/${projId}.git`;
      await gitService.cloneRepo(httpUrl, repoPath);
    }
    return repoPath;
  };

  const startPhase1 = async (window: BrowserWindow | null, rawConfig: ReleaseConfig): Promise<Result<void>> => {
    const gitlabUrl = rawConfig.gitlabUrl.trim();
    const normalizedProjectIds = rawConfig.projectIds
      .map((id) => gitLabService.normalizeProjectIdentifier(id, gitlabUrl))
      .filter((id) => id.length > 0);

    const normalizedDependencies = rawConfig.dependencies
      .map((d) => ({
        ...d,
        projectId: gitLabService.normalizeProjectIdentifier(d.projectId, gitlabUrl),
        libraryId: gitLabService.normalizeProjectIdentifier(d.libraryId, gitlabUrl),
      }))
      .filter((d) => d.projectId.length > 0 && d.libraryId.length > 0);

    const config: ReleaseConfig = {
      gitlabUrl,
      gitlabToken: rawConfig.gitlabToken,
      projectIds: normalizedProjectIds,
      dependencies: normalizedDependencies,
      releaseVersion: rawConfig.releaseVersion.trim(),
    };

    state = {
      config,
      currentPhase: 1,
      status: 'running',
      mrListPhase1: [],
      mrListPhase3: [],
    };
    emitStatus(window, 'Iniciando Fase 1: Creación de MRs de Release y Publicación de Librerías...');

    log(window, '==================================================', 'system');
    log(window, '🚀 INICIANDO FASE 1: PROCESO DE RELEASE Y MRS', 'system');
    log(window, `GitLab URL Base: ${config.gitlabUrl}`, 'system');
    log(window, `Versión Release Objetivo: ${config.releaseVersion}`, 'system');
    log(window, `Proyectos a procesar (${config.projectIds.length}): ${config.projectIds.join(' | ')}`, 'system');
    log(window, '==================================================', 'system');

    const reposDir = path.resolve(baseDir, 'repositories');
    log(window, `Directorio local de clonado: ${reposDir}`, 'system');

    const projectDetailsMap = new Map<string, { repoPath: string; httpUrl: string; repoName: string }>();

    for (const normId of config.projectIds) {
      const detailsRes = await gitLabService.getProjectDetails(config.gitlabUrl, normId, config.gitlabToken);
      const details = detailsRes.ok
        ? detailsRes.value
        : { name: normId.split('/').pop() || normId, httpUrlToRepo: `${config.gitlabUrl}/${normId}.git` };

      const folderName = normId.replace(/\//g, '__');
      const repoPath = path.join(reposDir, folderName);

      projectDetailsMap.set(normId, {
        repoPath,
        httpUrl: details.httpUrlToRepo,
        repoName: details.name,
      });

      log(window, `\nClonando [${details.name}] desde ${details.httpUrlToRepo}...`);
      const cloneRes = await gitService.cloneRepo(details.httpUrlToRepo, repoPath);
      if (!cloneRes.ok) {
        log(window, `Aviso en clonado para ${normId}: ${cloneRes.error}`, 'stderr');
      } else {
        log(window, `✅ Repositorio [${details.name}] clonado en ${repoPath}`);
      }
    }

    const libraryIds = new Set(config.dependencies.map((d) => d.libraryId));
    const libProjects = config.projectIds.filter((id) => libraryIds.has(id));
    const nonLibProjects = config.projectIds.filter((id) => !libraryIds.has(id));

    log(window, `\nLibrerías priorizadas (${libProjects.length}): ${libProjects.join(', ') || 'Ninguna'}`, 'system');
    log(window, `Proyectos dependientes/restantes (${nonLibProjects.length}): ${nonLibProjects.join(', ')}`, 'system');

    const libraryNamesMap = new Map<string, string>();

    // 3. Procesar Librerías Primero
    for (const libId of libProjects) {
      const info = projectDetailsMap.get(libId);
      const repoPath = info ? info.repoPath : path.join(reposDir, libId.replace(/\//g, '__'));
      log(window, `\n--- 📦 Procesando Librería: ${info?.repoName || libId} ---`, 'system');

      log(window, `Cambiando versión en package.json a ${config.releaseVersion}...`);
      const updateVerRes = await packageService.updateVersion(repoPath, config.releaseVersion);
      if (updateVerRes.ok) {
        libraryNamesMap.set(libId, updateVerRes.value.name);
        log(window, `Librería [${updateVerRes.value.name}] actualizada a versión ${config.releaseVersion}`);
      } else {
        log(window, `Error leyendo package.json en librería ${libId}: ${updateVerRes.error}`, 'stderr');
      }

      log(window, `Ejecutando pnpm build:lib & pnpm build:prod...`);
      const buildRes = await packageService.buildAndPublishLibrary(repoPath, (msg) => log(window, msg));
      if (!buildRes.ok) {
        state.status = 'error';
        emitStatus(window, `Error en compilación/publicación de librería ${libId}`);
        log(window, `❌ ERROR CRÍTICO EN LIBRERÍA: ${buildRes.error}`, 'stderr');
        return err(buildRes.error);
      }

      const branchName = `feature/UpdateVersionSprint${config.releaseVersion}`;
      log(window, `Creando rama ${branchName} y realizando commit/push...`);
      await gitService.createAndCheckoutBranch(repoPath, branchName);
      await gitService.commitAndPush(repoPath, `chore: release version ${config.releaseVersion}`, branchName);

      const mrRes = await gitLabService.createMergeRequest({
        gitlabUrl: config.gitlabUrl,
        projectIdOrPath: libId,
        sourceBranch: branchName,
        targetBranch: 'develop',
        title: `#000000 [Release]: Update version to ${config.releaseVersion}`,
        labels: ['Release', 'Ready to Review'],
        reviewerName: 'CodeChecker',
        assigneeName: 'Adelys Belen',
        token: config.gitlabToken,
      });
      const mrUrl = mrRes.ok ? mrRes.value : `${config.gitlabUrl}/${libId}/-/merge_requests/new`;
      state.mrListPhase1.push({ projectId: libId, repoName: libraryNamesMap.get(libId) || info?.repoName || libId, url: mrUrl });
      log(window, `✅ MR de Librería creada exitosamente: ${mrUrl}`, 'system');
    }

    // 4. Procesar Proyectos Dependientes y Resto
    for (const projId of nonLibProjects) {
      const info = projectDetailsMap.get(projId);
      const repoPath = info ? info.repoPath : path.join(reposDir, projId.replace(/\//g, '__'));
      log(window, `\n--- 🚀 Procesando Proyecto: ${info?.repoName || projId} ---`, 'system');

      const updateVerRes = await packageService.updateVersion(repoPath, config.releaseVersion);
      const repoName = updateVerRes.ok ? updateVerRes.value.name : info?.repoName || projId;
      log(window, `Proyecto [${repoName}] actualizado a versión ${config.releaseVersion}`);

      const depRelations = config.dependencies.filter((d) => d.projectId === projId);
      for (const rel of depRelations) {
        const libPackageName = libraryNamesMap.get(rel.libraryId);
        if (libPackageName) {
          log(window, `Actualizando versión de dependencia de librería [${libPackageName}] a ${config.releaseVersion}...`);
          await packageService.updateDependencyVersion(repoPath, libPackageName, config.releaseVersion);
        }
      }

      if (depRelations.length > 0) {
        log(window, `Regenerando pnpm-lock.yaml (rm -rf node_modules pnpm-lock.yaml && pnpm i)...`);
        await packageService.refreshLockfile(repoPath, (msg) => log(window, msg));
      }

      const branchName = `feature/UpdateVersionSprint${config.releaseVersion}`;
      log(window, `Creando rama ${branchName} y realizando commit/push...`);
      await gitService.createAndCheckoutBranch(repoPath, branchName);
      await gitService.commitAndPush(repoPath, `chore: release version ${config.releaseVersion}`, branchName);

      const mrRes = await gitLabService.createMergeRequest({
        gitlabUrl: config.gitlabUrl,
        projectIdOrPath: projId,
        sourceBranch: branchName,
        targetBranch: 'develop',
        title: `#000000 [Release]: Update version to ${config.releaseVersion}`,
        labels: ['Release', 'Ready to Review'],
        reviewerName: 'CodeChecker',
        assigneeName: 'Adelys Belen',
        token: config.gitlabToken,
      });
      const mrUrl = mrRes.ok ? mrRes.value : `${config.gitlabUrl}/${projId}/-/merge_requests/new`;
      state.mrListPhase1.push({ projectId: projId, repoName, url: mrUrl });
      log(window, `✅ MR Creada exitosamente: ${mrUrl}`, 'system');
    }

    log(window, '\n==================================================', 'system');
    log(window, '🎉 FASE 1 COMPLETADA CON ÉXITO', 'system');
    log(window, 'MRs GENERADAS EN ESTA FASE:', 'system');
    state.mrListPhase1.forEach((mr) => {
      log(window, `🔗 [${mr.repoName || mr.projectId}]: ${mr.url}`, 'system');
    });
    log(window, '\nPresione el botón "Continuar 2da Fase" para proceder con la creación de ramas de release.', 'system');
    log(window, '==================================================\n', 'system');

    state.status = 'waiting_user';
    emitStatus(window, 'Fase 1 completada. Esperando confirmación para 2da Fase.');
    if (window && !window.isDestroyed()) {
      window.webContents.send('release:mrUrls', { phase: 1, mrList: state.mrListPhase1 });
    }

    return ok(undefined);
  };

  const startPhase2 = async (window: BrowserWindow | null, configOverride?: ReleaseConfig): Promise<Result<void>> => {
    const activeConfig = configOverride || state.config;
    if (!activeConfig) return err('No existe configuración activa de release.');

    state.config = activeConfig;
    state.currentPhase = 2;
    state.status = 'running';
    emitStatus(window, 'Iniciando Fase 2: Creación y Push de Ramas de Release en GitLab...');

    const releaseBranchName = `release/${activeConfig.releaseVersion}`;
    log(window, '==================================================', 'system');
    log(window, `🌿 INICIANDO FASE 2: CREACIÓN Y PUSH DE RAMA ${releaseBranchName}`, 'system');
    log(window, '==================================================', 'system');

    const reposDir = path.resolve(baseDir, 'repositories');
    for (const projId of activeConfig.projectIds) {
      const repoPath = await ensureRepoCloned(activeConfig.gitlabUrl, projId, reposDir);

      log(window, `\nCreando rama local ${releaseBranchName} en [${projId}]...`);
      const checkoutRes = await gitService.createAndCheckoutBranch(repoPath, releaseBranchName);
      if (checkoutRes.ok) {
        log(window, `Rama local ${releaseBranchName} lista en ${projId}`);
      }

      log(window, `Subiendo rama a GitLab (git push origin ${releaseBranchName})...`);
      const pushRes = await gitService.pushBranch(repoPath, releaseBranchName);

      if (pushRes.ok) {
        log(window, `✅ Rama ${releaseBranchName} subida exitosamente a GitLab para [${projId}]`, 'system');
      } else {
        log(window, `⚠️ Aviso en push para [${projId}]: ${pushRes.error}`, 'stderr');
      }
    }

    log(window, '\n==================================================', 'system');
    log(window, '🎉 FASE 2 COMPLETADA: Proceso de creación y push de ramas finalizado.', 'system');
    log(window, 'Presione el botón "Continuar 3era Etapa" para comenzar el nuevo sprint (SNAPSHOT).', 'system');
    log(window, '==================================================\n', 'system');

    state.status = 'waiting_user';
    emitStatus(window, 'Fase 2 completada. Esperando confirmación para 3era Etapa.');
    return ok(undefined);
  };

  const startPhase3 = async (window: BrowserWindow | null, configOverride?: ReleaseConfig): Promise<Result<void>> => {
    const activeConfig = configOverride || state.config;
    if (!activeConfig) return err('No existe configuración activa de release.');

    state.config = activeConfig;
    state.currentPhase = 3;
    state.status = 'running';
    emitStatus(window, 'Iniciando Fase 3: Preparación de Nuevo Sprint (SNAPSHOT Bumping)...');

    const nextSnapshot = getNextMinorSnapshot(activeConfig.releaseVersion);

    log(window, '==================================================', 'system');
    log(window, `🔄 INICIANDO FASE 3: BUMPING A NUEVO SNAPSHOT (${nextSnapshot})`, 'system');
    log(window, '==================================================', 'system');

    const reposDir = path.resolve(baseDir, 'repositories');

    const libraryIds = new Set(activeConfig.dependencies.map((d) => d.libraryId));
    const libProjects = activeConfig.projectIds.filter((id) => libraryIds.has(id));
    const nonLibProjects = activeConfig.projectIds.filter((id) => !libraryIds.has(id));

    const libraryNamesMap = new Map<string, string>();

    // 1. Librerías Primero
    for (const libId of libProjects) {
      const repoPath = await ensureRepoCloned(activeConfig.gitlabUrl, libId, reposDir);
      log(window, `\n--- Bumping Librería: ${libId} a ${nextSnapshot} ---`, 'system');

      const updateVerRes = await packageService.updateVersion(repoPath, nextSnapshot);
      if (updateVerRes.ok) {
        libraryNamesMap.set(libId, updateVerRes.value.name);
      }

      log(window, `Compilando y publicando versión SNAPSHOT...`);
      await packageService.buildAndPublishLibrary(repoPath, (msg) => log(window, msg));

      const branchName = `feature/UpdateVersionSprint${nextSnapshot}`;
      await gitService.createAndCheckoutBranch(repoPath, branchName);
      await gitService.commitAndPush(repoPath, `chore: bump version to ${nextSnapshot}`, branchName);

      const mrRes = await gitLabService.createMergeRequest({
        gitlabUrl: activeConfig.gitlabUrl,
        projectIdOrPath: libId,
        sourceBranch: branchName,
        targetBranch: 'develop',
        title: `#000000 [Release]: Update version to ${nextSnapshot}`,
        labels: ['Release', 'Ready to Review'],
        reviewerName: 'CodeChecker',
        assigneeName: 'Adelys Belen',
        token: activeConfig.gitlabToken,
      });
      const mrUrl = mrRes.ok ? mrRes.value : `${activeConfig.gitlabUrl}/${libId}/-/merge_requests/new`;
      state.mrListPhase3.push({ projectId: libId, repoName: libraryNamesMap.get(libId) || libId, url: mrUrl });
      log(window, `✅ MR Sprint Librería creada: ${mrUrl}`, 'system');
    }

    // 2. Proyectos Dependientes y Resto
    for (const projId of nonLibProjects) {
      const repoPath = await ensureRepoCloned(activeConfig.gitlabUrl, projId, reposDir);
      log(window, `\n--- Bumping Proyecto: ${projId} a ${nextSnapshot} ---`, 'system');

      const updateVerRes = await packageService.updateVersion(repoPath, nextSnapshot);
      const repoName = updateVerRes.ok ? updateVerRes.value.name : projId;

      const depRelations = activeConfig.dependencies.filter((d) => d.projectId === projId);
      for (const rel of depRelations) {
        const libPackageName = libraryNamesMap.get(rel.libraryId);
        if (libPackageName) {
          log(window, `Actualizando dependencia ${libPackageName} a versión ${nextSnapshot}...`);
          await packageService.updateDependencyVersion(repoPath, libPackageName, nextSnapshot);
        }
      }

      if (depRelations.length > 0) {
        log(window, `Actualizando pnpm-lock.yaml (rm -rf node_modules pnpm-lock.yaml && pnpm i)...`);
        await packageService.refreshLockfile(repoPath, (msg) => log(window, msg));
      }

      const branchName = `feature/UpdateVersionSprint${nextSnapshot}`;
      await gitService.createAndCheckoutBranch(repoPath, branchName);
      await gitService.commitAndPush(repoPath, `chore: bump version to ${nextSnapshot}`, branchName);

      const mrRes = await gitLabService.createMergeRequest({
        gitlabUrl: activeConfig.gitlabUrl,
        projectIdOrPath: projId,
        sourceBranch: branchName,
        targetBranch: 'develop',
        title: `#000000 [Release]: Update version to ${nextSnapshot}`,
        labels: ['Release', 'Ready to Review'],
        reviewerName: 'CodeChecker',
        assigneeName: 'Adelys Belen',
        token: activeConfig.gitlabToken,
      });
      const mrUrl = mrRes.ok ? mrRes.value : `${activeConfig.gitlabUrl}/${projId}/-/merge_requests/new`;
      state.mrListPhase3.push({ projectId: projId, repoName, url: mrUrl });
      log(window, `✅ MR Sprint Creada: ${mrUrl}`, 'system');
    }

    log(window, '\n🧹 Vaciando directorio local ./repositories/...', 'system');
    const cleanRes = await fsCleanerService.cleanRepositoriesDir(baseDir);
    log(window, cleanRes.ok ? cleanRes.value : cleanRes.error, cleanRes.ok ? 'system' : 'stderr');

    log(window, '\n==================================================', 'system');
    log(window, '🏆 PROCESO DE RELEASE COMPLETO Y EXITOSO EN SUS 3 ETAPAS', 'system');
    log(window, 'MRs DEL NUEVO SPRINT:', 'system');
    state.mrListPhase3.forEach((mr) => {
      log(window, `🔗 [${mr.repoName || mr.projectId}]: ${mr.url}`, 'system');
    });

    log(window, '\n📝 Generando reporte automático de Release en Obsidian...', 'system');
    const reportRes = await obsidianReportService.generateReport({
      config: activeConfig,
      nextSnapshot,
      mrListPhase1: state.mrListPhase1,
      mrListPhase3: state.mrListPhase3,
    });

    if (reportRes.ok) {
      log(window, `✅ Reporte de Obsidian creado exitosamente en: ${reportRes.value}`, 'system');
    } else {
      log(window, `⚠️ Aviso: No se pudo generar el reporte de Obsidian: ${reportRes.error}`, 'stderr');
    }

    log(window, '==================================================\n', 'system');

    state.status = 'success';
    emitStatus(window, 'Proceso finalizado con éxito en sus 3 etapas.');
    if (window && !window.isDestroyed()) {
      window.webContents.send('release:mrUrls', { phase: 3, mrList: state.mrListPhase3 });
    }

    return ok(undefined);
  };

  const interrupt = async (window: BrowserWindow | null): Promise<Result<void>> => {
    log(window, '\n🛑 INTERRUPCIÓN SOLICITADA POR EL USUARIO', 'stderr');
    state.status = 'interrupted';
    emitStatus(window, 'Proceso interrumpido.');
    await fsCleanerService.cleanRepositoriesDir(baseDir);
    return ok(undefined);
  };

  return {
    startPhase1,
    startPhase2,
    startPhase3,
    interrupt,
  };
};
