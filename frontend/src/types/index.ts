export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "full_body";

export type ExerciseCategory =
  | "compound"
  | "isolation"
  | "cardio"
  | "flexibility";

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseCreate {
  name: string;
  muscle_group: MuscleGroup;
  category?: ExerciseCategory;
  notes?: string;
}

export interface RoutineItem {
  id: string;
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  target_weight?: number;
  target_rpe?: number;
  rest_seconds: number;
  notes?: string;
  order: number;
}

export interface Superset {
  id: string;
  name?: string;
  items: RoutineItem[];
  rest_seconds: number;
  order: number;
}

export interface RoutineProvision {
  type: "exercise" | "superset";
  id: string;
  exercise_id?: string;
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  target_rpe?: number;
  rest_seconds?: number;
  notes?: string;
  order: number;
  items?: RoutineItem[];
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  schedule_start_date?: string;
  schedule_end_date?: string;
  provisions: RoutineProvision[];
  created_at: string;
  updated_at: string;
}

export interface RoutineCreate {
  name: string;
  description?: string;
  provisions?: RoutineProvision[];
}

export interface PerformedSet {
  set_number: number;
  reps: number;
  weight: number;
  rpe?: number;
  completed: boolean;
  notes?: string;
}

export interface PerformedExercise {
  id: string;
  exercise_id: string;
  exercise_name?: string;
  routine_item_id?: string;
  is_adhoc: boolean;
  sets: PerformedSet[];
  order: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  routine_id?: string;
  routine_name?: string;
  date: string;
  start_time: string;
  end_time?: string;
  performed_exercises: PerformedExercise[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  weight: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  display_name?: string;
  photo_url?: string;
  height_cm?: number;
  created_at: string;
  updated_at: string;
}
