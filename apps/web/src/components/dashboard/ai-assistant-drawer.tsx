'use client';

import { useState } from 'react';
import { apiClient } from '@/services/api-client';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  'What were today\'s sales?',
  'Which item sold the most this week?',
  'How many customers did we serve this month?',
  'What is our order cancellation rate?',
];

export function AIAssistantDrawer({ isOpen, onClose }: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    setError('');
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsSearching(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiClient.post<{ success?: boolean; data?: { text: string }; text?: string }>('/ai/query', {
        query: text,
        history: historyPayload,
      });

      const replyText = res.data?.text ?? res.text ?? 'No response received from AI assistant.';
      setMessages((prev) => [...prev, { role: 'model', content: replyText }]);
    } catch (err: any) {
      setError(err?.message || err?.error || 'Atlas AI is temporarily unavailable. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-[#26313C] bg-[#111820]/95 shadow-2xl backdrop-blur-md flex flex-col justify-between text-left">
      {/* Header */}
      <div className="border-b border-[#26313C] bg-[#18212B] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="text-sm font-bold text-[#F5F7FA]">Atlas AI Assistant</h3>
            <p className="text-[10px] text-[#9AA6B2]">Permission-Aware Operations Copilot</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-[#9AA6B2] hover:text-[#F5F7FA]"
        >
          ✕ Close
        </button>
      </div>

      {/* Message Screen */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-5 px-4 pt-10">
            <div className="text-4xl">🤖</div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-[#F5F7FA]">Ask anything about your restaurant</h4>
              <p className="text-xs text-[#9AA6B2] max-w-xs">
                Ask about today's revenue, popular dishes, customer loyalty, or busy periods.
              </p>
            </div>

            {/* Suggestions list */}
            <div className="w-full space-y-2 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9AA6B2]">Suggested Queries</span>
              <div className="grid gap-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void handleSend(s)}
                    className="w-full text-left rounded-xl border border-[#26313C] bg-[#18212B]/40 hover:border-[#2AFEB7] hover:bg-[#18212B] p-3 text-xs text-[#F5F7FA] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#2AFEB7] text-[#0B0F14] font-semibold rounded-br-none'
                        : 'border border-[#26313C] bg-[#18212B] text-[#F5F7FA] rounded-bl-none shadow-md'
                    }`}
                  >
                    {m.content.split('\n').map((line, lIdx) => {
                      // Simple bold renderer for **text**
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <strong key={pIdx} className="font-bold text-[#2AFEB7]">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {isSearching && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[#26313C] bg-[#18212B] p-3 flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-[#2AFEB7] [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-[#2AFEB7] [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-[#2AFEB7]" />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500 text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input panel */}
      <div className="border-t border-[#26313C] bg-[#18212B]/60 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask Atlas AI..."
            value={input}
            disabled={isSearching}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-xl border border-[#26313C] bg-[#111820] px-4 py-2.5 text-xs text-[#F5F7FA] placeholder-[#9AA6B2] outline-none hover:border-[#2AFEB7] focus:border-[#2AFEB7] transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSearching || !input.trim()}
            className="rounded-xl bg-[#2AFEB7] px-4 text-xs font-bold text-[#0B0F14] hover:bg-[#22E5A4] transition-colors disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
