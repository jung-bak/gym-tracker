import { API_BASE_URL } from "../config/api";
import type {
  Exercise,
  ExerciseCreate,
  Routine,
  RoutineCreate,
  WorkoutSession,
  WeightLog,
  UserProfile,
} from "../types";

class ApiClient {
  private getToken: () => Promise<string | null>;

  constructor() {
    this.getToken = async () => null;
  }

  setTokenGetter(getter: () => Promise<string | null>) {
    this.getToken = getter;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP error ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Exercises
  async getExercises(muscleGroup?: string): Promise<Exercise[]> {
    const params = muscleGroup ? `?muscle_group=${muscleGroup}` : "";
    return this.request<Exercise[]>(`/api/exercises${params}`);
  }

  async createExercise(exercise: ExerciseCreate): Promise<Exercise> {
    return this.request<Exercise>("/api/exercises", {
      method: "POST",
      body: JSON.stringify(exercise),
    });
  }

  async updateExercise(
    id: string,
    exercise: Partial<ExerciseCreate>
  ): Promise<Exercise> {
    return this.request<Exercise>(`/api/exercises/${id}`, {
      method: "PATCH",
      body: JSON.stringify(exercise),
    });
  }

  async deleteExercise(id: string): Promise<void> {
    return this.request<void>(`/api/exercises/${id}`, {
      method: "DELETE",
    });
  }

  // Routines
  async getRoutines(activeOnly = false): Promise<Routine[]> {
    const params = activeOnly ? "?active_only=true" : "";
    return this.request<Routine[]>(`/api/routines${params}`);
  }

  async getRoutine(id: string): Promise<Routine> {
    return this.request<Routine>(`/api/routines/${id}`);
  }

  async createRoutine(routine: RoutineCreate): Promise<Routine> {
    return this.request<Routine>("/api/routines", {
      method: "POST",
      body: JSON.stringify(routine),
    });
  }

  async updateRoutine(
    id: string,
    routine: Partial<RoutineCreate>
  ): Promise<Routine> {
    return this.request<Routine>(`/api/routines/${id}`, {
      method: "PATCH",
      body: JSON.stringify(routine),
    });
  }

  async deleteRoutine(id: string): Promise<void> {
    return this.request<void>(`/api/routines/${id}`, {
      method: "DELETE",
    });
  }

  // Sessions
  async getSessions(
    startDate?: string,
    endDate?: string,
    limit = 50
  ): Promise<WorkoutSession[]> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    params.append("limit", String(limit));
    return this.request<WorkoutSession[]>(`/api/sessions?${params}`);
  }

  async getActiveSession(): Promise<WorkoutSession | null> {
    return this.request<WorkoutSession | null>("/api/sessions/active");
  }

  async createSession(data: {
    routine_id?: string;
    routine_name?: string;
    date: string;
    notes?: string;
  }): Promise<WorkoutSession> {
    return this.request<WorkoutSession>("/api/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async finishSession(id: string): Promise<WorkoutSession> {
    return this.request<WorkoutSession>(`/api/sessions/${id}/finish`, {
      method: "POST",
    });
  }

  async addExerciseToSession(
    sessionId: string,
    data: {
      exercise_id: string;
      routine_item_id?: string;
      is_adhoc?: boolean;
    }
  ): Promise<WorkoutSession> {
    return this.request<WorkoutSession>(`/api/sessions/${sessionId}/exercises`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async addSetToExercise(
    sessionId: string,
    performedExerciseId: string,
    data: {
      reps: number;
      weight: number;
      rpe?: number;
      notes?: string;
    }
  ): Promise<WorkoutSession> {
    return this.request<WorkoutSession>(
      `/api/sessions/${sessionId}/exercises/${performedExerciseId}/sets`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async deleteSession(id: string): Promise<void> {
    return this.request<void>(`/api/sessions/${id}`, {
      method: "DELETE",
    });
  }

  // Body Metrics
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>("/api/body-metrics/profile");
  }

  async updateProfile(data: {
    display_name?: string;
    height_cm?: number;
  }): Promise<UserProfile> {
    return this.request<UserProfile>("/api/body-metrics/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getWeightLogs(months = 3): Promise<WeightLog[]> {
    return this.request<WeightLog[]>(`/api/body-metrics/weight?months=${months}`);
  }

  async createWeightLog(data: {
    weight: number;
    date: string;
    notes?: string;
  }): Promise<WeightLog> {
    return this.request<WeightLog>("/api/body-metrics/weight", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteWeightLog(id: string): Promise<void> {
    return this.request<void>(`/api/body-metrics/weight/${id}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
