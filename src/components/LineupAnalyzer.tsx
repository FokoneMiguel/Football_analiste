/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Camera, Upload, Loader2, Sparkles } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const LineupAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeLineup = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{
          parts: [
            { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
            { text: "Analyze this football lineup. Identify key players, tactical formation, and potential weaknesses." }
          ]
        }]
      });
      setAnalysis(response.text || "No analysis generated.");
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#151619] border border-[#2A2D32] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Camera className="w-5 h-5 text-[#F27D26]" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Lineup Visual Analyzer</h3>
      </div>

      {!image ? (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#2A2D32] rounded-xl cursor-pointer hover:border-[#F27D26] transition-colors">
          <Upload className="w-8 h-8 text-[#8E9299] mb-2" />
          <span className="text-xs text-[#8E9299]">Upload Match Lineup or Stats Image</span>
          <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
        </label>
      ) : (
        <div className="space-y-4">
          <img src={image} alt="Lineup" className="w-full h-48 object-cover rounded-lg border border-[#2A2D32]" />
          <div className="flex gap-2">
            <button 
              onClick={() => setImage(null)}
              className="flex-1 py-2 bg-[#1A1C20] text-xs font-bold text-white rounded-lg border border-[#2A2D32]"
            >
              Reset
            </button>
            <button 
              onClick={analyzeLineup}
              disabled={loading}
              className="flex-1 py-2 bg-[#F27D26] text-xs font-bold text-white rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Analyzing..." : "Analyze with AI"}
            </button>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-6 p-4 bg-[#1A1C20] rounded-lg border border-[#2A2D32] text-xs text-[#8E9299] leading-relaxed">
          {analysis}
        </div>
      )}
    </div>
  );
};
