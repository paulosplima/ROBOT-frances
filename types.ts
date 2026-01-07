
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  timestamp: number;
}

export interface Lesson {
  id: string;
  title: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  description: string;
  icon: string;
}

export enum AppMode {
  HOME = 'home',
  LESSON = 'lesson',
  CHAT = 'chat'
}
