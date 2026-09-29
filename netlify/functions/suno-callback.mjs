// SunoAPI requires a callBackUrl on every task. The app polls for results instead,
// so this endpoint only needs to acknowledge the POST with a 200 and discard it.
export default async () =>
  new Response(JSON.stringify({ status: "received" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
