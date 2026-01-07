
import React, { useState, useEffect, useRef } from 'react';
import { Message, AppMode, Lesson } from './types';
import RobotAvatar from './components/RobotAvatar';
import ChatMessage from './components/ChatMessage';
import { getGeminiResponse, generateSpeech } from './services/gemini';
import { decodeBase64, decodeAudioData } from './utils/audio';
import { 
  Send, 
  BookOpen, 
  MessageSquare, 
  Home, 
  ChevronRight, 
  X,
  Sparkles,
  Award,
  Mic,
  Volume2
} from 'lucide-react';

const LESSONS: Lesson[] = [
  { 
    id: 'l1', 
    title: 'Saudações & Apresentações', 
    level: 'Débutant', 
    description: 'Aprenda a dizer "Bonjour" e se apresentar corretamente.',
    icon: '👋'
  },
  { 
    id: 'l2', 
    title: 'No Restaurante', 
    level: 'Débutant', 
    description: 'Como pedir um croissant e um café au lait sem medo.',
    icon: '☕'
  },
  { 
    id: 'l3', 
    title: 'Direções & Viagem', 
    level: 'Intermédiaire', 
    description: 'Encontre o caminho para a Torre Eiffel!',
    icon: '📍'
  },
  { 
    id: 'l4', 
    title: 'Falando sobre Hobbies', 
    level: 'Intermédiaire', 
    description: 'Fale sobre o que você gosta de fazer no tempo livre.',
    icon: '🎨'
  }
];

const SYSTEM_INSTRUCTION = `
Você é "Benoît", um robô amigável e entusiasmado que ensina francês.
Suas regras:
1. Responda primariamente em francês, mas sempre forneça a tradução em português entre parênteses para frases complexas.
2. Seja pedagógico: se o usuário errar, corrija gentilmente.
3. Use emojis de robô (🤖, ⚙️, 🔋) ocasionalmente.
4. Mantenha as respostas curtas e focadas na conversa.
5. Se estiver em uma lição específica, foque no vocabulário dessa lição.
6. Incentive o usuário a repetir frases.
`.trim();

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const context = activeLesson 
        ? `Atenção: Estamos na lição "${activeLesson.title}". O objetivo é ${activeLesson.description}.` 
        : "Conversa livre em francês.";
        
      const responseText = await getGeminiResponse(
        [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        `${SYSTEM_INSTRUCTION}\n\nContexto Atual: ${context}`
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || 'Désolé, j\'ai un bug! 🤖 (Desculpe, eu tive um erro!)',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-play the first response in a lesson or if the user is idle
      if (messages.length < 2) {
        handlePlayAudio(assistantMessage.content);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  const handlePlayAudio = async (text: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(
          decodeBase64(base64Audio),
          audioContextRef.current,
          24000,
          1
        );
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (error) {
      console.error('TTS Error:', error);
    }
  };

  const startLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setMode(AppMode.LESSON);
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: `Salut ! Enchanté ! 🤖 Hoje vamos começar a lição: **${lesson.title}**. Você está pronto? (Vous êtes prêt ?)`,
      timestamp: Date.now()
    }]);
  };

  const startFreeChat = () => {
    setMode(AppMode.CHAT);
    setActiveLesson(null);
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: "Bonjour ! Je suis Benoît. Vamos conversar um pouco em francês? Sobre o que você quer falar hoje? 🤖✨",
      timestamp: Date.now()
    }]);
  };

  const goHome = () => {
    setMode(AppMode.HOME);
    setActiveLesson(null);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-robot font-bold text-xl text-blue-900 tracking-tight">Benoît</h1>
            <p className="text-xs text-slate-500 font-medium">Votre tuteur de Français</p>
          </div>
        </div>
        
        {mode !== AppMode.HOME && (
          <button 
            onClick={goHome}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {mode === AppMode.HOME ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
            <div className="mt-8 mb-12 text-center">
              <RobotAvatar size="lg" />
              <h2 className="text-3xl font-bold mt-6 text-slate-800">Pronto para aprender?</h2>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Eu sou o Benoît, seu companheiro robótico para dominar a língua francesa de forma divertida e prática.
              </p>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BookOpen size={16} /> Lições Estruturadas
                </h3>
                <div className="grid gap-3">
                  {LESSONS.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => startLesson(lesson)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-4 group"
                    >
                      <span className="text-3xl">{lesson.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-800">{lesson.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            lesson.level === 'Débutant' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {lesson.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{lesson.description}</p>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MessageSquare size={16} /> Prática Livre
                </h3>
                <button
                  onClick={startFreeChat}
                  className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform text-left relative overflow-hidden group"
                >
                  <div className="relative z-10">
                    <h4 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      Conversa Aberta <Sparkles size={20} className="text-blue-200" />
                    </h4>
                    <p className="text-blue-100 text-sm opacity-90">
                      Fale sobre qualquer assunto e receba correções em tempo real. Melhore sua fluidez conversando comigo!
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm font-bold text-sm">
                      Começar agora <ChevronRight size={16} />
                    </div>
                  </div>
                  <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:scale-110 transition-transform">
                    <RobotAvatar size="lg" />
                  </div>
                </button>

                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                    <Award size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Desafio Diário</h4>
                    <p className="text-xs text-slate-500">Aprenda 5 palavras novas hoje e ganhe uma medalha virtual!</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.map(msg => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  onPlayAudio={handlePlayAudio}
                />
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Benoît está pensando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={activeLesson ? `Lição: ${activeLesson.title}...` : "Diga algo em francês ou português..."}
                    className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 pr-12"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isThinking}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                      input.trim() && !isThinking 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
                
                <button 
                  className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center group"
                  title="Falar (Em breve)"
                >
                  <Mic size={24} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <span className="flex items-center gap-1"><Volume2 size={12} /> Áudio Ativo</span>
                {activeLesson && <span className="flex items-center gap-1"><BookOpen size={12} /> Modo Lição</span>}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Navigation (Desktop Side / Mobile Bottom) */}
      <nav className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-around md:hidden">
        <button onClick={goHome} className={`flex flex-col items-center gap-1 ${mode === AppMode.HOME ? 'text-blue-600' : 'text-slate-400'}`}>
          <Home size={20} />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={startFreeChat} className={`flex flex-col items-center gap-1 ${mode === AppMode.CHAT ? 'text-blue-600' : 'text-slate-400'}`}>
          <MessageSquare size={20} />
          <span className="text-[10px] font-bold">Conversar</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
