// Invoked only when the React app POSTs to the Function URL (i.e. on a user
// action such as a button click) - never on page load.
// CORS is configured on the Function URL in template.yml, so no CORS
// headers are set here (setting both would produce duplicate headers).

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const method = event.requestContext?.http?.method;
  if (method !== "POST") {
    return json(405, { message: "Method not allowed" });
  }

  let payload = {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64").toString("utf-8")
      : event.body ?? "{}";
    payload = JSON.parse(raw);
  } catch {
    return json(400, { message: "Invalid JSON body" });
  }

  const action = String(payload.action ?? "unknown").slice(0, 50);
  const name = String(payload.name ?? "").trim().slice(0, 40);
  const receivedAt = new Date().toISOString();

  // Shows up in CloudWatch Logs: /aws/lambda/<ProjectName>-activity
  console.log(
    JSON.stringify({
      type: "user_activity",
      action,
      name: name || null,
      page: String(payload.page ?? "").slice(0, 100),
      sourceIp: event.requestContext?.http?.sourceIp,
      userAgent: event.requestContext?.http?.userAgent,
      receivedAt,
    })
  );

  return json(200, {
    message: name ? `Hello, ${name}! Lambda received your click.` : "Hello! Lambda received your click.",
    action,
    receivedAt,
  });
};
