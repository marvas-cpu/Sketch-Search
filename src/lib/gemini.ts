import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getSketchFeedback(imageUri: string, tutorialTitle: string, tutorialDescription: string, tutorialLevel?: string) {
  try {
    const ai = getAI();
    // Extract base64 data from URI
    const base64Data = imageUri.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `You are an expert Character Animation Instructor. 
              The user is copying a reference pose: "${tutorialTitle}" (Level: ${tutorialLevel || 'General'}). 
              Tutorial Description: "${tutorialDescription}".
              
              Follow these rules:
              1. **One Step at a Time**: Analyze the sketch but present only ONE teaching point or step at a time. Do not overwhelm them.
              2. **Anatomical Focus**: Explain the point in terms of Line of Action, Weight Distribution, or Squash and Stretch.
              3. **Wait State**: After giving feedback, explicitly ask the user to practice or refine that specific element. Use phrases like 'Let me know when you have adjusted the line of action' or 'Try to push the squash more, then show me your progress'.
              4. **Visual Critique**: Point out one strength and one specific area for improvement related to the single teaching point.
              5. **Tone**: Be encouraging, professional, and focus on principles of classic 2D animation. Keep it concise.`
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
