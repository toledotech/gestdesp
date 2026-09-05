import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;

// Desabilitado até você criar o projeto no Sentry e preencher VITE_SENTRY_DSN
// no .env — sem isso, roda normal, só sem monitoramento de erro.
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    environment: import.meta.env.MODE,
  });
}

export { Sentry };
