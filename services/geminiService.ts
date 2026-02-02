
import { GoogleGenAI, Type } from "@google/genai";
import { Post } from "../types";

interface GeminiPostResponse {
  username: string;
  fullName: string;
  caption: string;
  location?: string;
  likes: number;
  commentsCount: number;
}

const apiKey = process.env.NEXT_PUBLIC_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Only initialize if API key exists
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// Fallback mock data when API key is not available
function generateMockPosts(count: number): Post[] {
  const mockData = [
    { username: 'travel_adventures', fullName: 'Sarah Johnson', caption: '✨ Lost in the beauty of nature 🌿 #wanderlust #travel', location: 'Bali, Indonesia', likes: 2341, commentsCount: 89 },
    { username: 'foodie_heaven', fullName: 'Mike Chen', caption: '🍜 Best ramen in town! Absolutely divine 😋 #foodie #ramen', location: 'Tokyo, Japan', likes: 1523, commentsCount: 45 },
    { username: 'fitness_queen', fullName: 'Emma Davis', caption: '💪 New PR today! Hard work pays off 🔥 #fitness #motivation', location: 'Los Angeles, CA', likes: 3421, commentsCount: 156 },
    { username: 'art_lover', fullName: 'Alex Kim', caption: '🎨 Creating something beautiful today ✨ #art #creative', location: 'New York, NY', likes: 892, commentsCount: 34 },
    { username: 'coffee_addict', fullName: 'Lisa Park', caption: '☕ But first, coffee! #morningvibes #coffeelover', location: 'Seattle, WA', likes: 1876, commentsCount: 67 },
    { username: 'sunset_chaser', fullName: 'David Wilson', caption: '🌅 Chasing sunsets and dreams #sunset #photography', location: 'Santorini, Greece', likes: 4521, commentsCount: 201 },
    { username: 'urban_explorer', fullName: 'Nina Rodriguez', caption: '🏙️ City lights and late nights #urban #citylife', location: 'Paris, France', likes: 2156, commentsCount: 98 },
    { username: 'bookworm_life', fullName: 'Tom Anderson', caption: '📚 Lost in another world #books #reading', location: 'London, UK', likes: 743, commentsCount: 28 },
  ];

  return mockData.slice(0, count).map((item, index): Post => ({
    id: `post-${index}-${Date.now()}`,
    userId: `user-${index}`,
    user: {
      id: `user-${index}`,
      username: item.username,
      fullName: item.fullName,
      avatar: `https://picsum.photos/seed/${item.username}/150/150`,
    },
    imageUrl: `https://picsum.photos/seed/post-${index}-${Date.now()}/1080/1080`,
    caption: item.caption,
    location: item.location,
    likes: item.likes,
    commentsCount: item.commentsCount,
    createdAt: "JUST NOW",
    updatedAt: "JUST NOW",
  }));
}

export async function generatePosts(count: number = 5, signal?: AbortSignal): Promise<Post[]> {
  // Return mock data if API key is not available
  if (!ai) {
    console.warn("Gemini API key not configured. Using mock data.");
    return generateMockPosts(count);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate ${count} realistic Instagram post objects. 
      For each post, include: 
      - A catchy username
      - A realistic full name
      - A creative, modern Instagram caption (use emojis)
      - A plausible location (e.g., 'Tokyo, Japan', 'Golden Gate Bridge')
      - A random number of likes (100-5000)
      - A random number of comments (10-200)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              username: { type: Type.STRING },
              fullName: { type: Type.STRING },
              caption: { type: Type.STRING },
              location: { type: Type.STRING },
              likes: { type: Type.NUMBER },
              commentsCount: { type: Type.NUMBER },
            },
            required: ["username", "fullName", "caption", "likes", "commentsCount"],
          },
        },
      },
    });

    if (signal?.aborted) {
      return [];
    }

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const data: GeminiPostResponse[] = JSON.parse(text);
    return data.map((item, index): Post => ({
      id: `post-${index}-${Date.now()}`,
      userId: `user-${index}`,
      user: {
        id: `user-${index}`,
        username: item.username.toLowerCase().replace(/\s+/g, '_'),
        fullName: item.fullName,
        avatar: `https://picsum.photos/seed/${item.username}/150/150`,
      },
      imageUrl: `https://picsum.photos/seed/post-${index}-${Date.now()}/1080/1080`,
      caption: item.caption,
      location: item.location,
      likes: item.likes,
      commentsCount: item.commentsCount,
      createdAt: "JUST NOW",
      updatedAt: "JUST NOW",
    }));
  } catch (error) {
    console.error("Error generating posts with Gemini:", error);
    // Return mock data on error
    return generateMockPosts(count);
  }
}
