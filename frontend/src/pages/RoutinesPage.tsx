import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { Routine, Exercise, RoutineProvision } from "../types";
import "./RoutinesPage.css";

export function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProvisions, setFormProvisions] = useState<RoutineProvision[]>([]);
  const [saving, setSaving] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [routineData, exerciseData] = await Promise.all([
        api.getRoutines(),
        api.getExercises(),
      ]);
      setRoutines(routineData);
      setExercises(exerciseData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormName("");
    setFormDescription("");
    setFormProvisions([]);
    setEditingRoutine(null);
    setShowForm(true);
  }

  function openEditForm(routine: Routine) {
    setFormName(routine.name);
    setFormDescription(routine.description || "");
    setFormProvisions(routine.provisions);
    setEditingRoutine(routine);
    setShowForm(true);
  }

  function addExerciseToRoutine(exercise: Exercise) {
    const newProvision: RoutineProvision = {
      type: "exercise",
      id: `temp-${Date.now()}`,
      exercise_id: exercise.id,
      target_sets: 3,
      target_reps: 10,
      rest_seconds: 90,
      order: formProvisions.length,
    };
    setFormProvisions([...formProvisions, newProvision]);
    setShowExercisePicker(false);
  }

  function removeProvision(index: number) {
    setFormProvisions(formProvisions.filter((_, i) => i !== index));
  }

  function updateProvision(index: number, updates: Partial<RoutineProvision>) {
    setFormProvisions(
      formProvisions.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  }

  function getExerciseName(exerciseId: string): string {
    return exercises.find((e) => e.id === exerciseId)?.name || "Unknown";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const routineData = {
        name: formName,
        description: formDescription || undefined,
        provisions: formProvisions,
      };

      if (editingRoutine) {
        const updated = await api.updateRoutine(editingRoutine.id, routineData);
        setRoutines((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
      } else {
        const created = await api.createRoutine(routineData);
        setRoutines((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save routine:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(routine: Routine) {
    if (!confirm(`Delete "${routine.name}"?`)) return;
    try {
      await api.deleteRoutine(routine.id);
      setRoutines((prev) => prev.filter((r) => r.id !== routine.id));
    } catch (error) {
      console.error("Failed to delete routine:", error);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="routines-page">
      <div className="page-header">
        <h1 className="page-title">Routines</h1>
        <button className="btn btn-primary" onClick={openCreateForm}>
          + Add
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="empty-state">
          <p>No routines yet. Create your first workout plan!</p>
        </div>
      ) : (
        <div className="routines-list">
          {routines.map((routine) => (
            <div key={routine.id} className="routine-card">
              <div className="routine-info">
                <span className="routine-name">{routine.name}</span>
                <span className="routine-details">
                  {routine.provisions.length} exercise
                  {routine.provisions.length !== 1 ? "s" : ""}
                  {routine.description && ` • ${routine.description}`}
                </span>
              </div>
              <div className="routine-actions">
                <button
                  className="action-btn"
                  onClick={() => openEditForm(routine)}
                >
                  Edit
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => handleDelete(routine)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoutine ? "Edit Routine" : "New Routine"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form className="modal-content" onSubmit={handleSubmit}>
              <label className="form-label">
                Name
                <input
                  type="text"
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </label>

              <label className="form-label">
                Description (optional)
                <input
                  type="text"
                  className="form-input"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </label>

              <div className="routine-exercises-section">
                <div className="section-header">
                  <span className="section-title">Exercises</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setShowExercisePicker(true)}
                  >
                    + Add Exercise
                  </button>
                </div>

                {formProvisions.length === 0 ? (
                  <p className="empty-exercises">No exercises added yet.</p>
                ) : (
                  <div className="provision-list">
                    {formProvisions.map((provision, index) => (
                      <div key={provision.id} className="provision-item">
                        <span className="provision-order">{index + 1}</span>
                        <div className="provision-details">
                          <span className="provision-name">
                            {getExerciseName(provision.exercise_id || "")}
                          </span>
                          <div className="provision-inputs">
                            <label>
                              Sets
                              <input
                                type="number"
                                value={provision.target_sets || 3}
                                onChange={(e) =>
                                  updateProvision(index, {
                                    target_sets: Number(e.target.value),
                                  })
                                }
                                min="1"
                                max="20"
                              />
                            </label>
                            <label>
                              Reps
                              <input
                                type="number"
                                value={provision.target_reps || 10}
                                onChange={(e) =>
                                  updateProvision(index, {
                                    target_reps: Number(e.target.value),
                                  })
                                }
                                min="1"
                                max="100"
                              />
                            </label>
                            <label>
                              Rest (s)
                              <input
                                type="number"
                                value={provision.rest_seconds || 90}
                                onChange={(e) =>
                                  updateProvision(index, {
                                    rest_seconds: Number(e.target.value),
                                  })
                                }
                                min="0"
                                max="600"
                              />
                            </label>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="provision-remove"
                          onClick={() => removeProvision(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : editingRoutine ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showExercisePicker && (
        <div
          className="modal-overlay"
          onClick={() => setShowExercisePicker(false)}
        >
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
                  No exercises available. Create some first!
                </p>
              ) : (
                <div className="exercise-picker-list">
                  {exercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      className="exercise-picker-item"
                      onClick={() => addExerciseToRoutine(exercise)}
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
