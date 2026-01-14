import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { WorkoutSession } from "../types";
import "./HistoryPage.css";

export function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const data = await api.getSessions();
      setSessions(data.filter((s) => s.end_time !== null));
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const minutes = Math.round(
      (endDate.getTime() - startDate.getTime()) / 60000
    );
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  function getTotalVolume(session: WorkoutSession): number {
    return session.performed_exercises.reduce((total, exercise) => {
      return (
        total +
        exercise.sets.reduce((setTotal, set) => {
          return setTotal + set.weight * set.reps;
        }, 0)
      );
    }, 0);
  }

  function getTotalSets(session: WorkoutSession): number {
    return session.performed_exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="history-page">
      <h1 className="page-title">Workout History</h1>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No completed workouts yet. Time to hit the gym!</p>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((session) => (
            <div key={session.id} className="session-card">
              <button
                className="session-header"
                onClick={() =>
                  setExpandedSession(
                    expandedSession === session.id ? null : session.id
                  )
                }
              >
                <div className="session-info">
                  <span className="session-name">
                    {session.routine_name || "Quick Workout"}
                  </span>
                  <span className="session-date">{formatDate(session.date)}</span>
                </div>
                <div className="session-stats">
                  <span className="session-stat">
                    {formatDuration(session.start_time, session.end_time!)}
                  </span>
                  <span className="session-stat">
                    {getTotalSets(session)} sets
                  </span>
                  <span className="expand-icon">
                    {expandedSession === session.id ? "−" : "+"}
                  </span>
                </div>
              </button>

              {expandedSession === session.id && (
                <div className="session-details">
                  <div className="session-summary">
                    <div className="summary-item">
                      <span className="summary-label">Volume</span>
                      <span className="summary-value">
                        {getTotalVolume(session).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Exercises</span>
                      <span className="summary-value">
                        {session.performed_exercises.length}
                      </span>
                    </div>
                  </div>

                  <div className="session-exercises">
                    {session.performed_exercises.map((exercise) => (
                      <div key={exercise.id} className="history-exercise">
                        <span className="history-exercise-name">
                          {exercise.exercise_name || "Unknown Exercise"}
                        </span>
                        <div className="history-sets">
                          {exercise.sets.map((set) => (
                            <span key={set.set_number} className="history-set">
                              {set.weight}kg × {set.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
