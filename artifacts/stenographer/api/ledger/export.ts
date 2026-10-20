import { exportLedger } from "../../src/server/handlers.js";

export function GET(request: Request): Promise<Response> {
  return exportLedger(request);
}
