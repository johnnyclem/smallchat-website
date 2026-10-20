import { exportLedger } from "../../src/server/handlers";

export function GET(request: Request): Promise<Response> {
  return exportLedger(request);
}
