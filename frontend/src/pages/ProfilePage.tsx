import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { UserProfile, WeightLog } from "../types";
import "./ProfilePage.css";

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [timeRange, setTimeRange] = useState<3 | 6 | 12>(3);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  async function loadData() {
    try {
      const [profileData, weightData] = await Promise.all([
        api.getProfile(),
        api.getWeightLogs(timeRange),
      ]);
      setProfile(profileData);
      setWeightLogs(weightData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function logWeight(e: React.FormEvent) {
    e.preventDefault();
    if (!newWeight) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const log = await api.createWeightLog({
        weight: Number(newWeight),
        date: today,
      });
      setWeightLogs((prev) => [log, ...prev]);
      setNewWeight("");
      setShowWeightForm(false);
    } catch (error) {
      console.error("Failed to log weight:", error);
    } finally {
      setSaving(false);
    }
  }

  function getWeightChange(): { value: number; isLoss: boolean } | null {
    if (weightLogs.length < 2) return null;
    const latest = weightLogs[0].weight;
    const oldest = weightLogs[weightLogs.length - 1].weight;
    return {
      value: Math.abs(latest - oldest),
      isLoss: latest < oldest,
    };
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  const weightChange = getWeightChange();

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src={user?.photoURL || "/default-avatar.png"}
          alt="Profile"
          className="profile-avatar"
        />
        <div className="profile-info">
          <h1 className="profile-name">
            {profile?.display_name || user?.displayName || "User"}
          </h1>
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Body Weight</h2>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setShowWeightForm(true)}
          >
            + Log Weight
          </button>
        </div>

        <div className="time-range-tabs">
          <button
            className={`time-tab ${timeRange === 3 ? "active" : ""}`}
            onClick={() => setTimeRange(3)}
          >
            3 Months
          </button>
          <button
            className={`time-tab ${timeRange === 6 ? "active" : ""}`}
            onClick={() => setTimeRange(6)}
          >
            6 Months
          </button>
          <button
            className={`time-tab ${timeRange === 12 ? "active" : ""}`}
            onClick={() => setTimeRange(12)}
          >
            1 Year
          </button>
        </div>

        {weightLogs.length === 0 ? (
          <div className="empty-state">
            <p>No weight logs yet. Start tracking your progress!</p>
          </div>
        ) : (
          <>
            <div className="weight-stats">
              <div className="weight-stat">
                <span className="weight-stat-label">Current</span>
                <span className="weight-stat-value">
                  {weightLogs[0].weight} kg
                </span>
              </div>
              {weightChange && (
                <div className="weight-stat">
                  <span className="weight-stat-label">Change</span>
                  <span
                    className={`weight-stat-value ${
                      weightChange.isLoss ? "loss" : "gain"
                    }`}
                  >
                    {weightChange.isLoss ? "-" : "+"}
                    {weightChange.value.toFixed(1)} kg
                  </span>
                </div>
              )}
            </div>

            <div className="weight-history">
              {weightLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="weight-log">
                  <span className="weight-log-date">
                    {new Date(log.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="weight-log-value">{log.weight} kg</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {showWeightForm && (
        <div className="modal-overlay" onClick={() => setShowWeightForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Log Weight</h3>
              <button
                className="modal-close"
                onClick={() => setShowWeightForm(false)}
              >
                ×
              </button>
            </div>
            <form className="modal-content" onSubmit={logWeight}>
              <label className="form-label">
                Weight (kg)
                <input
                  type="number"
                  className="form-input"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  step="0.1"
                  min="0"
                  required
                  autoFocus
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Log Weight"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
