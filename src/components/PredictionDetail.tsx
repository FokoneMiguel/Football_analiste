/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Match, Prediction } from '../types';
import { motion } from 'motion/react';
import { Shield, Target, TrendingUp, AlertTriangle, Brain, Zap, Info, MapPin, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface PredictionDetailProps {
  match: Match;
  prediction: Prediction;
  onClose: () => void;
}

export const PredictionDetail: React.FC<PredictionDetailProps> = ({ match, prediction, onClose }) => {
  const [stadiumInfo, setStadiumInfo] = React.useState<string | null>(null);
  const [stadiumUrl, setStadiumUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchStadiumInfo = async () => {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ parts: [{ text: `Tell me about ${match.venue} in ${match.homeTeam.name}'s city. Include capacity and interesting facts.` }] }],
          config: {
            tools: [{ googleMaps: {} }]
          }
        });
        setStadiumInfo(response.text || null);
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks?.[0]?.maps?.uri) {
          setStadiumUrl(chunks[0].maps.uri);
        }
      } catch (error) {
        console.error("Failed to fetch stadium info:", error);
      }
    };
    fetchStadiumInfo();
  }, [match.venue]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151619] border border-[#2A2D32] rounded-2xl overflow-hidden max-w-4xl w-full mx-auto"
    >
      {/* Header */}
      <div className="p-8 border-b border-[#2A2D32] bg-gradient-to-r from-[#1A1C20] to-[#151619] flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-white">Match Analysis</h2>
            {match.importance && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] bg-[#F27D26]/10 border border-[#F27D26]/20 px-2 py-1 rounded">
                {match.importance}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-[#8E9299] font-mono uppercase tracking-widest">
              {match.homeTeam.name} vs {match.awayTeam.name}
            </p>
            {match.score?.fullTime.home !== null && (
              <div className="px-3 py-1 bg-[#F27D26]/10 border border-[#F27D26]/20 rounded-lg">
                <span className="text-sm font-mono font-bold text-[#F27D26]">
                  {match.score.fullTime.home} - {match.score.fullTime.away}
                </span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-[#2A2D32] rounded-full transition-colors text-[#8E9299]"
        >
          <Zap className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Probabilities */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-[#F27D26]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Explanation</h3>
            </div>
            <div className="prose prose-invert max-w-none text-[#8E9299] text-sm leading-relaxed">
              <ReactMarkdown>{prediction.explanation}</ReactMarkdown>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#F27D26]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tactical Analysis</h3>
            </div>
            <div className="bg-[#1A1C20] p-6 rounded-xl border border-[#2A2D32] text-[#8E9299] text-sm italic">
              <ReactMarkdown>{prediction.tacticalAnalysis}</ReactMarkdown>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#F27D26]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Venue: {match.venue}</h3>
            </div>
            <div className="bg-[#1A1C20] p-6 rounded-xl border border-[#2A2D32]">
              {stadiumInfo ? (
                <div className="text-xs text-[#8E9299] leading-relaxed">
                  <ReactMarkdown>{stadiumInfo}</ReactMarkdown>
                  {stadiumUrl && (
                    <a 
                      href={stadiumUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block mt-4 text-[#F27D26] hover:underline font-mono text-[10px] uppercase"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#8E9299] text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching venue data...
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="bg-[#1A1C20] p-6 rounded-xl border border-[#2A2D32]">
            <h4 className="text-[10px] font-mono text-[#8E9299] uppercase mb-4">Win Probability</h4>
            <div className="space-y-4">
              {[
                { label: match.homeTeam.name, value: prediction.probabilities.homeWin, color: 'bg-[#F27D26]' },
                { label: 'Draw', value: prediction.probabilities.draw, color: 'bg-[#8E9299]' },
                { label: match.awayTeam.name, value: prediction.probabilities.awayWin, color: 'bg-white' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8E9299]">{item.label}</span>
                    <span className="text-white font-mono">{(item.value * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1 bg-[#2A2D32] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value * 100}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1C20] p-6 rounded-xl border border-[#2A2D32]">
            <h4 className="text-[10px] font-mono text-[#8E9299] uppercase mb-4">Market Predictions</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#151619] rounded-lg border border-[#2A2D32]">
                <div className="text-[10px] text-[#8E9299] uppercase mb-1">BTTS</div>
                <div className="text-lg font-mono font-bold text-white">{(prediction.btts * 100).toFixed(0)}%</div>
              </div>
              <div className="p-3 bg-[#151619] rounded-lg border border-[#2A2D32]">
                <div className="text-[10px] text-[#8E9299] uppercase mb-1">Over 2.5</div>
                <div className="text-lg font-mono font-bold text-white">{(prediction.overUnder.over25 * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          <div className={cn(
            "p-6 rounded-xl border flex items-start gap-4",
            prediction.riskLevel === 'high' ? "bg-red-500/5 border-red-500/20" : "bg-emerald-500/5 border-emerald-500/20"
          )}>
            <AlertTriangle className={cn("w-5 h-5 mt-1", prediction.riskLevel === 'high' ? "text-red-500" : "text-emerald-500")} />
            <div>
              <h4 className="text-xs font-bold text-white uppercase mb-1">Risk Assessment</h4>
              <p className="text-[10px] text-[#8E9299] leading-tight">
                {prediction.riskLevel === 'high' 
                  ? "High volatility detected. Tactical shifts or early goals could significantly alter probabilities."
                  : "Stable match profile. Historical data and current form show strong correlation with prediction."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
