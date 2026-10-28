// One Lambda behind API Gateway, routed by event.routeKey:
//   GET    /items        -> list the signed-in user's items
//   POST   /items        -> add an item   { "text": "..." }
//   DELETE /items/{id}   -> delete one of the user's items
//
// API Gateway's JWT authorizer (Cognito) rejects unauthenticated calls before
// this code runs, and every query is scoped to the caller's Cognito "sub",
// so users can only ever see or change their own data.
// CORS is configured on the API in template.yml, so no CORS headers here.

import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME;
const MAX_TEXT = 200;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const toPublic = ({ itemId, text, createdAt }) => ({ id: itemId, text, createdAt });

async function listItems(userId) {
  const { Items = [] } = await db.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
      ScanIndexForward: false, // newest first (itemId starts with a timestamp)
      Limit: 100,
    })
  );
  return json(200, { items: Items.map(toPublic) });
}

async function addItem(userId, event) {
  let body;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64").toString("utf-8")
      : event.body ?? "{}";
    body = JSON.parse(raw);
  } catch {
    return json(400, { message: "Invalid JSON body" });
  }

  const text = String(body.text ?? "").trim();
  if (!text) return json(400, { message: "Text is required" });
  if (text.length > MAX_TEXT) {
    return json(400, { message: `Text must be ${MAX_TEXT} characters or fewer` });
  }

  const item = {
    userId,
    itemId: `${Date.now().toString().padStart(13, "0")}-${randomUUID().slice(0, 8)}`,
    text,
    createdAt: new Date().toISOString(),
  };
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(itemId)",
    })
  );
  return json(201, { item: toPublic(item) });
}

async function deleteItem(userId, id) {
  if (!id || id.length > 100) return json(400, { message: "Invalid item id" });
  await db.send(
    new DeleteCommand({ TableName: TABLE, Key: { userId, itemId: id } })
  );
  return json(200, { deleted: id });
}

export const handler = async (event) => {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!userId) return json(401, { message: "Unauthorized" });

  const route = event.routeKey;
  // Shows up in CloudWatch Logs: /aws/lambda/<ProjectName>-api
  console.log(JSON.stringify({ type: "user_activity", route, userId }));

  try {
    switch (route) {
      case "GET /items":
        return await listItems(userId);
      case "POST /items":
        return await addItem(userId, event);
      case "DELETE /items/{id}":
        return await deleteItem(userId, event.pathParameters?.id);
      default:
        return json(404, { message: "Not found" });
    }
  } catch (err) {
    console.error(err);
    return json(500, { message: "Internal error" });
  }
};
