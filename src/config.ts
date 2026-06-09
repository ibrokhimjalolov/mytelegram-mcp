import { readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { z } from "zod";

const accountSchema = z.object({
  label: z.string().min(1),
  phone: z.string().min(1),
  sessionFile: z.string().min(1),
  apiId: z.number().int().positive().optional(),
  apiHash: z.string().min(1).optional(),
});

const rawConfigSchema = z.object({
  apiId: z.number().int().positive().optional(),
  apiHash: z.string().min(1).optional(),
  defaultAccount: z.string().min(1).optional(),
  accounts: z.array(accountSchema).min(1),
});

/** A fully-resolved account: credentials filled in, session path absolute. */
export interface ResolvedAccount {
  label: string;
  phone: string;
  sessionFile: string;
  apiId: number;
  apiHash: string;
}

export interface Config {
  defaultAccount: string;
  accounts: ResolvedAccount[];
}

/**
 * Validate a raw config object and resolve it: apply top-level api credentials as
 * per-account defaults, resolve session paths relative to `configDir`, enforce unique
 * labels, and pick the default account. Pure (no filesystem) so it is easy to test.
 */
export function resolveConfig(raw: unknown, configDir: string): Config {
  let parsed: z.infer<typeof rawConfigSchema>;
  try {
    parsed = rawConfigSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const detail = err.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      throw new Error(`Invalid config: ${detail}`);
    }
    throw err;
  }

  const seen = new Set<string>();
  const accounts: ResolvedAccount[] = parsed.accounts.map((a) => {
    if (seen.has(a.label)) {
      throw new Error(`Duplicate account label '${a.label}' in config.`);
    }
    seen.add(a.label);

    const apiId = a.apiId ?? parsed.apiId;
    const apiHash = a.apiHash ?? parsed.apiHash;
    if (apiId === undefined || apiHash === undefined) {
      throw new Error(
        `Account '${a.label}' is missing apiId/apiHash. Set them on the account or at the top level of the config.`,
      );
    }

    return {
      label: a.label,
      phone: a.phone,
      apiId,
      apiHash,
      sessionFile: isAbsolute(a.sessionFile)
        ? a.sessionFile
        : resolve(configDir, a.sessionFile),
    };
  });

  const defaultAccount = parsed.defaultAccount ?? accounts[0].label;
  if (!accounts.some((a) => a.label === defaultAccount)) {
    throw new Error(
      `defaultAccount '${defaultAccount}' does not match any configured account.`,
    );
  }

  return { defaultAccount, accounts };
}

/** Read and resolve a config file from disk. */
export function loadConfig(configPath: string): Config {
  const absPath = resolve(configPath);
  let text: string;
  try {
    text = readFileSync(absPath, "utf8");
  } catch {
    throw new Error(`Cannot read config file at '${absPath}'.`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error(`Config file '${absPath}' is not valid JSON: ${(e as Error).message}`);
  }
  return resolveConfig(raw, dirname(absPath));
}

/** Resolve a tool's optional `account` param to a concrete account (default if omitted). */
export function selectAccount(config: Config, label?: string): ResolvedAccount {
  const target = label ?? config.defaultAccount;
  const acc = config.accounts.find((a) => a.label === target);
  if (!acc) {
    throw new Error(
      `Unknown account '${target}'. Configured accounts: ${config.accounts.map((a) => a.label).join(", ")}.`,
    );
  }
  return acc;
}
