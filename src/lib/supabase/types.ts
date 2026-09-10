export type StatutLead = "chaud" | "tiede" | "froid";
export type PrioriteTache = "basse" | "normale" | "haute";
export type StatutTache = "a_faire" | "en_cours" | "terminee";
export type TypeRdv = "appel" | "rdv" | "envoi";

export type Profil = {
  id: string;
  user_id: string;
  nom_concession: string;
  nom_commercial: string;
  logo_url: string | null;
  photo_fond_url: string | null;
  objectif_mensuel: number;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  user_id: string;
  nom: string;
  telephone: string | null;
  vehicule_recherche: string | null;
  budget: number | null;
  financement: boolean;
  reprise: boolean;
  objections: string | null;
  statut_lead: StatutLead;
  prochaine_relance: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  client_id: string | null;
  audio_url: string | null;
  transcription: string | null;
  resume: string | null;
  created_at: string;
};

export type Tache = {
  id: string;
  user_id: string;
  client_id: string | null;
  note_id: string | null;
  titre: string;
  priorite: PrioriteTache;
  statut: StatutTache;
  echeance: string | null;
  created_at: string;
};

export type RendezVous = {
  id: string;
  user_id: string;
  client_id: string | null;
  titre: string;
  date_heure: string;
  type: TypeRdv;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  titre: string;
  message: string;
  lue: boolean;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profil: { Row: Profil; Insert: Partial<Profil>; Update: Partial<Profil>; Relationships: [] };
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client>; Relationships: [] };
      notes: { Row: Note; Insert: Partial<Note>; Update: Partial<Note>; Relationships: [] };
      taches: { Row: Tache; Insert: Partial<Tache>; Update: Partial<Tache>; Relationships: [] };
      rendez_vous: { Row: RendezVous; Insert: Partial<RendezVous>; Update: Partial<RendezVous>; Relationships: [] };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
