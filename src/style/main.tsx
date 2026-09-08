import { createRoot } from 'react-dom/client';
import '../theme.css';
import '../sections/sections.css';
import '../flows/flows.css';
import './style.css';
import { StyleTile } from './StyleTile';

createRoot(document.getElementById('root')!).render(<StyleTile />);
