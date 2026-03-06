/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Match, Prediction } from '../types';
import { motion } from 'motion/react';
import { TrendingUp, Shield, Target, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onClick: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, prediction, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="bg-[#151619] border border-[#2A2D32] rounded-xl p-6 cursor-pointer hover:border-[#F27D26] transition-colors group"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9299]">
            {match.competition} • {new Date(match.utcDate).toLocaleDateString()}
          </span>
          {match.importance && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#F27D26] bg-[#F27D26]/10 px-2 py-0.5 rounded w-fit">
              {match.importance}
            </span>
          )}
        </div>
        {prediction && (
          <div className={cn(
            "px-2 py-1 rounded text-[10px] font-mono uppercase",
            prediction.riskLevel === 'low' ? "bg-emerald-500/10 text-emerald-500" :
            prediction.riskLevel === 'medium' ? "bg-amber-500/10 text-amber-500" :
            "bg-red-500/10 text-red-500"
          )}>
            Risk: {prediction.riskLevel}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-12 h-12 rounded-full border border-[#2A2D32]" referrerPolicy="no-referrer" />
          <span className="text-sm font-medium text-white text-center">{match.homeTeam.name}</span>
        </div>

        <div className="flex flex-col items-center">
          {match.score?.fullTime.home !== null ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-bold text-white">{match.score.fullTime.home}</span>
              <span className="text-sm font-mono text-[#8E9299]">-</span>
              <span className="text-3xl font-mono font-bold text-white">{match.score.fullTime.away}</span>
            </div>
          ) : (
            <span className="text-2xl font-mono font-bold text-white">VS</span>
          )}
          {prediction && (
            <div className="mt-2 text-center">
              <span className="text-[10px] font-mono text-[#8E9299] uppercase">Conf. Index</span>
              <div className="text-sm font-bold text-[#F27D26]">{prediction.confidenceIndex}%</div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-12 h-12 rounded-full border border-[#2A2D32]" referrerPolicy="no-referrer" />
          <span className="text-sm font-medium text-white text-center">{match.awayTeam.name}</span>
        </div>
      </div>

      {prediction && (
        <div className="mt-6 pt-6 border-t border-[#2A2D32] grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[10px] font-mono text-[#8E9299] uppercase mb-1">Home</div>
            <div className="text-xs font-bold text-white">{(prediction.probabilities.homeWin * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-mono text-[#8E9299] uppercase mb-1">Draw</div>
            <div className="text-xs font-bold text-white">{(prediction.probabilities.draw * 100).toFixed(0)}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-mono text-[#8E9299] uppercase mb-1">Away</div>
            <div className="text-xs font-bold text-white">{(prediction.probabilities.awayWin * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
