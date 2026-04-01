import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getSketchFeedback(imageUri: string, tutorialTitle: string, tutorialDescription: string) {
  try {
    // Extract base64 data from URI
    const base64Data = imageUri.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `You are an expert Character Animation Instructor. 
              The user is practicing drawing a pose: "${tutorialTitle}". 
              Tutorial Description: "${tutorialDescription}".
              
              Analyze their sketch specifically based on anatomical focus (e.g., Line of Action, Weight Distribution, Squash and Stretch).
              Point out one strength and one area for improvement. 
              Be encouraging and professional. Keep it concise.`
            },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/png"
              }
            }
          ]
        }
      ]
    });

    return response.text;
  } catch (error) {
    console.error("Error getting sketch feedback:", error);
    return "Sorry, I couldn't analyze your sketch right now. Keep practicing!";
  }
}
