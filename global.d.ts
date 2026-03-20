// global.d.ts
declare global {
  interface Window {
    feedback: {
      send: (
        message: string,
        email?: string
      ) => Promise<{ success: boolean; error?: string }>;
    };
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export {};
