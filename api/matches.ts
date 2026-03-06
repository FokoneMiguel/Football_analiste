import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  
  if (!apiKey) {
    return res.status(401).json({ 
      status: "error", 
      message: "API Key missing. Please add FOOTBALL_DATA_API_KEY to environment variables." 
    });
  }

  try {
    const response = await fetch("https://api.football-data.org/v4/matches", {
      headers: { "X-Auth-Token": apiKey }
    });
    
    if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
    
    const data = await response.json();
    res.json({ status: "success", data: data.matches });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch live matches" });
  }
}
