import * as Sentry from "@sentry/tanstackstart-react";

try {
  Sentry.init({
    dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
    sendDefaultPii: true,
  });
} catch (err) {
  Sentry.captureException(err);
  throw err;
}
