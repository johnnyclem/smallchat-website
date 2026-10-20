import { actOnLedger } from "../../src/server/handlers.js";

export function POST(request: Request): Promise<Response> {
  return actOnLedger(request);
}

export function OPTIONS(request: Request): Promise<Response> {
  return actOnLedger(request);
}
