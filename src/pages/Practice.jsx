import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Sparkles, Home } from 'lucide-react';
import useStore from '../store';
import { situations } from '../data/situations';
import { generateChatResponse } from '../utils/gemini';
import { motion } from 'framer-motion';

export default function Practice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sitId = parseInt(id, 10);
  const situation = situations.find(s => s.id === sitId);
  const isKr = userProfile.myNationality === 'KR';

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        role: 'model',
        content: `안녕하세요! (${isKr ? situation.title.kr : situation.title.jp} 상황을 시작해볼까요? 상대방에게 호감을 표현해보세요!)`
      }]);
    }
  }, [messages.length, situation, isKr]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = newMessages.slice(1).map(m => ({ 
        role: m.role, 
        content: m.content 
      }));
      
      const replyText = await generateChatResponse(historyForApi, userProfile, situation);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'model',
        content: replyText
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'model',
        content: '죄송해요, 응답을 받아오는데 실패했어요. 다시 말씀해주세요!'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!situation) return <div className="p-10 text-center">상황을 찾을 수 없습니다.</div>;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md shadow-sm z-10 sticky top-0 border-b border-pink-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="p-2 border-none bg-gray-50 rounded-full hover:bg-gray-100 transition-all">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <div className="flex flex-col">
            <h2 className="m-0 text-[17px] font-black text-gray-800">{isKr ? situation.title.kr : situation.title.jp}</h2>
            <span className="text-[10px] text-pink-500 font-black flex items-center gap-1 uppercase tracking-widest">
              <Sparkles size={10} fill="#FF8A8A"/> AI Roleplay Live
            </span>
          </div>
        </div>
        <button onClick={() => navigate('/home')} className="p-2 border-none bg-transparent rounded-full hover:bg-gray-100">
           <Home size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const text = msg.content;
          const tipIndex = text.indexOf('💡 Tip:');
          let mainText = text;
          let tipText = '';
          
          if (tipIndex !== -1) {
            mainText = text.substring(0, tipIndex).trim();
            tipText = text.substring(tipIndex);
          }

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={msg.id} 
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`shadow-sm ${isUser ? 'chat-bubble user bg-[#FF8A8A]' : 'chat-bubble ai bg-white border border-pink-50'}`} style={{ borderRadius: isUser ? '24px 24px 4px 24px' : '24px 24px 24px 4px', padding: '16px 20px' }}>
                <div className="text-[15px] font-bold leading-relaxed">{mainText}</div>
                {tipText && (
                  <div className={`mt-3 pt-3 border-t text-[12px] font-bold leading-relaxed ${isUser ? 'border-white/20 text-white/80' : 'border-gray-100 text-[#FF8A8A]'}`}>
                    {tipText}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="bg-white border border-pink-50 rounded-[20px] rounded-bl-none px-5 py-4 flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-pink-50 pb-10">
        <div className="flex gap-3 bg-gray-50 p-1.5 rounded-[28px] border border-gray-100 shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`${isKr ? '일어' : '한어'}로 말을 걸어보세요...`}
            className="flex-1 py-3 px-5 rounded-full border-none bg-transparent focus:outline-none font-bold text-gray-800 placeholder:text-gray-300"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
              input.trim() && !isLoading ? 'bg-pink-500 text-white hover:scale-105 active:scale-95' : 'bg-gray-200 text-white'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
