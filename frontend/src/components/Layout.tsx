import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">GymTracker</h1>
          {user && (
            <div className="user-menu">
              <img
                src={user.photoURL || "/default-avatar.png"}
                alt="Profile"
                className="avatar"
              />
              <button onClick={signOut} className="sign-out-btn">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      {user && (
        <nav className="bottom-nav">
          <NavLink to="/" className="nav-item">
            <span className="nav-icon">🏋️</span>
            <span className="nav-label">Workout</span>
          </NavLink>
          <NavLink to="/exercises" className="nav-item">
            <span className="nav-icon">📋</span>
            <span className="nav-label">Exercises</span>
          </NavLink>
          <NavLink to="/routines" className="nav-item">
            <span className="nav-icon">📅</span>
            <span className="nav-label">Routines</span>
          </NavLink>
          <NavLink to="/history" className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-label">History</span>
          </NavLink>
          <NavLink to="/profile" className="nav-item">
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
