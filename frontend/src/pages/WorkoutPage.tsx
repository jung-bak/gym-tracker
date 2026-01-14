import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { WorkoutSession, Exercise, PerformedExercise } from "../types";
import "./WorkoutPage.css";

export function WorkoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [activeExercise, setActiveExercise] =
    useState<PerformedExercise | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [setForm, setSetForm] = useState({ reps: 0, weight: 0, rpe: undefined as number | undefined });

  useEffect(() => {
    loadData();
  }, [sessionId]);

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer]);

  async function loadData() {
    if (!sessionId) return;
    try {
      const [sessionData, exerciseList] = await Promise.all([
        api.getSessions().then((sessions) =>
          sessions.find((s) => s.id === sessionId)
        ),
        api.getExercises(),
      ]);

      if (!sessionData) {
        navigate("/");
        return;
      }

      setSession(sessionData);
      setExercises(exerciseList);

      if (sessionData.performed_exercises.length > 0) {
        setActiveExercise(
          sessionData.performed_exercises[
            sessionData.performed_exercises.length - 1
          ]
        );
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addExercise(exercise: Exercise) {
    if (!sessionId) return;
    try {
      const updated = await api.addExerciseToSession(sessionId, {
        exercise_id: exercise.id,
        is_adhoc: true,
      });
      setSession(updated);
      setActiveExercise(
        updated.performed_exercises[updated.performed_exercises.length - 1]
      );
      setShowExercisePicker(false);
    } catch (error) {
      console.error("Failed to add exercise:", error);
    }
  }

  async function logSet() {
    if (!sessionId || !activeExercise) return;
    try {
      const updated = await api.addSetToExercise(
        sessionId,
        activeExercise.id,
        {
          reps: setForm.reps,
          weight: setForm.weight,
          rpe: setForm.rpe,
        }
      );
      setSession(updated);

      // Update active exercise with new data
      const updatedExercise = updated.performed_exercises.find(
        (e) => e.id === activeExercise.id
      );
      if (updatedExercise) {
        setActiveExercise(updatedExercise);
      }

      // Start rest timer (default 90 seconds)
      setRestTimer(90);
    } catch (error) {
      console.error("Failed to log set:", error);
    }
  }

  async function finishWorkout() {
    if (!sessionId) return;
    try {
      await api.finishSession(sessionId);
      navigate("/");
    } catch (error) {
      console.error("Failed to finish workout:", error);
    }
  }

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!session) {
    return <div>Session not found</div>;
  }

  return (
    <div className="workout-page">
      <div className="workout-header">
        <h1 className="workout-title">
          {session.routine_name || "Quick Workout"}
        </h1>
        <p className="workout-time">
          Started{" "}
          {new Date(session.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {restTimer !== null && restTimer > 0 && (
        <div className="rest-timer">
          <span className="rest-timer-label">Rest</span>
          <span className="rest-timer-value">{formatTime(restTimer)}</span>
          <button
            className="rest-timer-skip"
            onClick={() => setRestTimer(null)}
          >
            Skip
          </button>
        </div>
      )}

      <div className="exercise-tabs">
        {session.performed_exercises.map((exercise) => (
          <button
            key={exercise.id}
            className={`exercise-tab ${
              activeExercise?.id === exercise.id ? "active" : ""
            }`}
            onClick={() => setActiveExercise(exercise)}
          >
            {exercise.exercise_name || "Unknown"}
            <span className="exercise-tab-sets">{exercise.sets.length}</span>
          </button>
        ))}
        <button
          className="exercise-tab add-exercise"
          onClick={() => setShowExercisePicker(true)}
        >
          + Add
        </button>
      </div>

      {activeExercise && (
        <div className="active-exercise">
          <h2 className="active-exercise-name">
            {activeExercise.exercise_name}
          </h2>

          <div className="sets-list">
            {activeExercise.sets.map((set) => (
              <div key={set.set_number} className="set-row">
                <span className="set-number">{set.set_number}</span>
                <span className="set-weight">{set.weight} kg</span>
                <span className="set-reps">{set.reps} reps</span>
                {set.rpe && <span className="set-rpe">RPE {set.rpe}</span>}
              </div>
            ))}
          </div>

          <div className="set-form">
            <div className="set-form-row">
              <label className="set-form-label">
                Weight (kg)
                <input
                  type="number"
                  className="set-form-input"
                  value={setForm.weight || ""}
                  onChange={(e) =>
                    setSetForm({ ...setForm, weight: Number(e.target.value) })
                  }
                  min="0"
                  step="0.5"
                />
              </label>
              <label className="set-form-label">
                Reps
                <input
                  type="number"
                  className="set-form-input"
                  value={setForm.reps || ""}
                  onChange={(e) =>
                    setSetForm({ ...setForm, reps: Number(e.target.value) })
                  }
                  min="0"
                />
              </label>
              <label className="set-form-label">
                RPE
                <input
                  type="number"
                  className="set-form-input"
                  value={setForm.rpe || ""}
                  onChange={(e) =>
                    setSetForm({
                      ...setForm,
                      rpe: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min="1"
                  max="10"
                  step="0.5"
                />
              </label>
            </div>
            <button className="btn btn-primary" onClick={logSet}>
              Log Set
            </button>
          </div>
        </div>
      )}

      {!activeExercise && session.performed_exercises.length === 0 && (
        <div className="empty-workout">
          <p>No exercises yet. Add one to get started!</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowExercisePicker(true)}
          >
            Add Exercise
          </button>
        </div>
      )}

      <button className="btn btn-secondary finish-btn" onClick={finishWorkout}>
        Finish Workout
      </button>

      {showExercisePicker && (
        <div className="modal-overlay" onClick={() => setShowExercisePicker(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Exercise</h3>
              <button
                className="modal-close"
                onClick={() => setShowExercisePicker(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {exercises.length === 0 ? (
                <p className="empty-state">
                  No exercises yet. Create some in the Exercises tab.
                </p>
              ) : (
                <div className="exercise-picker-list">
                  {exercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      className="exercise-picker-item"
                      onClick={() => addExercise(exercise)}
                    >
                      <span className="exercise-picker-name">
                        {exercise.name}
                      </span>
                      <span className="exercise-picker-muscle">
                        {exercise.muscle_group}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
