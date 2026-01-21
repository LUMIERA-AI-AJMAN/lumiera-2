
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { Message, Role, ModelType } from "../types";

const initializeGemini = () => {
  // Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key.
  return new GoogleGenAI({ apiKey: process.env.API_KEY! });
};

export const gemini = {
  async streamChat(messages: Message[], modelType: ModelType): Promise<string> {
    const ai = initializeGemini();

    // The 'messages' array contains the full history, including the current user message at the end.
    // We need to separate the current user message from the rest of the history.
    const userMessage = messages[messages.length - 1]; // This is the current message to send
    const chatHistory = messages.slice(0, messages.length - 1); // This is the preceding history

    if (!userMessage || userMessage.role !== Role.USER) {
      throw new Error("Invalid messages array: The last message must be a user message.");
    }

    // Format the historical messages for the `history` parameter of `ai.chats.create`.
    const formattedHistory: Content[] = chatHistory.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model', // Map our Role to API role
      parts: [{ text: msg.content }],
    }));

    // Create a new chat instance with the entire conversation history (excluding the current user message).
    const chat = ai.chats.create({
      model: modelType,
      history: formattedHistory, // Pass the formatted history here
    });

    // Send only the current user message. The 'chat' instance will manage the ongoing history.
    const streamResponse = await chat.sendMessageStream({ message: userMessage.content });

    let fullContent = '';
    for await (const chunk of streamResponse) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        fullContent += c.text;
      }
    }
    return fullContent;
  },

  async enhancePrompt(prompt: string): Promise<string> {
    const ai = initializeGemini();
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', // Corrected to gemini-flash-latest for quick prompt enhancement, aligned with guidelines
      contents: [
        { role: 'user', parts: [{ text: `Refine the following prompt to be more clear, concise, and effective for an AI. Focus on making it actionable and comprehensive without changing its core intent. Return only the refined prompt text.\n\nOriginal prompt: "${prompt}"` }] }
      ],
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      }
    });
    return response.text?.trim() || prompt;
  },

  async generateImage(prompt: string): Promise<{ data: string; mimeType: string; }[] | null> {
    const ai = initializeGemini();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Default for general image tasks, no special API key needed
      contents: {
        parts: [
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", // Default to square images
          imageSize: "1K" // Default to 1K resolution
        },
      }
    });

    const imageParts: { data: string; mimeType: string; }[] = [];
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageParts.push({
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          });
        }
      }
    }
    return imageParts.length > 0 ? imageParts : null;
  }
};