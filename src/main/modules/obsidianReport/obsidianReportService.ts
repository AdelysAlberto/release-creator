import fs from 'node:fs';
import path from 'node:path';
import { Result, ok, err } from '../../../shared/utils/resultUtils.js';
import type { MrUrlItem, ReleaseConfig } from '../../../types/global.d.ts';

export interface ObsidianReportParams {
  config: ReleaseConfig;
  nextSnapshot: string;
  mrListPhase1: MrUrlItem[];
  mrListPhase3: MrUrlItem[];
  obsidianVaultPath?: string;
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const createObsidianReportService = () => {
  const generateReport = async (params: ObsidianReportParams): Promise<Result<string>> => {
    try {
      const vaultPath =
        params.obsidianVaultPath || '/home/adalbeca/Documents/Obsidian/CEBOR/2026';
      const now = new Date();

      const year = now.getFullYear();
      const monthIndex = now.getMonth();
      const monthName = MONTH_NAMES_ES[monthIndex];
      const dayNum = now.getDate();
      const dayStr = String(dayNum).padStart(2, '0');
      const monthNumStr = String(monthIndex + 1).padStart(2, '0');

      const monthDir = path.join(vaultPath, monthName);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }

      const fileName = `${year}-${monthNumStr}-${dayStr}.md`;
      const filePath = path.join(monthDir, fileName);

      const releaseVersion = params.config.releaseVersion;
      const nextSnapshot = params.nextSnapshot;

      const repoNamesList = params.mrListPhase1.map((m) => m.repoName || m.projectId);
      const repoNamesStr = repoNamesList.join(', ') || 'Proyectos del Release';

      let content = `# ${dayNum} ${monthName}, Release generada v${releaseVersion}\n\n`;

      content += `\`\`\`toc\n`;
      content += `Generada release/${releaseVersion} en ${repoNamesStr}\n`;
      content += `Generada snapshot ${nextSnapshot} en ${repoNamesStr}\n`;
      content += `Desplegando en Dev ${repoNamesStr}\n`;
      content += `\`\`\`\n\n`;

      content += `## 📧 Mensaje para Correo Electrónico\n\n`;
      content += `\`\`\`text\n`;
      content += `Buenas tardes,\n\n`;
      content += `La release de la versión v${releaseVersion} ya está disponible bajo el nombre de rama:\n\n`;
      content += `release/${releaseVersion}\n\n`;
      content += `En los siguientes desarrollos / componentes:\n`;
      params.mrListPhase1.forEach((mr) => {
        content += `- ${mr.repoName || mr.projectId}\n`;
      });
      content += `\nResumen:\n`;
      content += `- Versión del sistema (Release): ${releaseVersion}\n`;
      content += `- Versión Snapshot desplegada en Dev: ${nextSnapshot}\n\n`;
      content += `También se ha desplegado en Dev el snapshot ${nextSnapshot}, de la nueva release que ha comenzado hoy.\n\n`;
      content += `Gracias\nSaludos\n`;
      content += `\`\`\`\n\n`;

      content += `## 💬 Mensaje para Teams (Notificación al Equipo)\n\n`;
      content += `\`\`\`markdown\n`;
      content += `### 🚀 Release Generada - v${releaseVersion}\n\n`;
      content += `Estimado equipo, se ha completado exitosamente la publicación y despliegue de la release **v${releaseVersion}**.\n\n`;
      content += `- 📌 **Rama de Release**: \`release/${releaseVersion}\`\n`;
      content += `- 🔄 **Rama de Inicio de Sprint (SNAPSHOT)**: \`feature/UpdateVersionSprint${nextSnapshot}\` (\`${nextSnapshot}\`)\n\n`;
      content += `**Merge Requests listas para revisión:**\n`;
      params.mrListPhase1.forEach((mr) => {
        content += `- **${mr.repoName || mr.projectId}**: [Ver MR en GitLab](${mr.url})\n`;
      });
      if (params.mrListPhase3.length > 0) {
        content += `\n**Merge Requests de Bumping (SNAPSHOT ${nextSnapshot}):**\n`;
        params.mrListPhase3.forEach((mr) => {
          content += `- **${mr.repoName || mr.projectId}**: [Ver MR en GitLab](${mr.url})\n`;
        });
      }
      content += `\n¡Gracias a todos por el esfuerzo!\n`;
      content += `\`\`\`\n\n`;

      content += `## 📋 Tabla de Pasos y Merge Requests\n\n`;
      content += `| Step | Release / Branch | Repositorio | Links MR |\n`;
      content += `| :--- | :--- | :--- | :--- |\n`;

      params.mrListPhase1.forEach((mr) => {
        content += `| Step 1 (Release MR) | \`feature/UpdateVersionSprint${releaseVersion}\` | ${mr.repoName || mr.projectId} | [${mr.url}](${mr.url}) |\n`;
      });

      content += `| Step 2 (Release Branch) | \`release/${releaseVersion}\` | Todos los proyectos | Rama remota creada |\n`;

      params.mrListPhase3.forEach((mr) => {
        content += `| Step 3 (Snapshot MR) | \`feature/UpdateVersionSprint${nextSnapshot}\` | ${mr.repoName || mr.projectId} | [${mr.url}](${mr.url}) |\n`;
      });

      fs.writeFileSync(filePath, content, 'utf-8');
      return ok(filePath);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(`Error generando reporte de Obsidian: ${message}`);
    }
  };

  return {
    generateReport,
  };
};
