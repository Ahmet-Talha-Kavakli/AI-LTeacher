export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "ai-lteacher-web",
    timestamp: new Date().toISOString(),
  });
}
