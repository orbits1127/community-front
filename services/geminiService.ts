
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generatePosts(count: number = 5) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    const data = JSON.parse(response.text);
    return data.map((item: any, index: number) => ({
      id: `post-${index}-${Date.now()}`,
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
    }));
  } catch (error) {
    console.error("Error generating posts with Gemini:", error);
    return [];
  }
}
