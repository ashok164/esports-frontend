export type CircleKills = Record<number, number>;

export interface CircleAnalysisTeam {
  teamId: string;
  teamName: string;
  shortLabel: string;
  logoUrl: string;
  countryLogoUrl: string;
  isDead: boolean;
  hasBooyah: boolean;
  lastCircle: number;
  killsPerCircle: CircleKills;
}

export interface CircleAnalysisResponse {
  circles: number[];
  teams: CircleAnalysisTeam[];
  updatedAt: string;
}

export interface TeamIdentityRecord {
  id?: number | string;
  _id?: number | string;
  team_id?: number | string;
  teamId?: number | string;
  team_name?: string | null;
  teamName?: string | null;
  short_tag?: string | null;
  shortTag?: string | null;
  tag?: string | null;
  team_logo?: string | null;
  teamLogo?: string | null;
  country_logo?: string | null;
  countryLogo?: string | null;
}
