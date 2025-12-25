/**
 * @fileoverview Dictation functionality for voice input
 */

// Speech Recognition types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

export class Dictation {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResult: ((text: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onStatusChange: ((status: string) => void) | null = null;

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    this.recognition = new SpeechRecognitionClass();
    
    if (!this.recognition) return;
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.getLanguageCode();

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStatusChange?.('listening');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        this.onResult?.(finalTranscript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      let errorMessage = 'Voice input error';
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone permission denied';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected';
          break;
        case 'network':
          errorMessage = 'Network error';
          break;
        default:
          errorMessage = 'Voice input error';
      }
      
      this.onError?.(errorMessage);
      this.onStatusChange?.('error');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStatusChange?.('stopped');
    };
  }

  private getLanguageCode(): string {
    const currentLang = localStorage.getItem('ledebe-language') || 'en';
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'ar': 'ar-SA',
      'zh': 'zh-CN'
    };
    return langMap[currentLang] || 'en-US';
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(
    onResult: (text: string) => void,
    onError: (error: string) => void,
    onStatusChange: (status: string) => void
  ): void {
    if (!this.recognition || this.isListening) return;

    this.onResult = onResult;
    this.onError = onError;
    this.onStatusChange = onStatusChange;

    try {
      this.recognition.lang = this.getLanguageCode();
      this.recognition.start();
    } catch (error) {
      this.onError('Failed to start voice input');
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const dictation = new Dictation();