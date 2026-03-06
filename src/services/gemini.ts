/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Match, Prediction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeMatch = async (match: Match): Promise<Prediction> => {
  const formatPlayers = (players?: any[]) => 
    players?.map(p => `${p.name} (${p.position}, Rating: ${p.rating}, Status: ${p.status}, Goals: ${p.goals}, Assists: ${p.assists}, Form: ${p.form})`).join('\n    - ') || 'No detailed player data available';

  const prompt = `
    Analyze the following football match and provide a professional prediction.
    
    Match Details:
    - Competition: ${match.competition}
    - Home Team: ${match.homeTeam.name} (Form: ${match.homeTeam.lastFive.join('-')}, xG: ${match.homeTeam.xG})
    - Away Team: ${match.awayTeam.name} (Form: ${match.awayTeam.lastFive.join('-')}, xG: ${match.awayTeam.xG})
    - H2H History: Home ${match.h2h.homeWins} wins, Away ${match.h2h.awayWins} wins, ${match.h2h.draws} draws
    
    Home Team Players:
    - ${formatPlayers(match.homeTeam.players)}
    
    Away Team Players:
    - ${formatPlayers(match.awayTeam.players)}
    
    Consider tactical formations, match importance, individual player form, injuries, and psychological factors.
    Return a detailed prediction in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          probabilities: {
            type: Type.OBJECT,
            properties: {
              homeWin: { type: Type.NUMBER },
              draw: { type: Type.NUMBER },
              awayWin: { type: Type.NUMBER }
            },
            required: ["homeWin", "draw", "awayWin"]
          },
          overUnder: {
            type: Type.OBJECT,
            properties: {
              over25: { type: Type.NUMBER },
              under25: { type: Type.NUMBER }
            },
            required: ["over25", "under25"]
          },
          btts: { type: Type.NUMBER },
          expectedScore: {
            type: Type.OBJECT,
            properties: {
              home: { type: Type.NUMBER },
              away: { type: Type.NUMBER }
            },
            required: ["home", "away"]
          },
          confidenceIndex: { type: Type.NUMBER },
          riskLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
          explanation: { type: Type.STRING },
          tacticalAnalysis: { type: Type.STRING },
          topScorers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                playerId: { type: Type.STRING },
                name: { type: Type.STRING },
                probability: { type: Type.NUMBER }
              },
              required: ["playerId", "name", "probability"]
            }
          }
        },
        required: ["probabilities", "overUnder", "btts", "expectedScore", "confidenceIndex", "riskLevel", "explanation", "tacticalAnalysis", "topScorers"]
      }
    }
  });

  const result = JSON.parse(response.text || "{}");
  return {
    ...result,
    matchId: match.id
  };
};

export const getQuickStats = async (teamName: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [{ parts: [{ text: `Provide a 2-sentence summary of ${teamName}'s current form and key players.` }] }]
  });
  return response.text;
};

export const generateMatchPreviewVideo = async (match: Match) => {
  const prompt = `A cinematic 16:9 football match preview for ${match.homeTeam.name} vs ${match.awayTeam.name} in the ${match.competition}. Show the stadium atmosphere, fans cheering, and highlights of key players.`;
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  return operation;
};

export const generateTeamLogo = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
