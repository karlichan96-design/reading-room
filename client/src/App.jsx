import { Link, Outlet } from 'react-router-dom';
import './App.css';

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark">&#128214;</span>
          <span>The Reading Room</span>
        </Link>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
