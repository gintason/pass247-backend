import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// NOTE: stylesheets are imported in App.jsx so the cascade order is
// controlled in one place. index.css must load AFTER bootstrap, or
// Bootstrap's heading sizes and body styles override the base layer.

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
