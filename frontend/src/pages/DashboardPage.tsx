import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { WorkoutSession, Routine } from "../types";
import "./DashboardPage.css";

export function DashboardPage() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(
    null
  );
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [session, routineList] = await Promise.all([
        api.getActiveSession(),
        api.getRoutines(true),
      ]);
      setActiveSession(session);
      setRoutines(routineList);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function startSession(routine?: Routine) {
    setStarting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const session = await api.createSession({
        routine_id: routine?.id,
        routine_name: routine?.name,
        date: today,
      });
      navigate(`/workout/${session.id}`);
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="dashboard">
        <div className="active-session-card">
          <div className="active-session-badge">Active Workout</div>
          <h2 className="active-session-title">
            {activeSession.routine_name || "Quick Workout"}
          </h2>
          <p className="active-session-info">
            Started at{" "}
            {new Date(activeSession.start_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="active-session-info">
            {activeSession.performed_exercises.length} exercise
            {activeSession.performed_exercises.length !== 1 ? "s" : ""} logged
          </p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => navigate(`/workout/${activeSession.id}`)}
          >
            Continue Workout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <section className="section">
        <h2 className="section-title">Start a Workout</h2>

        <button
          className="btn btn-primary btn-large"
          onClick={() => startSession()}
          disabled={starting}
        >
          {starting ? "Starting..." : "Quick Start (Empty Workout)"}
        </button>
      </section>

      {routines.length > 0 && (
        <section className="section">
          <h3 className="section-subtitle">Or choose a routine</h3>
          <div className="routine-list">
            {routines.map((routine) => (
              <button
                key={routine.id}
                className="routine-card"
                onClick={() => startSession(routine)}
                disabled={starting}
              >
                <span className="routine-name">{routine.name}</span>
                <span className="routine-exercises">
                  {routine.provisions.length} exercise
                  {routine.provisions.length !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {routines.length === 0 && (
        <section className="section">
          <div className="empty-state">
            <p>No routines yet.</p>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/routines")}
            >
              Create your first routine
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
