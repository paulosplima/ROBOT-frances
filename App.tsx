
import React, { useState, useEffect, useRef } from 'react';
import { Message, AppMode, Lesson } from './types.ts';
import RobotAvatar from './components/RobotAvatar.tsx';
import ChatMessage from './components/ChatMessage.tsx';
import { getGeminiResponse, generateSpeech } from './services/gemini.ts';
import { decodeBase64, decodeAudioData } from './utils/audio.ts';
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
  Volume2,
  Heart
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
    title: 'Encontros e Networking', 
    level: 'Débutant', 
    description: 'Perfeito para o Matchin: como puxar assunto em francês.',
    icon: '🤝'
  },
  { 
    id: 'l3', 
    title: 'Direções & Viagem', 
    level: 'Intermédiaire', 
    description: 'Encontre o caminho para os melhores lugares de Paris!',
    icon: '📍'
  },
  { 
    id: 'l4', 
    title: 'Cultura & Estilo de Vida', 
    level: 'Intermédiaire', 
    description: 'Fale sobre cinema, música e a arte de viver francesa.',
    icon: '🍷'
  }
];

const SYSTEM_INSTRUCTION = `
Você é "Benoît", o robô tutor de francês exclusivo da plataforma Matchin (matchin.com.br).
Sua personalidade: Amigável, moderno, encorajador e um pouco nerd.
Suas regras:
1. Responda primariamente em francês, fornecendo sempre a tradução em português entre parênteses para frases ou palavras novas.
2. Ajude o usuário a se preparar para conexões reais (o espírito da Matchin).
3. Seja pedagógico: corrija erros gramaticais de forma leve.
4. Use emojis (🤖, ✨, 🇫🇷, ⚙️).
5. Incentive a pronúncia pedindo ao usuário para repetir em voz alta.
6. Mencione ocasionalmente que aprender francês ajuda a encontrar novos "matches" culturais.
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
        ? `Lição ativa na Matchin: "${activeLesson.title}". Foco em: ${activeLesson.description}.` 
        : "Conversa livre com um aluno da Matchin.";
        
      const responseText = await getGeminiResponse(
        [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        `${SYSTEM_INSTRUCTION}\n\nContexto: ${context}`
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || 'Zut! J\'ai un petit problema técnico... (Ops! Tive um probleminha técnico...) 🤖',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
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
      content: `Salut ! Prêt para seu próximo match com a língua francesa? 🇫🇷 Hoje na Matchin vamos dominar: **${lesson.title}**. On y va ? (Vamos nessa?)`,
      timestamp: Date.now()
    }]);
  };

  const startFreeChat = () => {
    setMode(AppMode.CHAT);
    setActiveLesson(null);
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: "Bonjour ! Eu sou o Benoît da Matchin. Vamos bater um papo em francês? Me conte sobre você! 🤖✨",
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
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="matchin-gradient p-2 rounded-xl">
            <Heart className="text-white fill-current" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 text-xs tracking-widest uppercase">Matchin</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <h1 className="font-robot font-bold text-lg text-indigo-900 tracking-tight">Benoît</h1>
            </div>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Tutor de Francês</p>
          </div>
        </div>
        
        {mode !== AppMode.HOME ? (
          <button 
            onClick={goHome}
            className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors text-xs font-bold"
          >
            <X size={14} /> SAIR
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-4">
             <a href="https://matchin.com.br" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">MATCHIN.COM.BR</a>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {mode === AppMode.HOME ? (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
            <div className="mt-8 mb-12 text-center">
              <div className="relative inline-block">
                <RobotAvatar size="lg" />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg border-4 border-white">
                   <Heart size={20} className="fill-current" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold mt-8 text-slate-800 tracking-tight">Encontre seu match com o Francês</h2>
              <p className="text-slate-500 mt-3 max-w-md mx-auto text-sm leading-relaxed">
                Exclusivo para a comunidade <span className="text-indigo-600 font-bold">Matchin</span>. Aprenda francês de um jeito que você realmente vai usar.
              </p>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                  <BookOpen size={14} /> Trilhas de Aprendizado
                </h3>
                <div className="grid gap-3">
                  {LESSONS.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={() => startLesson(lesson)}
                      className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all text-left flex items-center gap-5 group"
                    >
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {lesson.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-800">{lesson.title}</h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                            lesson.level === 'Débutant' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {lesson.level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{lesson.description}</p>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-all" size={20} />
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                  <MessageSquare size={14} /> Conversação
                </h3>
                <button
                  onClick={startFreeChat}
                  className="w-full matchin-gradient p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 hover:scale-[1.03] active:scale-95 transition-all text-left relative overflow-hidden group"
                >
                  <div className="relative z-10">
                    <h4 className="text-2xl font-black mb-2 flex items-center gap-2">
                      Papo Aberto <Sparkles size={22} className="text-indigo-200" />
                    </h4>
                    <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-90 max-w-[200px]">
                      Ideal para quem já quer se jogar nas conversas e conexões da Matchin.
                    </p>
                    <div className="mt-8 inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
                      Falar agora <ChevronRight size={14} />
                    </div>
                  </div>
                  <div className="absolute -right-6 -bottom-6 opacity-30 group-hover:scale-110 transition-transform rotate-12">
                    <RobotAvatar size="lg" />
                  </div>
                </button>

                <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-300 flex items-center gap-5">
                  <div className="bg-amber-50 p-4 rounded-2xl text-amber-500">
                    <Award size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Selo Poliglota</h4>
                    <p className="text-xs text-slate-500">Complete 3 diálogos para ganhar o selo no seu perfil matchin.</p>
                  </div>
                </div>
              </section>
            </div>
            
            <footer className="mt-16 pb-8 text-center">
               <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">
                 © 2024 MATCHIN.COM.BR • Powered by Gemini
               </p>
            </footer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full bg-slate-50">
            <div className="bg-white/80 backdrop-blur-md px-6 py-2 border-b border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                {activeLesson ? `Módulo: ${activeLesson.title}` : 'Sessão de Conversa Matchin'}
              </div>
              <div className="flex items-center gap-4">
                 <span className="flex items-center gap-1"><Volume2 size={12} /> Áudio On</span>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
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
                  <div className="bg-white px-6 py-4 rounded-3xl rounded-tl-none border border-slate-100 shadow-md flex items-center gap-4">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Benoît está digitando...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-slate-200">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={activeLesson ? `Traduzir para "${activeLesson.title}"...` : "Escreva em francês ou peça ajuda..."}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-6 py-5 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all text-slate-800 placeholder:text-slate-400 pr-14 shadow-inner"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isThinking}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                      input.trim() && !isThinking 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'bg-slate-100 text-slate-300'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
                
                <button 
                  className="p-5 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-all flex items-center justify-center group shadow-sm"
                  title="Recurso de Voz (Em breve na Matchin)"
                >
                  <Mic size={24} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-around md:hidden">
        <button onClick={goHome} className={`flex flex-col items-center gap-1.5 transition-colors ${mode === AppMode.HOME ? 'text-indigo-600' : 'text-slate-300'}`}>
          <Home size={22} className={mode === AppMode.HOME ? 'fill-indigo-50' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Início</span>
        </button>
        <button onClick={startFreeChat} className={`flex flex-col items-center gap-1.5 transition-colors ${mode === AppMode.CHAT ? 'text-indigo-600' : 'text-slate-300'}`}>
          <MessageSquare size={22} className={mode === AppMode.CHAT ? 'fill-indigo-50' : ''} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Chat</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
