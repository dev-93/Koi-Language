import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Sparkles } from 'lucide-react';
import useStore from '../store';
import { situations } from '../data/situations';
import { generateChatResponse } from '../utils/gemini';

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
        content: `안녕하세요! (${isKr ? situation.title.kr : situation.title.jp} 상황을 시작해볼까요? 목표 언어로 자유롭게 말 걸어주세요!)`
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
      // Exclude the first instruction message from actual history if needed, 
      // but let's just pass everything except internal identifiers
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

  if (!situation) return <div>상황을 찾을 수 없습니다.</div>;

  return (
    <div className="flex flex-col h-screen bg-[#FFF0F5]">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-white shadow-sm z-10 sticky top-0">
        <button onClick={() => navigate('/home')} className="p-2 border-none bg-transparent rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex flex-col">
          <h2 className="m-0 text-lg font-bold">{isKr ? situation.title.kr : situation.title.jp}</h2>
          <span className="text-xs text-pink-400 font-bold flex items-center gap-1">
            <Sparkles size={12}/> AI Roleplay
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          // Make tip bold if exists 
          const text = msg.content;
          const tipIndex = text.indexOf('💡 Tip:');
          let mainText = text;
          let tipText = '';
          
          if (tipIndex !== -1) {
            mainText = text.substring(0, tipIndex).trim();
            tipText = text.substring(tipIndex);
          }

          return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`chat-bubble ${isUser ? 'user' : 'ai'}`}>
                <div>{mainText}</div>
                {tipText && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 font-bold leading-relaxed">
                    {tipText}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="chat-bubble ai flex items-center gap-2">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-100">●</span>
              <span className="animate-pulse delay-200">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-pink-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`${isKr ? '일본어' : '한국어'}로 말해보세요!`}
            className="flex-1 py-3 px-4 rounded-full border border-pink-200 bg-gray-50 focus:bg-white transition-all"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-4 rounded-full flex items-center justify-center transition-all ${
              input.trim() && !isLoading ? 'bg-pink-400 text-white shadow-md' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
