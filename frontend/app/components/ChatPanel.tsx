'use client';

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { ChatMessage } from '../types';
import { Send } from 'lucide-react';

export default function ChatPanel({ roomId, socket }: { roomId: string, socket: Socket | null }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('chat_message', handleNewMessage);
    return () => {
      socket.off('chat_message', handleNewMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    
    socket.emit('send_chat', { roomId, message: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0e12] border border-zinc-800/40 rounded-2xl overflow-hidden shadow-xl">
      <div className="bg-[#181920] border-b border-zinc-800 px-4 py-3 font-bold text-sm text-zinc-300">
        Comms Channel
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-zinc-500 mb-1">{msg.user?.nickname || 'Unknown'}</span>
            <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
              msg.userId === user?.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 bg-[#181920] border-t border-zinc-800 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Transmit message..."
          className="flex-1 bg-[#060709] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button type="submit" disabled={!input.trim()} className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
