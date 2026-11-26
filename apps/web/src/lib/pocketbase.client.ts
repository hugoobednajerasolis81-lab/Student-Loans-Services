import PocketBase from "pocketbase";

const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL?.trim();

export const pb = pocketBaseUrl ? new PocketBase(pocketBaseUrl) : null;

export function pocketBaseSetupMessage() {
  return "PocketBase is not configured. Set VITE_POCKETBASE_URL in the web application's environment.";
}
