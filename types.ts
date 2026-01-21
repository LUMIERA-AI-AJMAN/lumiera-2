
export enum Role {
  USER = 'user',
  ASSISTANT = 'model'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number; // Using number for easier sorting (Date.now())
  imageParts?: { data: string; mimeType: string; }[]; // Added for image generation
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

// Refactored ModelType definition to avoid 'as const'
// Define the runtime object
export const ModelTypeValues = {
  PRO: 'gemini-3-pro-preview', // Corrected to align with guidelines
  FLASH: 'gemini-flash-latest', // Corrected to align with guidelines
  LITE: 'gemini-flash-lite-latest',
  IMAGE_CREATOR: 'gemini-2.5-flash-image' // Added for image generation
};

// Define the TypeScript type as a union of the object's values
export type ModelType = typeof ModelTypeValues[keyof typeof ModelTypeValues];