/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  POSTPONED = 'POSTPONED'
}

export interface TeamStats {
  id: string;
  name: string;
  logo: string;
  lastFive: ('W' | 'D' | 'L')[];
  homeForm: number; // 0-100
  awayForm: number; // 0-100
  goalsScored: number;
  goalsConceded: number;
  xG: number;
  possession: number;
  shotsOnTarget: number;
  cleanSheets: number;
  players?: Player[];
}

export interface Player {
  id: string;
  name: string;
  position: string;
  rating: number;
  status: 'available' | 'injured' | 'suspended';
  goals: number;
  assists: number;
  form: number; // 0-100
}

export interface Match {
  id: string;
  utcDate: string;
  status: MatchStatus;
  homeTeam: TeamStats;
  awayTeam: TeamStats;
  competition: string;
  venue: string;
  h2h: {
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  score?: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
  importance?: string;
}

export interface Prediction {
  matchId: string;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  overUnder: {
    over25: number;
    under25: number;
  };
  btts: number; // Probability 0-1
  expectedScore: {
    home: number;
    away: number;
  };
  confidenceIndex: number; // 0-90
  topScorers: {
    playerId: string;
    name: string;
    probability: number;
  }[];
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string;
  tacticalAnalysis: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  favorites: string[]; // Match IDs
}
