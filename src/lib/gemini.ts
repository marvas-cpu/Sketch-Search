import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey.trim() === "") {
      // Fallback to default API key to ensure it works correctly on Vercel deployments
      apiKey = "AIzaSyBQLB14x3uaLCEIDGixEdK_FamhPJZplbM";
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

async function getBase64FromUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  
  // Use cache-busting to prevent browser from returning non-CORS cached images (which taints canvas or blocks fetch)
  const separator = url.includes('?') ? '&' : '?';
  const cacheBustUrl = `${url}${separator}cb=${Date.now()}`;
  
  try {
    // Attempt 1: Fetch directly (with cache-buster)
    const res = await fetch(cacheBustUrl);
    if (!res.ok) throw new Error("Fetch response not OK");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Direct fetch for base64 failed, trying Canvas with crossOrigin anonymous:", err);
  }

  try {
    // Attempt 2: Image element with crossOrigin and cache-buster
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const promise = new Promise<string | null>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
    });
    img.src = cacheBustUrl;
    
    const res = await Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    ]);
    if (res) return res;
  } catch (e) {
    console.error("Base64 conversion failed:", e);
  }
  
  return null;
}

export async function getSketchFeedback(
  imageUri: string, 
  tutorialTitle: string, 
  tutorialDescription: string, 
  tutorialLevel?: string,
  referenceImageUrl?: string | null
) {
  try {
    const ai = getAI();
    // Extract base64 data from URI
    const base64Data = imageUri.split(',')[1];
    
    // Get reference photo base64
    let referenceBase64: string | null = null;
    if (referenceImageUrl) {
      const converted = await getBase64FromUrl(referenceImageUrl);
      if (converted && converted.includes(',')) {
        referenceBase64 = converted.split(',')[1];
      }
    }

    const parts: any[] = [
      {
        text: `You are an expert art instructor and visual analysis agent.
Your task is to compare the student's "User Sketch" image to the "Reference Photo" (the original tutorial image goal) titled "${tutorialTitle}" (difficulty: ${tutorialLevel || 'General'}) with description: "${tutorialDescription}".

Please compare the student's "User Sketch" (provided first below) to the "Reference Photo" (provided second below as the original image) very carefully.
Observe the key anatomical lines, proportions, and shape matching to calculate a realistic percentage similarity score (0-100%). Be accurate and objective in your assessment.

Analyze the User Sketch in comparison to the Reference Photo based on the following core artistic criteria:
1. Proportions & Scale (accuracy of sizes, spacing, and placement).
2. Shapes & Contours (how well the outlines and forms match the original).
3. Detail Accuracy (key features from the tutorial).

Output your response strictly in Greek, using the following structured format exactly:

### 1. Ποσοστό Ομοιότητας
**[Insert Percentage]%** (Provide a realistic percentage based on your comparison. 100% means an exact replica, while lower percentages indicate deviations in shape, proportion, or details).

### 2. Ανάλυση Κριτηρίων
* **Αναλογίες & Κλίμακα:** [Briefly explain how well the proportions match]
* **Σχήματα & Γραμμές:** [Briefly evaluate the accuracy of the contours and shapes]

### 3. Σημεία για Βελτίωση
* [Provide 1-2 constructive bullet points on what the user needs to fix to get closer to the reference photo]
`
      },
      {
        text: "Student's User Sketch:"
      },
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/png"
        }
      }
    ];

    if (referenceBase64) {
      parts.push(
        {
          text: "Original Reference Photo:"
        },
        {
          inlineData: {
            data: referenceBase64,
            mimeType: "image/png"
          }
        }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: parts
        }
      ]
    });

    return response.text;
  } catch (error) {
    console.error("Error getting sketch feedback:", error);
    return "Sorry, I couldn't analyze your sketch right now. Keep practicing!";
  }
}
