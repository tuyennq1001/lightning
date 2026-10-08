import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SidePanel from './pages/SidePanel'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SidePanel />
  </StrictMode>,
)
