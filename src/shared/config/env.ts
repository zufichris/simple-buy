/**
 * Retrieves the value of the specified environment variable.
 *
 * @param key - The name of the environment variable to retrieve.
 * @returns The value of the environment variable as a string.
 *
 * @throws {Error} If the environment variable {@link key} is not set or is falsy.
 */
export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}
