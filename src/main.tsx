import { createRoot } from 'react-dom/client'
import '@fontsource/cinzel/latin-500.css'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource/cinzel/latin-700.css'
import '@fontsource/crimson-pro/latin-400.css'
import '@fontsource/crimson-pro/latin-400-italic.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import App from './app/App'
import './ui/styles.css'

createRoot(document.getElementById('root')!).render(<App/>)
