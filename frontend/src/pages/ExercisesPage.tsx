import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { Exercise, ExerciseCreate, MuscleGroup, ExerciseCategory } from "../types";
import "./ExercisesPage.css";

const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "full_body",
];

const CATEGORIES: ExerciseCategory[] = [
  "compound",
  "isolation",
  "cardio",
  "flexibility",
];

export function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseCreate>({
    name: "",
    muscle_group: "chest",
    category: "compound",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [filterMuscle, setFilterMuscle] = useState<string>("");

  useEffect(() => {
    loadExercises();
  }, []);

  async function loadExercises() {
    try {
      const data = await api.getExercises();
      setExercises(data);
    } catch (error) {
      console.error("Failed to load exercises:", error);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setForm({ name: "", muscle_group: "chest", category: "compound", notes: "" });
    setEditingExercise(null);
    setShowForm(true);
  }

  function openEditForm(exercise: Exercise) {
    setForm({
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      category: exercise.category,
      notes: exercise.notes || "",
    });
    setEditingExercise(exercise);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingExercise) {
        const updated = await api.updateExercise(editingExercise.id, form);
        setExercises((prev) =>
          prev.map((ex) => (ex.id === updated.id ? updated : ex))
        );
      } else {
        const created = await api.createExercise(form);
        setExercises((prev) => [...prev, created]);
      }
      setShowForm(false);
    } catch (error) {
      console.error("Failed to save exercise:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exercise: Exercise) {
    if (!confirm(`Delete "${exercise.name}"?`)) return;
    try {
      await api.deleteExercise(exercise.id);
      setExercises((prev) => prev.filter((ex) => ex.id !== exercise.id));
    } catch (error) {
      console.error("Failed to delete exercise:", error);
    }
  }

  const filteredExercises = filterMuscle
    ? exercises.filter((ex) => ex.muscle_group === filterMuscle)
    : exercises;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="exercises-page">
      <div className="page-header">
        <h1 className="page-title">Exercises</h1>
        <button className="btn btn-primary" onClick={openCreateForm}>
          + Add
        </button>
      </div>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value)}
        >
          <option value="">All muscles</option>
          {MUSCLE_GROUPS.map((muscle) => (
            <option key={muscle} value={muscle}>
              {muscle.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="empty-state">
          <p>
            {filterMuscle
              ? "No exercises for this muscle group."
              : "No exercises yet. Add your first one!"}
          </p>
        </div>
      ) : (
        <div className="exercises-list">
          {filteredExercises.map((exercise) => (
            <div key={exercise.id} className="exercise-card">
              <div className="exercise-info">
                <span className="exercise-name">{exercise.name}</span>
                <span className="exercise-details">
                  {exercise.muscle_group.replace("_", " ")} • {exercise.category}
                </span>
              </div>
              <div className="exercise-actions">
                <button
                  className="action-btn"
                  onClick={() => openEditForm(exercise)}
                >
                  Edit
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => handleDelete(exercise)}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExercise ? "Edit Exercise" : "New Exercise"}</h3>
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
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>

              <label className="form-label">
                Muscle Group
                <select
                  className="form-input"
                  value={form.muscle_group}
                  onChange={(e) =>
                    setForm({ ...form, muscle_group: e.target.value as MuscleGroup })
                  }
                >
                  {MUSCLE_GROUPS.map((muscle) => (
                    <option key={muscle} value={muscle}>
                      {muscle.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                Category
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as ExerciseCategory })
                  }
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                Notes (optional)
                <textarea
                  className="form-input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : editingExercise ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
