export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  preferences: {
    pace: 'relaxed' | 'moderate' | 'packed';
    interests: string[];
  };
  created_at: string;
}

export interface Day {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string;
}

export interface Activity {
  id: string;
  day_id: string;
  name: string;
  start_time: string | null;
  duration_minutes: number;
  description: string;
  location_text: string;
  sort_order: number;
  created_at: string;
}

export interface ActivityFormData {
  name: string;
  start_time: string;
  duration_minutes: number;
  description: string;
  location_text: string;
}

export type Page =
  | { name: 'landing' }
  | { name: 'auth'; mode: 'login' | 'signup' }
  | { name: 'dashboard' }
  | { name: 'create-trip' }
  | { name: 'itinerary'; tripId: string };
