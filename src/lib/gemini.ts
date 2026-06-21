import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment");
    }
    aiInstance = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

export async function getSketchFeedback(imageUri: string, tutorialTitle: string, tutorialDescription: string, tutorialLevel?: string) {
  try {
    const ai = getAI();
    // Extract base64 data from URI
    const base64Data = imageUri.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: [
            {
              text: `You are an expert art instructor and visual analysis agent.
              Your task is to compare the student's "User Sketch" image to the "Reference Photo" / tutorial goal titled "${tutorialTitle}" (difficulty: ${tutorialLevel || 'General'}) with description: "${tutorialDescription}".

              Analyze the User Sketch in comparison to the Reference Photo based on the following core artistic criteria:
              1. Proportions & Scale (accuracy of sizes, spacing, and placement).
              2. Shapes & Contours (how well the outlines and forms match the original).
              3. Detail Accuracy (key features from the tutorial).

              Output your response strictly in Greek, using the following structured format:

              ### 1. Ποσοστό Ομοιότητας
              **[Insert Percentage]%** (Provide a realistic percentage based on your analysis. 100% means an exact replica, while lower percentages indicate deviations in shape, proportion, or details).

              ### 2. Ανάλυση Κριτηρίων
              * **Αναλογίες & Κλίμακα:** [Briefly explain how well the proportions match]
              * **Σχήματα & Γραμμές:** [Briefly evaluate the accuracy of the contours and shapes]

              ### 3. Σημεία για Βελτίωση
              * [Provide 1-2 constructive bullet points on what the user needs to fix to get closer to the reference photo]`
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
