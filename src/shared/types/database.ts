export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EventType =
  'session' | 'workshop' | 'jamming' | 'judging' | 'meal' | 'ceremony' | 'other';

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export type UserRole = 'participant' | 'organizer';

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          team_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          team_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          team_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          college: string | null;
          city: string | null;
          phone: string | null;
          team_id: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          college?: string | null;
          city?: string | null;
          phone?: string | null;
          team_id?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          college?: string | null;
          city?: string | null;
          phone?: string | null;
          team_id?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      schedule_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          event_type: EventType;
          starts_at: string;
          ends_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          event_type: EventType;
          starts_at: string;
          ends_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          event_type?: EventType;
          starts_at?: string;
          ends_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      problem_statements: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string | null;
          domain: string | null;
          difficulty: string | null;
          release_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description?: string | null;
          domain?: string | null;
          difficulty?: string | null;
          release_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          description?: string | null;
          domain?: string | null;
          difficulty?: string | null;
          release_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          priority: AnnouncementPriority;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          priority?: AnnouncementPriority;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          priority?: AnnouncementPriority;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      leaderboard_entries: {
        Row: {
          id: string;
          team_id: string;
          round_name: string;
          score: number;
          published: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          round_name: string;
          score?: number;
          published?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          round_name?: string;
          score?: number;
          published?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leaderboard_entries_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      bus_routes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string | null;
          origin_city: string | null;
          departs_at: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string | null;
          origin_city?: string | null;
          departs_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          origin_city?: string | null;
          departs_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      bus_stops: {
        Row: {
          id: string;
          route_id: string;
          name: string;
          latitude: number;
          longitude: number;
          stop_order: number;
          scheduled_time: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          name: string;
          latitude: number;
          longitude: number;
          stop_order: number;
          scheduled_time?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          route_id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          stop_order?: number;
          scheduled_time?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bus_stops_route_id_fkey';
            columns: ['route_id'];
            isOneToOne: false;
            referencedRelation: 'bus_routes';
            referencedColumns: ['id'];
          },
        ];
      };
      bus_route_paths: {
        Row: {
          id: string;
          route_id: string;
          points: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          points?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          route_id?: string;
          points?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bus_route_paths_route_id_fkey';
            columns: ['route_id'];
            isOneToOne: false;
            referencedRelation: 'bus_routes';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      leaderboard_view: {
        Row: {
          team_id: string;
          team_name: string;
          team_code: string;
          total_score: number;
          published_rounds_count: number;
          last_score_updated_at: string | null;
          rounds: Json;
          rank: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_organizer: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      next_problem_release: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      server_now: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
