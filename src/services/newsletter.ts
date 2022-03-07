import Toucan from "toucan-js";
import { ServiceError } from "../common";

const MAILERLITE_API = "https://api.mailerlite.com/api/v2/subscribers";

export enum NewsletterErrorType {
  UNEXPECTED = "unexpected",
  MISSING_EMAIL = "missing_email",
  NOT_VALID = "not_valid",
  SUBSCRIPTION = "subscription",
}

export async function newsletterHandler(
  requestUrl: URL,
  request: Request,
  sentry: Toucan
): Promise<Response> {
  if (
    request.method !== "POST" ||
    requestUrl.pathname !== "/newsletter/signup" ||
    !(request.headers.get("content-type") || "").includes("form")
  ) {
    throw new ServiceError(
      "Invalid request",
      NewsletterErrorType.NOT_VALID,
      400
    );
  }
  const formData = await request.formData();

  if (!formData.has("email")) {
    throw new ServiceError(
      "Missing email param",
      NewsletterErrorType.MISSING_EMAIL,
      400
    );
  }

  const email = formData.get("email").toString();

  sentry.setUser({ email });

  const response = await fetch(MAILERLITE_API, {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: {
      "Content-Type": "application/json",
      "X-MailerLite-ApiKey": MAILERLITE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new ServiceError(
      "Could not subscribe",
      NewsletterErrorType.SUBSCRIPTION
    );
  }

  return new Response(SUCCESS_MESSAGE, {
    status: 201,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/html",
    },
  });
}

export const SUCCESS_MESSAGE = `
<html>
  <head>
    <title>Success</title>
  </head>
  <body>
    <p>You are now subscribed to the Home Assistant Newsletter 🎉</p>
    <button onclick="window.close();">Close</button>
  </body>
</html>
`;