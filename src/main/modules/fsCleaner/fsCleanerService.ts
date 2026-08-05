import fs from 'node:fs/promises';
import path from 'node:path';
import { Result, ok, err } from '../../../shared/utils/resultUtils.js';

export const createFsCleanerService = () => {
  const cleanRepositoriesDir = async (baseDir: string): Promise<Result<string>> => {
    const reposPath = path.resolve(baseDir, 'repositories');
    try {
      await fs.mkdir(reposPath, { recursive: true });
      const entries = await fs.readdir(reposPath);
      for (const entry of entries) {
        const fullPath = path.join(reposPath, entry);
        await fs.rm(fullPath, { recursive: true, force: true });
      }
      return ok(`Directorio ${reposPath} limpiado correctamente.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(`Error al limpiar el directorio ${reposPath}: ${message}`);
    }
  };

  return {
    cleanRepositoriesDir,
  };
};
