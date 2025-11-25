import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat', { message: input });
      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'Maaf, terjadi kesalahan saat menghubungi server AI. Silakan coba lagi.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Buka file picker
  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  // Tangani file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const userMessage = { role: 'user', content: `📎 Mengirim file: ${file.name}` };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = { 
        role: 'assistant', 
        content: 'Gagal mengirim file. Silakan coba lagi.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    '📦 Produk tersedia',
    '💰 Harga Laptop',
    '📱 iPhone 15 Pro',
    '🎮 Gaming Setup'
  ];

  const handleQuickQuestion = (question) => {
    setInput(question.replace(/^[^\s]+\s/, ''));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <div className="text-5xl">👋</div>
            <div>
              <p className="text-base font-semibold text-gray-800">Hai! Saya MinSkyrx</p>
              <p className="text-sm text-gray-500 mt-1">Ada yang bisa saya bantu?</p>
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pertanyaan Cepat</p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="bg-white border border-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition text-left shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-br-md' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-md shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFileClick}
            className="text-gray-400 hover:text-teal-600 transition p-2"
            title="Attach file"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tanyakan apapun pada Skyrx AI..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition text-sm"
            disabled={loading}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-teal-600 text-white p-2.5 rounded-full hover:bg-teal-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
            title="Send"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
