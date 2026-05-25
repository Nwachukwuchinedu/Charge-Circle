'use client';

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { useChatSocket } from '../../hooks/useChatSocket';
import { ChatMessage } from '../types';
import { Send } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';

export default function ChatPanel({ roomId, socket, messages }: { roomId: string, socket: Socket | null, messages: ChatMessage[] }) {
  const { user } = useAuth();
  const { sendMessage } = useChatSocket(socket);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage(roomId, input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0e12] border border-zinc-800/40 rounded-2xl overflow-hidden shadow-xl">
      <div className="bg-[#181920] border-b border-zinc-800 px-4 py-3 font-bold text-sm text-zinc-300">
        Comms Channel
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Transmit message..."
          className="flex-1 rounded-lg px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={!input.trim()} variant="primary" className="p-2 rounded-lg">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
