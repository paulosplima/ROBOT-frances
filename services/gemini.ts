
import { GoogleGenAI, Modality } from "@google/genai";

export const getGeminiResponse = async (messages: {role: string, content: string}[], systemInstruction: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  return response.text;
};

export const generateSpeech = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Dites avec uma voz amicale et claire : ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
