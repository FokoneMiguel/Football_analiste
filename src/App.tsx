/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Match, Prediction } from './types';
import { MOCK_MATCHES } from './mockData';
import { analyzeMatch, getQuickStats } from './services/gemini';
import { MatchCard } from './components/MatchCard';
import { PredictionDetail } from './components/PredictionDetail';
import { LineupAnalyzer } from './components/LineupAnalyzer';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, History, Settings, User as UserIcon, LogIn, Search, Filter, BrainCircuit, Loader2 } from 'lucide-react';

import { auth, db, signIn, signOut } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, onSnapshot, getDocFromServer } from 'firebase/firestore';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-8">
          <div className="bg-[#151619] border border-red-500/20 p-8 rounded-2xl text-center max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-[#8E9299] text-sm mb-6">The application encountered an unexpected error. Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#F27D26] text-white rounded-lg font-bold">Reload App</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        getDoc(userRef).then((snap) => {
          if (!snap.exists()) {
            setDoc(userRef, {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              favorites: []
            });
          }
        });
      }
    });

    const fetchMatches = async () => {
      try {
        const response = await fetch('/api/matches');
        const result = await response.json();
        if (result.status === 'success' && result.data.length > 0) {
          const mappedMatches = result.data.slice(0, 6).map((m: any) => ({
            id: m.id.toString(),
            utcDate: m.utcDate,
            status: m.status,
            competition: m.competition.name,
            venue: m.venue || 'TBD Stadium',
            homeTeam: {
              id: m.homeTeam.id.toString(),
              name: m.homeTeam.name,
              logo: m.homeTeam.crest,
              lastFive: ['W', 'D', 'W', 'L', 'W'],
              xG: 1.8,
              players: [
                { id: `h-${m.homeTeam.id}-p1`, name: 'Home Star', position: 'FW', rating: 8.2, status: 'available', goals: 10, assists: 4, form: 85 },
                { id: `h-${m.homeTeam.id}-p2`, name: 'Home Wall', position: 'DF', rating: 7.9, status: 'available', goals: 0, assists: 1, form: 80 },
              ]
            },
            awayTeam: {
              id: m.awayTeam.id.toString(),
              name: m.awayTeam.name,
              logo: m.awayTeam.crest,
              lastFive: ['D', 'L', 'W', 'W', 'D'],
              xG: 1.4,
              players: [
                { id: `a-${m.awayTeam.id}-p1`, name: 'Away Ace', position: 'MF', rating: 8.0, status: 'available', goals: 5, assists: 8, form: 88 },
                { id: `a-${m.awayTeam.id}-p2`, name: 'Away Keeper', position: 'GK', rating: 7.5, status: 'available', goals: 0, assists: 0, form: 75 },
              ]
            },
            h2h: { homeWins: 5, awayWins: 3, draws: 2 },
            importance: m.status === 'LIVE' ? 'Live Match' : undefined
          }));
          setMatches(mappedMatches);
        } else {
          setMatches(MOCK_MATCHES);
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        setMatches(MOCK_MATCHES);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchMatches();

    // WebSocket connection for real-time scores
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'score_update') {
        setMatches(prevMatches => 
          prevMatches.map(m => {
            if (m.id === data.matchId) {
              const updated = { ...m, score: data.score, status: 'LIVE' as any };
              // Update selected match if it's the one being updated
              setSelectedMatch(prev => prev?.id === data.matchId ? updated : prev);
              return updated;
            }
            return m;
          })
        );
      }
    };

    socket.onerror = (error) => {
      console.warn('WebSocket error (Live scores disabled):', error);
    };

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  const handleAnalyze = async (match: Match) => {
    if (predictions[match.id]) {
      setSelectedMatch(match);
      return;
    }

    setLoading(match.id);
    try {
      const prediction = await analyzeMatch(match);
      setPredictions(prev => ({ ...prev, [match.id]: prediction }));
      
      // Save prediction to Firestore if authenticated
      if (user) {
        const predRef = doc(collection(db, 'predictions'));
        await setDoc(predRef, {
          ...prediction,
          createdAt: new Date(),
          authorUid: user.uid
        });
      }
      
      setSelectedMatch(match);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 border-r border-[#1A1C20] bg-[#0D0E10] flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-[#F27D26] rounded-xl flex items-center justify-center shadow-lg shadow-[#F27D26]/20">
          <BrainCircuit className="text-white w-6 h-6" />
        </div>
        
        <nav className="flex flex-col gap-6">
          {[LayoutDashboard, History, Search, Filter].map((Icon, i) => (
            <button key={i} className="p-3 text-[#8E9299] hover:text-white hover:bg-[#1A1C20] rounded-xl transition-all">
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-6">
          <button className="p-3 text-[#8E9299] hover:text-white hover:bg-[#1A1C20] rounded-xl transition-all">
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => user ? signOut() : signIn()}
            className="p-3 text-[#8E9299] hover:text-white hover:bg-[#1A1C20] rounded-xl transition-all"
          >
            {user ? <UserIcon className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-20 min-h-screen">
        <header className="h-20 border-b border-[#1A1C20] flex items-center justify-between px-12 bg-[#0D0E10]/80 backdrop-blur-md sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-bold tracking-tight">GoalMind AI</h1>
            <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-widest">Professional Analytics Engine</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1C20] rounded-full border border-[#2A2D32]">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-[#8E9299] uppercase">API Status: Live</span>
            </div>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2 italic serif">Upcoming Fixtures</h2>
                <p className="text-[#8E9299]">High-confidence predictions for the next 48 hours.</p>
              </div>
              <div className="flex gap-4">
                <button className="px-6 py-2 bg-[#1A1C20] border border-[#2A2D32] rounded-lg text-sm font-medium hover:bg-[#2A2D32] transition-colors">
                  All Leagues
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((match) => (
                <div key={match.id} className="relative">
                  <MatchCard 
                    match={match} 
                    prediction={predictions[match.id]}
                    onClick={() => handleAnalyze(match)}
                  />
                  {loading === match.id && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 z-10">
                      <Loader2 className="w-8 h-8 text-[#F27D26] animate-spin" />
                      <span className="text-xs font-mono text-white uppercase tracking-widest">Analyzing Data...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <LineupAnalyzer />
            <div className="bg-[#151619] border border-[#2A2D32] rounded-xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Market Trends</h3>
              <div className="space-y-4">
                {[
                  { label: 'Man City ML', trend: '+12%', color: 'text-emerald-500' },
                  { label: 'Real Madrid Over 2.5', trend: '+8%', color: 'text-emerald-500' },
                  { label: 'Liverpool BTTS', trend: '-3%', color: 'text-red-500' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-xs text-[#8E9299]">{item.label}</span>
                    <span className={`text-xs font-mono font-bold ${item.color}`}>{item.trend}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Overlay */}
      <AnimatePresence>
        {selectedMatch && predictions[selectedMatch.id] && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMatch(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <PredictionDetail 
              match={selectedMatch}
              prediction={predictions[selectedMatch.id]}
              onClose={() => setSelectedMatch(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
