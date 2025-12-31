
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, Wand2, Terminal } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { OBSScene, OBSStats } from '../types/obs';

interface GeminiDirectorProps {
  scenes: OBSScene[];
  currentScene: string;
  stats: OBSStats | null;
  isStreaming: boolean;
  onSwitchScene: (name: string) => void;
}

const GeminiDirector: React.FC<GeminiDirectorProps> = ({ 
  scenes, 
  currentScene, 
  stats, 
  isStreaming,
  onSwitchScene 
}) => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "AI 监播就绪。我可以执行切换场景指令，或提供直播质量建议。" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        您是集成在 OBS 导播台的 AI 助手。
        数据：
        - 状态：${isStreaming ? '直播中' : '空闲'}
        - 当前场景：${currentScene}
        - 场景池：${scenes.map(s => s.sceneName).join(', ')}
        - 硬件：CPU ${stats?.cpuUsage.toFixed(1)}% / FPS ${stats?.activeFps.toFixed(0)}
        
        要求：
        1. 回复精简，专业导播风格。
        2. 若建议切镜，必须包含格式 [场景名]。
        
        用户："${userMsg}"
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setMessages(prev => [...prev, { role: 'assistant', content: result.text || "通信中断。" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ 通信错误。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#2b2e39] border border-[#131519] rounded-sm shadow-2xl overflow-hidden font-sans text-xs">
      <div className="h-6 px-2 border-b border-[#131519] bg-[#363a49] flex items-center space-x-2">
        <Sparkles size={11} className="text-blue-400" />
        <h3 className="font-bold text-[9px] uppercase tracking-wider text-gray-300">AI Director</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar bg-[#1c1e26]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] items-start space-x-1.5 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 border border-[#131519] ${msg.role === 'user' ? 'bg-[#4c5e91]' : 'bg-[#363a49]'}`}>
                {msg.role === 'user' ? <User size={10}/> : <Bot size={10} className="text-blue-400"/>}
              </div>
              <div className="space-y-1.5">
                <div className={`p-1.5 rounded-sm text-[10px] leading-snug ${msg.role === 'user' ? 'bg-[#4c5e91]/30 text-white border border-[#4c5e91]/50' : 'bg-[#2b2e39] text-gray-300 border border-[#131519]'}`}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.content.match(/\[(.*?)\]/) && (
                  <button onClick={() => { const m = msg.content.match(/\[(.*?)\]/); if (m) onSwitchScene(m[1]); }}
                    className="flex items-center space-x-1 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase transition border border-blue-800/50">
                    <Wand2 size={8}/>
                    <span>切换: {msg.content.match(/\[(.*?)\]/)?.[1]}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-1.5 bg-[#2b2e39] border-t border-[#131519]">
        <div className="relative">
          <Terminal className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-500" size={10}/>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="指令..."
            className="w-full bg-[#1c1e26] border border-[#131519] rounded-sm pl-6 pr-8 py-1 text-[10px] outline-none focus:border-[#4c5e91]" />
          <button onClick={sendMessage} className="absolute right-0.5 top-0.5 p-1 text-blue-400 hover:text-white transition">
            <Send size={10}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiDirector;
