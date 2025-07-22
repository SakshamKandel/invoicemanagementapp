import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import process from 'process'
import './index.css'
import App from './App.jsx'

// Polyfills for PDFKit
window.Buffer = Buffer
window.process = process
if (!window.global) {
  window.global = globalThis
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
