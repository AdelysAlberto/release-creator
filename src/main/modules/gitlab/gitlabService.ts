import axios from 'axios';
import { Result, ok, err } from '../../../shared/utils/resultUtils.js';

export interface GitLabProjectDetails {
  id: string | number;
  name: string;
  pathWithNamespace: string;
  httpUrlToRepo: string;
  webUrl: string;
}

export interface CreateMergeRequestOptions {
  gitlabUrl: string;
  projectIdOrPath: string;
  sourceBranch: string;
  targetBranch: string;
  title: string;
  labels?: string[];
  reviewerName?: string;
  assigneeName?: string;
  token?: string;
}

export const createGitLabService = () => {
  /**
   * Normaliza cualquier entrada (URL completa, path con slashes o ID numérico)
   */
  const normalizeProjectIdentifier = (input: string, gitlabUrl: string): string => {
    let clean = input.trim();
    const cleanBaseUrl = gitlabUrl.trim().replace(/\/+$/, '');

    // Si la entrada empieza con la URL base de gitlab
    if (clean.startsWith(cleanBaseUrl)) {
      clean = clean.replace(cleanBaseUrl, '');
    } else if (clean.startsWith('http://') || clean.startsWith('https://')) {
      // Si empieza con otro protocolo o dominio, extraer solo el path
      try {
        const parsed = new URL(clean);
        clean = parsed.pathname;
      } catch {
        // Ignorar si falla el parsing
      }
    }

    // Remover .git y barras iniciales/finales
    clean = clean.replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
    return clean;
  };

  /**
   * Busca el ID numérico de un usuario por su nombre o username en GitLab
   */
  const findUserId = async (
    gitlabUrl: string,
    query: string,
    token: string
  ): Promise<number | null> => {
    try {
      const cleanBaseUrl = gitlabUrl.trim().replace(/\/+$/, '');
      const response = await axios.get(`${cleanBaseUrl}/api/v4/users`, {
        headers: { 'PRIVATE-TOKEN': token },
        params: { search: query },
      });
      if (Array.isArray(response.data) && response.data.length > 0) {
        const lowerQuery = query.toLowerCase();
        const exact = response.data.find(
          (u: { username?: string; name?: string; id?: number }) =>
            u.username?.toLowerCase() === lowerQuery ||
            u.name?.toLowerCase() === lowerQuery
        );
        return exact ? exact.id : response.data[0].id;
      }
    } catch {
      // Ignorar error en búsqueda de usuario
    }
    return null;
  };

  /**
   * Obtiene detalles del proyecto de GitLab o genera un fallback si no hay token/conexion API
   */
  const getProjectDetails = async (
    gitlabUrl: string,
    projectIdOrPath: string,
    token?: string
  ): Promise<Result<GitLabProjectDetails>> => {
    const cleanBaseUrl = gitlabUrl.trim().replace(/\/+$/, '');
    const normalized = normalizeProjectIdentifier(projectIdOrPath, gitlabUrl);

    try {
      if (token) {
        const endpoint = `${cleanBaseUrl}/api/v4/projects/${encodeURIComponent(normalized)}`;
        const response = await axios.get(endpoint, {
          headers: { 'PRIVATE-TOKEN': token },
        });

        const data = response.data;
        return ok({
          id: data.id,
          name: data.name || data.path,
          pathWithNamespace: data.path_with_namespace || normalized,
          httpUrlToRepo: data.http_url_to_repo || `${cleanBaseUrl}/${normalized}.git`,
          webUrl: data.web_url || `${cleanBaseUrl}/${normalized}`,
        });
      }
    } catch {
      // Si la API falla o no requiere token, se prosigue con el fallback
    }

    // Fallback derivado del path
    const parts = normalized.split('/');
    const repoName = parts[parts.length - 1] || normalized;

    return ok({
      id: normalized,
      name: repoName,
      pathWithNamespace: normalized,
      httpUrlToRepo: `${cleanBaseUrl}/${normalized}.git`,
      webUrl: `${cleanBaseUrl}/${normalized}`,
    });
  };

  const createMergeRequest = async (
    optionsOrGitlabUrl: CreateMergeRequestOptions | string,
    projectIdOrPath?: string,
    sourceBranch?: string,
    targetBranch?: string,
    title?: string,
    token?: string
  ): Promise<Result<string>> => {
    let opts: CreateMergeRequestOptions;
    if (typeof optionsOrGitlabUrl === 'string') {
      opts = {
        gitlabUrl: optionsOrGitlabUrl,
        projectIdOrPath: projectIdOrPath || '',
        sourceBranch: sourceBranch || '',
        targetBranch: targetBranch || '',
        title: title || '',
        token,
      };
    } else {
      opts = optionsOrGitlabUrl;
    }

    const {
      gitlabUrl,
      projectIdOrPath: projId,
      sourceBranch: srcBranch,
      targetBranch: tgtBranch,
      title: mrTitle,
      labels = [],
      reviewerName,
      assigneeName,
      token: apiToken,
    } = opts;

    const cleanBaseUrl = gitlabUrl.trim().replace(/\/+$/, '');
    const normalized = normalizeProjectIdentifier(projId, gitlabUrl);

    try {
      if (apiToken) {
        const endpoint = `${cleanBaseUrl}/api/v4/projects/${encodeURIComponent(normalized)}/merge_requests`;

        let reviewerId: number | null = null;
        let assigneeId: number | null = null;

        if (reviewerName) {
          reviewerId = await findUserId(gitlabUrl, reviewerName, apiToken);
        }
        if (assigneeName) {
          assigneeId = await findUserId(gitlabUrl, assigneeName, apiToken);
        }

        const payload: Record<string, unknown> = {
          source_branch: srcBranch,
          target_branch: tgtBranch,
          title: mrTitle,
        };

        if (labels.length > 0) {
          payload.labels = labels.join(', ');
        }
        if (reviewerId !== null) {
          payload.reviewer_ids = [reviewerId];
        }
        if (assigneeId !== null) {
          payload.assignee_id = assigneeId;
          payload.assignee_ids = [assigneeId];
        }

        const response = await axios.post(endpoint, payload, {
          headers: { 'PRIVATE-TOKEN': apiToken },
        });

        return ok(response.data.web_url || `${cleanBaseUrl}/${normalized}/-/merge_requests/new`);
      }
    } catch (error: unknown) {
      if (apiToken) {
        // Si falló por conflicto u otro error, verificar si la MR ya existe abierta para esta rama
        try {
          const existingRes = await axios.get(
            `${cleanBaseUrl}/api/v4/projects/${encodeURIComponent(normalized)}/merge_requests`,
            {
              headers: { 'PRIVATE-TOKEN': apiToken },
              params: { source_branch: srcBranch, state: 'opened' },
            }
          );
          if (Array.isArray(existingRes.data) && existingRes.data.length > 0 && existingRes.data[0].web_url) {
            return ok(existingRes.data[0].web_url);
          }
        } catch {
          // Ignorar error al buscar MR existente
        }
      }
      const message = error instanceof Error ? error.message : String(error);
      return err(`Error creando MR en GitLab para el proyecto ${projId}: ${message}`);
    }

    // Fallback URL para interfaz web
    const queryParams: string[] = [
      `merge_request%5Bsource_branch%5D=${encodeURIComponent(srcBranch)}`,
      `merge_request%5Btarget_branch%5D=${encodeURIComponent(tgtBranch)}`,
      `merge_request%5Btitle%5D=${encodeURIComponent(mrTitle)}`,
    ];

    for (const l of labels) {
      queryParams.push(`merge_request%5Blabel_name%5D%5B%5D=${encodeURIComponent(l)}`);
    }
    if (assigneeName) {
      queryParams.push(`merge_request%5Bassignee_username%5D=${encodeURIComponent(assigneeName)}`);
    }
    if (reviewerName) {
      queryParams.push(`merge_request%5Breviewer_username%5D=${encodeURIComponent(reviewerName)}`);
    }

    const mrWebUrl = `${cleanBaseUrl}/${normalized}/-/merge_requests/new?${queryParams.join('&')}`;
    return ok(mrWebUrl);
  };

  return {
    normalizeProjectIdentifier,
    getProjectDetails,
    createMergeRequest,
  };
};
