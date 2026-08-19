import type {BrowserWindow} from 'electron';
import type {JenkinsBuildResult, JenkinsDeployPayload} from '../../../types/global.d.ts';
import {createTerminalStreamService} from '../terminalStream/terminalStreamService.js';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const authHeader = (user: string, token: string) =>
  `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`;

export const createJenkinsService = () => {
  const terminalStream = createTerminalStreamService();

  const log = (window: BrowserWindow | null, text: string, stream: 'stdout' | 'stderr' | 'system' = 'stdout') => {
    terminalStream.emitLog(window, text, stream);
  };

  const getCrumb = async (jenkinsUrl: string, user: string, token: string) => {
    try {
      const res = await fetch(`${jenkinsUrl}/crumbIssuer/api/json`, {
        headers: { Authorization: authHeader(user, token) },
      });
      if (res.status === 401) return { authFailed: true } as const;
      if (!res.ok) return { skipped: true } as const;
      const data = await res.json() as { crumbRequestField: string; crumb: string };
      return { field: data.crumbRequestField, value: data.crumb };
    } catch {
      return { skipped: true } as const;
    }
  };

  const httpErrorMessage = (status: number, job: string): string => {
    if (status === 401) return 'Credenciales inválidas (401) — verifica usuario y API Token en ⚙ Configurar Scripts → Jenkins';
    if (status === 403) return 'Sin permiso para ejecutar el job (403) — verifica permisos del usuario en Jenkins';
    if (status === 404) return `Job no encontrado (404) — verifica el nombre del job: "${job}"`;
    return `Jenkins respondió con estado ${status}`;
  };

  const triggerDeploy = async (
    window: BrowserWindow | null,
    payload: JenkinsDeployPayload
  ): Promise<JenkinsBuildResult> => {
    const { jenkinsUrl, jenkinsUser, jenkinsToken, jenkinsJob, branch, environment } = payload;

    log(window, '\n==================================================', 'system');
    log(window, `🔧 JENKINS DEPLOY: ${jenkinsJob}`, 'system');
    log(window, `   Rama: ${branch} | Entorno: ${environment}`, 'system');
    log(window, '==================================================', 'system');

    const crumb = await getCrumb(jenkinsUrl, jenkinsUser, jenkinsToken);
    if ('authFailed' in crumb) {
      const msg = httpErrorMessage(401, jenkinsJob);
      log(window, `❌ ${msg}`, 'stderr');
      return { ok: false, error: msg };
    }
    if ('skipped' in crumb) {
      log(window, 'ℹ CSRF crumb no disponible (CSRF puede estar deshabilitado)', 'system');
    } else {
      log(window, '✅ CSRF crumb obtenido', 'system');
    }

    const params = new URLSearchParams({ branch, environment });
    const triggerUrl = `${jenkinsUrl}/job/${encodeURIComponent(jenkinsJob)}/buildWithParameters?${params}`;

    let queueLocation: string | null = null;
    try {
      const headers: Record<string, string> = { Authorization: authHeader(jenkinsUser, jenkinsToken) };
      if (!('authFailed' in crumb) && !('skipped' in crumb)) headers[crumb.field] = crumb.value;

      log(window, `Disparando build en Jenkins...`);
      const res = await fetch(triggerUrl, { method: 'POST', headers });

      if (res.status !== 201 && res.status !== 200) {
        const msg = httpErrorMessage(res.status, jenkinsJob);
        log(window, `❌ ${msg}`, 'stderr');
        return { ok: false, error: msg };
      }
      queueLocation = res.headers.get('Location');
      log(window, `✅ Build encolado. Queue: ${queueLocation}`, 'system');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log(window, `❌ Error de conexión con Jenkins: ${msg}`, 'stderr');
      return { ok: false, error: msg };
    }

    if (!queueLocation) return { ok: false, error: 'Jenkins no devolvió URL de cola' };

    // Poll queue until build starts
    log(window, `Esperando inicio del build en la cola...`);
    const queueApiUrl = queueLocation.endsWith('/') ? `${queueLocation}api/json` : `${queueLocation}/api/json`;
    let buildUrl: string | null = null;

    for (let i = 0; i < 30; i++) {
      await sleep(3000);
      try {
        const res = await fetch(queueApiUrl, { headers: { Authorization: authHeader(jenkinsUser, jenkinsToken) } });
        const data = await res.json() as { executable?: { url: string; number: number } };
        if (data.executable?.url) {
          buildUrl = data.executable.url;
          log(window, `✅ Build #${data.executable.number} iniciado: ${buildUrl}`, 'system');
          break;
        }
      } catch {
        // continue polling
      }
    }

    if (!buildUrl) return { ok: false, error: 'Timeout esperando que el build inicie' };

    // Poll build result + stream console log
    log(window, `Monitoreando build en progreso...`, 'system');
    let logStart = 0;

    for (let i = 0; i < 120; i++) {
      await sleep(5000);

      try {
        const logRes = await fetch(`${buildUrl}logText/progressiveText?start=${logStart}`, {
          headers: { Authorization: authHeader(jenkinsUser, jenkinsToken) },
        });
        const text = await logRes.text();
        const newStart = logRes.headers.get('X-Text-Size');
        if (newStart) logStart = parseInt(newStart, 10);
        if (text.trim()) log(window, text.trim());
      } catch {
        // ignore log stream errors
      }

      try {
        const res = await fetch(`${buildUrl}api/json`, {
          headers: { Authorization: authHeader(jenkinsUser, jenkinsToken) },
        });
        const data = await res.json() as { result: string | null; building: boolean };

        if (!data.building && data.result) {
          const success = data.result === 'SUCCESS';
          log(window, `\n${success ? '✅' : '❌'} Build finalizado: ${data.result}`, success ? 'system' : 'stderr');
          log(window, '==================================================\n', 'system');
          return { ok: success, result: data.result, buildUrl };
        }
      } catch {
        // continue polling
      }
    }

    return { ok: false, error: 'Timeout esperando resultado del build' };
  };

  return { triggerDeploy };
};
