export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          priority: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          priority?: string;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          priority?: string;
          title?: string;
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
      audit_logs: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          id: string;
          metadata: Json | null;
          resource_id: string | null;
          resource_type: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type: string;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          resource_id?: string | null;
          resource_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      bus_route_paths: {
        Row: {
          created_at: string;
          id: string;
          points: NonNullable<Json>;
          route_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          points?: NonNullable<Json>;
          route_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          points?: NonNullable<Json>;
          route_id?: string;
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
      bus_routes: {
        Row: {
          color: string | null;
          created_at: string;
          departs_at: string | null;
          description: string | null;
          id: string;
          name: string;
          origin_city: string | null;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          color?: string | null;
          created_at?: string;
          departs_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          origin_city?: string | null;
          sort_order?: number;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          departs_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          origin_city?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      bus_stops: {
        Row: {
          created_at: string;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          notes: string | null;
          route_id: string;
          scheduled_time: string | null;
          stop_order: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          notes?: string | null;
          route_id: string;
          scheduled_time?: string | null;
          stop_order: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          notes?: string | null;
          route_id?: string;
          scheduled_time?: string | null;
          stop_order?: number;
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
      leaderboard_entries: {
        Row: {
          id: string;
          published: boolean;
          round_name: string;
          score: number;
          team_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          published?: boolean;
          round_name: string;
          score?: number;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          published?: boolean;
          round_name?: string;
          score?: number;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leaderboard_entries_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_view';
            referencedColumns: ['team_id'];
          },
          {
            foreignKeyName: 'leaderboard_entries_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      problem_statements: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          difficulty: string | null;
          domain: string | null;
          id: string;
          release_at: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          difficulty?: string | null;
          domain?: string | null;
          id?: string;
          release_at: string;
          title: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          difficulty?: string | null;
          domain?: string | null;
          id?: string;
          release_at?: string;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          city: string | null;
          college: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string;
          team_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          city?: string | null;
          college?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string;
          team_id?: string | null;
        };
        Update: {
          city?: string | null;
          college?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string;
          team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'leaderboard_view';
            referencedColumns: ['team_id'];
          },
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
          created_at: string;
          description: string | null;
          ends_at: string;
          event_type: string;
          id: string;
          location: string | null;
          starts_at: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          ends_at: string;
          event_type: string;
          id?: string;
          location?: string | null;
          starts_at: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          ends_at?: string;
          event_type?: string;
          id?: string;
          location?: string | null;
          starts_at?: string;
          title?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          team_code: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          team_code: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          team_code?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard_view: {
        Row: {
          last_score_updated_at: string | null;
          published_rounds_count: number | null;
          rank: number | null;
          rounds: Json | null;
          team_code: string | null;
          team_id: string | null;
          team_name: string | null;
          total_score: number | null;
        };
        ComputedFields: never;
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
        Returns: string;
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
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;
