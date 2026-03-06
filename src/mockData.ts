/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, MatchStatus, TeamStats } from "./types";

const createMockTeam = (id: string, name: string, logo: string): TeamStats => ({
  id,
  name,
  logo,
  lastFive: ['W', 'W', 'D', 'L', 'W'],
  homeForm: 85,
  awayForm: 70,
  goalsScored: 2.1,
  goalsConceded: 0.8,
  xG: 1.95,
  possession: 58,
  shotsOnTarget: 6.2,
  cleanSheets: 12,
  players: [
    { id: `${id}-p1`, name: 'Star Striker', position: 'FW', rating: 8.5, status: 'available', goals: 15, assists: 5, form: 90 },
    { id: `${id}-p2`, name: 'Key Midfielder', position: 'MF', rating: 7.8, status: 'available', goals: 4, assists: 12, form: 82 },
    { id: `${id}-p3`, name: 'Main Defender', position: 'DF', rating: 8.0, status: 'available', goals: 1, assists: 0, form: 85 },
    { id: `${id}-p4`, name: 'Injured Winger', position: 'FW', rating: 7.5, status: 'injured', goals: 3, assists: 4, form: 0 },
  ]
});

export const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    utcDate: new Date().toISOString(),
    status: MatchStatus.SCHEDULED,
    homeTeam: createMockTeam('t1', 'Manchester City', 'https://picsum.photos/seed/mancity/100/100'),
    awayTeam: createMockTeam('t2', 'Liverpool', 'https://picsum.photos/seed/liverpool/100/100'),
    competition: 'Premier League',
    venue: 'Etihad Stadium',
    h2h: { homeWins: 12, awayWins: 10, draws: 8 },
    importance: 'Title Decider'
  },
  {
    id: '2',
    utcDate: new Date(Date.now() + 86400000).toISOString(),
    status: MatchStatus.SCHEDULED,
    homeTeam: createMockTeam('t3', 'Real Madrid', 'https://picsum.photos/seed/realmadrid/100/100'),
    awayTeam: createMockTeam('t4', 'Barcelona', 'https://picsum.photos/seed/barcelona/100/100'),
    competition: 'La Liga',
    venue: 'Santiago Bernabéu',
    h2h: { homeWins: 15, awayWins: 14, draws: 10 },
    importance: 'El Clásico'
  },
  {
    id: '3',
    utcDate: new Date(Date.now() + 172800000).toISOString(),
    status: MatchStatus.SCHEDULED,
    homeTeam: createMockTeam('t5', 'Bayern Munich', 'https://picsum.photos/seed/bayern/100/100'),
    awayTeam: createMockTeam('t6', 'Borussia Dortmund', 'https://picsum.photos/seed/dortmund/100/100'),
    competition: 'Bundesliga',
    venue: 'Allianz Arena',
    h2h: { homeWins: 20, awayWins: 8, draws: 5 },
    importance: 'Der Klassiker'
  }
];
