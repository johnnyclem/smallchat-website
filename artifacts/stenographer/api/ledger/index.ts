import { readLedger } from "../../src/server/handlers";

export function GET(request: Request): Promise<Response> {
  return readLedger(request);
}
