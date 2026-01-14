import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { RoutinesPage } from "./pages/RoutinesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ProfilePage } from "./pages/ProfilePage";
import "./App.css";

function AppContent() {
  const { getIdToken } = useAuth();

  useEffect(() => {
    api.setTokenGetter(getIdToken);
  }, [getIdToken]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="workout/:sessionId" element={<WorkoutPage />} />
        <Route path="exercises" element={<ExercisesPage />} />
        <Route path="routines" element={<RoutinesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
