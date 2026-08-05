import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Result, ok, err } from '../../../shared/utils/resultUtils.js';

const execAsync = promisify(exec);

export interface PackageJsonData {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

export const createPackageJsonService = () => {
  const readPackageJson = async (repoPath: string): Promise<Result<PackageJsonData>> => {
    try {
      const filePath = path.join(repoPath, 'package.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as PackageJsonData;
      return ok(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(`Fallo al leer package.json en ${repoPath}: ${message}`);
    }
  };

  const writePackageJson = async (repoPath: string, data: PackageJsonData): Promise<Result<void>> => {
    try {
      const filePath = path.join(repoPath, 'package.json');
      await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      return ok(undefined);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(`Fallo al escribir package.json en ${repoPath}: ${message}`);
    }
  };

  const updateVersion = async (repoPath: string, newVersion: string): Promise<Result<PackageJsonData>> => {
    const readRes = await readPackageJson(repoPath);
    if (!readRes.ok) return readRes;

    const data = readRes.value;
    data.version = newVersion;

    const writeRes = await writePackageJson(repoPath, data);
    if (!writeRes.ok) return writeRes;

    return ok(data);
  };

  const updateDependencyVersion = async (
    repoPath: string,
    libraryName: string,
    newVersion: string
  ): Promise<Result<PackageJsonData>> => {
    const readRes = await readPackageJson(repoPath);
    if (!readRes.ok) return readRes;

    const data = readRes.value;
    let updated = false;

    if (data.dependencies && data.dependencies[libraryName]) {
      data.dependencies[libraryName] = newVersion;
      updated = true;
    }

    if (data.devDependencies && data.devDependencies[libraryName]) {
      data.devDependencies[libraryName] = newVersion;
      updated = true;
    }

    if (updated) {
      const writeRes = await writePackageJson(repoPath, data);
      if (!writeRes.ok) return writeRes;
    }

    return ok(data);
  };

  const executeCommand = async (
    repoPath: string,
    command: string,
    onLog?: (line: string) => void
  ): Promise<Result<string>> => {
    try {
      if (onLog) onLog(`Ejecutando en ${path.basename(repoPath)}: ${command}`);
      const { stdout, stderr } = await execAsync(command, { cwd: repoPath });
      const output = (stdout || stderr || '').trim();
      if (onLog && output) onLog(output);
      return ok(output);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(`Fallo en comando '${command}' en ${repoPath}: ${message}`);
    }
  };

  const refreshLockfile = async (repoPath: string, onLog?: (line: string) => void): Promise<Result<string>> => {
    const cmd = 'rm -rf node_modules pnpm-lock.yaml && pnpm i';
    return executeCommand(repoPath, cmd, onLog);
  };

  const buildAndPublishLibrary = async (repoPath: string, onLog?: (line: string) => void): Promise<Result<string>> => {
    const buildRes = await executeCommand(repoPath, 'pnpm build:lib', onLog);
    if (!buildRes.ok) return buildRes;

    const publishRes = await executeCommand(repoPath, 'pnpm build:prod', onLog);
    if (!publishRes.ok) return publishRes;

    return ok('Librería compilada y publicada exitosamente.');
  };

  return {
    readPackageJson,
    writePackageJson,
    updateVersion,
    updateDependencyVersion,
    executeCommand,
    refreshLockfile,
    buildAndPublishLibrary,
  };
};
