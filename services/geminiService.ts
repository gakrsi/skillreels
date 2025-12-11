import { GoogleGenAI, Modality } from "@google/genai";
import { ReelItem } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * 1. Generate the Learning Plan (Streaming Text Content)
 * Uses gemini-2.5-flash with streaming to populate UI immediately.
 * Requests NDJSON (Newline Delimited JSON) for easy parsing.
 */
export const streamLearningReels = async (
  topic: string, 
  onReelReceived: (reel: ReelItem) => void,
  mode: 'learn' | 'quiz' | 'deep-dive' = 'learn'
): Promise<void> => {
  try {
    let promptContext = "";
    if (mode === 'quiz') {
      promptContext = "Create a series of multiple-choice quiz questions or thought-provoking challenges to test the user's knowledge on this topic. The 'shortNote' should be the question, and the 'narrationScript' should provide a hint or context.";
    } else if (mode === 'deep-dive') {
      promptContext = "Create an advanced, in-depth deep dive into specific complex nuances of this topic. Assume the user knows the basics.";
    } else {
      promptContext = "Break this topic down into a logical sequence of subtopics for a beginner.";
    }

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: `Role: Expert Educational Content Creator.
      Task: Create a series of "Reels" (short vertical learning cards) for the topic: "${topic}".
      Context: ${promptContext}
      
      Requirements:
      1. Determine the optimal number of reels (between 5 and 10) to effectively cover the topic.
      2. Output strictly in **JSON Lines (NDJSON)** format. 
      3. Each line must be a valid, standalone JSON object.
      4. DO NOT wrap the whole result in an array [].
      5. DO NOT use Markdown code blocks (\`\`\`json). Just raw text.
      
      Schema for each line:
      {
        "subtopic": "Brief Title",
        "shortNote": "Clean, insightful explanation (max 35 words).",
        "narrationScript": "Conversational script for audio (max 2 sentences).",
        "visualPrompt": "Abstract, cinematic, minimalist, award-winning visual description."
      }`,
    });

    let buffer = "";
    let index = 0;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (!text) continue;
      
      buffer += text;
      
      // Process buffer line by line
      const lines = buffer.split('\n');
      // Keep the last line in the buffer as it might be incomplete
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Strip potential markdown artifacts if the model disobeys
        const cleanLine = trimmedLine.replace(/^```json/, '').replace(/^```/, '').replace(/,$/, '');

        try {
          const data = JSON.parse(cleanLine);
          // Add ID and parent topic
          const item: ReelItem = {
            ...data,
            id: `${Date.now()}-${index++}`,
            topic: topic
          };
          onReelReceived(item);
        } catch (e) {
          // If a line fails to parse, it might be garbage or part of a multi-line format (unlikely with strict prompting)
          // We ignore it to prevent crashing the stream
          console.debug("Skipping invalid JSON line", cleanLine);
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const cleanLine = buffer.trim().replace(/^```json/, '').replace(/^```/, '').replace(/,$/, '');
        const data = JSON.parse(cleanLine);
        const item: ReelItem = {
          ...data,
          id: `${Date.now()}-${index++}`,
          topic: topic
        };
        onReelReceived(item);
      } catch (e) {
        // Ignore end of stream artifacts
      }
    }

  } catch (error) {
    console.error("Error generating stream:", error);
    throw error;
  }
};

/**
 * 2. Generate Image for a Reel Card
 * Uses gemini-2.5-flash-image
 */
export const generateReelImage = async (prompt: string): Promise<string> => {
  try {
    const enhancedPrompt = `Cinematic, award-winning editorial illustration, 8k resolution, minimalist composition, soft dramatic lighting, highly detailed, photorealistic or high-end 3D render style: ${prompt}. No text, no artifacts.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: enhancedPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");

  } catch (error) {
    console.error("Error generating image:", error);
    // Fallback gradient/placeholder
    return ""; 
  }
};

/**
 * 3. Generate Audio (TTS) for a Reel Card
 * Uses gemini-2.5-flash-preview-tts
 */
export const generateReelAudio = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    
    return `data:audio/mp3;base64,${base64Audio}`;

  } catch (error) {
    console.error("Error generating audio:", error);
    return "";
  }
};