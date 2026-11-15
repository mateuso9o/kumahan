import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/sarabun/thai-400.css'
import '@fontsource/sarabun/thai-500.css'
import '@fontsource/sarabun/thai-600.css'
import '@fontsource/sarabun/thai-700.css'
import '@fontsource/sarabun/thai-800.css'
import '@fontsource/sarabun/latin-400.css'
import '@fontsource/sarabun/latin-600.css'
import '@fontsource/sarabun/latin-700.css'
import '@fontsource/sarabun/latin-800.css'
import './ui/styles.css'
import App from './App.tsx'
import { requestPersistentStorage } from './ui/storage'

void requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
