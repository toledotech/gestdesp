import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Sentry } from './lib/sentry'

function ErrorFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Algo deu errado</h1>
        <p style={{ marginTop: 8, color: '#666' }}>Tente recarregar a página.</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 16px' }}>
          Recarregar
        </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
