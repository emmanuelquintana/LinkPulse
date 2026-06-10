/** Tipos de dominio compartidos por la UI. */

export interface Profile {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  notificationPrefs?: Record<string, boolean> | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  plan?: "FREE" | "PRO" | "ENTERPRISE";
}

export interface CampaignSummary {
  id: string;
  name: string;
}
