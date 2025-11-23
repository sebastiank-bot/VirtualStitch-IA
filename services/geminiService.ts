import { GoogleGenAI } from "@google/genai";
import { ViewType, ImageQuality, GarmentState, Language } from "../types";

// Helper to convert File to Base64 (stripping the data URL prefix for the SDK if needed, 
// though the SDK often handles base64 data. We will format it for inlineData).
const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateStylistOpinion = async (
  personFile: File,
  garments: GarmentState[],
  lang: Language
): Promise<string> => {
  if (!process.env.API_KEY) {
    // If no key, we can't generate opinion. Return empty.
    return "";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash"; // Excellent for text/multimodal reasoning

  const personPart = await fileToPart(personFile);
  const garmentParts = await Promise.all(
    garments
      .filter(g => g.file !== null)
      .map(g => fileToPart(g.file!))
  );

  // Map language code to full English name for the system instruction to ensure compliance
  const languageMap: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'pt': 'Portuguese'
  };
  const targetLang = languageMap[lang] || 'English';

  const miaPersona = `
    ROLE: You are Mía, a professional Image Consultant.
    
    TASK: Provide a brief, professional opinion on how these garments look on the person.
    
    RULES:
    1. LANGUAGE: Output EXCLUSIVELY in ${targetLang}. Do not use English unless the requested language is English.
    2. TONE: Professional, human, and direct. Avoid complex fashion jargon; make it easy for anyone to understand. Be honest—if something doesn't fit well, say it politely.
    3. LENGTH: Keep it SHORT (max 50-60 words). One fluid paragraph.
    4. STRUCTURE:
       - Brief critique of the combination (colors, fit).
       - Suggest specific items (shoes, accessories) to complete the look.
  `;

  const prompt = `Analyze this person (Image 1) and these garments (Subsequent Images). Provide your professional opinion in ${targetLang}.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          personPart,
          ...garmentParts,
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: miaPersona
      }
    });

    return response.text || "";
  } catch (error) {
    console.warn("Failed to generate stylist opinion", error);
    return "";
  }
};

export const generateTryOnView = async (
  personFile: File,
  personDesc: string,
  garments: GarmentState[],
  viewType: ViewType,
  quality: ImageQuality = 'standard',
  customPrompt: string = ''
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing from environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare parts
  const personPart = await fileToPart(personFile);
  
  const garmentParts = await Promise.all(
    garments
      .filter(g => g.file !== null)
      .map(g => fileToPart(g.file!))
  );

  // Construct description of all garments
  let outfitDescriptionBlock = "";
  garments.forEach((g, index) => {
    if (g.file && g.description) {
      outfitDescriptionBlock += `   - Garment ${index + 1}: ${g.description}\n`;
    }
  });

  const promptText = `
    You are a professional fashion photographer and stylist AI.
    
    Task: Create a photorealistic fashion image.
    
    INPUTS:
    1. Reference Image 1 is the MODEL.
    ${garmentParts.map((_, i) => `${i + 2}. Reference Image ${i + 2} is Garment Item #${i + 1}.`).join('\n    ')}
    
    GOAL: Visualize the MODEL wearing ALL the provided GARMENT ITEMS together as a complete outfit.
    
    Model Description: ${personDesc}
    
    Garment Details:
    ${outfitDescriptionBlock}
    
    Specific View/Style: ${viewType}

    Additional Style/Atmosphere Instructions (Important): ${customPrompt}
    
    Requirements:
    - Maintain the facial features and body type of the Model reference.
    - combine all garment items naturally onto the model.
    - Accurately render the textures, colors, and fit of the garments.
    - High quality, cinematic lighting.
    - Background should be neutral or complementary minimal studio setting.
  `;

  // Use Gemini 2.5 Flash Image for testing/wider availability as requested.
  // This avoids the strict permission/billing requirements of gemini-3-pro-image-preview.
  const modelName = 'gemini-2.5-flash-image';
  
  const config: any = {};
  
  // Note: gemini-2.5-flash-image does NOT support imageSize configuration.
  // We ignore the 'quality' parameter for this model to avoid InvalidArgument errors.
  // If we switch back to gemini-3-pro-image-preview later, we can uncomment logic for 1K/2K/4K.

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          personPart,
          ...garmentParts,
          { text: promptText }
        ]
      },
      config: config
    });

    // Extract image
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateRunwayVideo = async (
  imageBase64Data: string, // Pure base64 data without data:image prefix
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing from environment variables.");
  }

  // Create a new instance to ensure key freshness
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = "A high-fashion runway video of this model walking, showcasing the outfit details, cinematic lighting, 4k resolution, confident walk, photorealistic.";

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBase64Data,
        mimeType: 'image/png', // Assuming PNG from our generation output
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p', // Veo Fast supports 720p
        aspectRatio: '9:16' // Portrait for fashion
      }
    });

    // Polling for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) {
      throw new Error("Failed to get video URI from operation response.");
    }

    // Fetch the actual video bytes using the key
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Veo Video Generation Error:", error);
    throw error;
  }
};