import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Result, ok, err } from '../../../shared/utils/resultUtils.js';

const execAsync = promisify(exec);

export const createGitService = () => {
  const runCmd = async (command: string, cwd?: string): Promise<Result<string>> => {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return ok((stdout || stderr || '').trim());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(`Fallo al ejecutar '${command}' en ${cwd || '.'}: ${message}`);
    }
  };

  const cloneRepo = async (repoUrl: string, targetPath: string): Promise<Result<string>> => {
    return runCmd(`git clone ${repoUrl} ${targetPath}`);
  };

  const createAndCheckoutBranch = async (repoPath: string, branchName: string): Promise<Result<string>> => {
    // Si la rama ya existe localmente, hacer checkout; si no, crearla
    const checkoutRes = await runCmd(`git checkout ${branchName}`, repoPath);
    if (checkoutRes.ok) return checkoutRes;

    return runCmd(`git checkout -b ${branchName}`, repoPath);
  };

  const checkoutBranch = async (repoPath: string, branchName: string): Promise<Result<string>> => {
    return runCmd(`git checkout ${branchName}`, repoPath);
  };

  const pullBranch = async (repoPath: string, branchName: string): Promise<Result<string>> => {
    return runCmd(`git pull origin ${branchName}`, repoPath);
  };

  const pushBranch = async (repoPath: string, branchName: string): Promise<Result<string>> => {
    return runCmd(`git push origin ${branchName}`, repoPath);
  };

  const commitAndPush = async (repoPath: string, message: string, branchName: string): Promise<Result<string>> => {
    const addRes = await runCmd('git add .', repoPath);
    if (!addRes.ok) return addRes;

    // Intentar hacer commit (si no hay cambios, ignorar el error del commit)
    await runCmd(`git commit -m "${message}"`, repoPath);

    // Hacer push obligatorio de la rama
    const pushRes = await pushBranch(repoPath, branchName);
    if (!pushRes.ok) return pushRes;

    return ok(`Push exitoso en rama ${branchName}`);
  };

  return {
    cloneRepo,
    createAndCheckoutBranch,
    checkoutBranch,
    pullBranch,
    pushBranch,
    commitAndPush,
  };
};
