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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card/95 backdrop-blur-md flex flex-col justify-between text-left">
      {/* Header */}
      <div className="border-b border-border bg-secondary p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="text-sm font-bold text-foreground">Atlas AI Assistant</h3>
            <p className="text-[10px] text-muted-foreground">Permission-Aware Operations Copilot</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
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
              <h4 className="text-sm font-bold text-foreground">Ask anything about your restaurant</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                Ask about today's revenue, popular dishes, customer loyalty, or busy periods.
              </p>
            </div>

            {/* Suggestions list */}
            <div className="w-full space-y-2 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suggested Queries</span>
              <div className="grid gap-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void handleSend(s)}
                    className="w-full text-left rounded-xl border border-border bg-secondary/40 hover:border-primary hover:bg-secondary p-3 text-xs text-foreground transition-all"
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
                        ? 'bg-primary text-background font-semibold rounded-br-none'
                        : 'border border-border bg-secondary text-foreground rounded-bl-none shadow-md'
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
                                <strong key={pIdx} className="font-bold text-primary">
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
                <div className="rounded-2xl border border-border bg-secondary p-3 flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-atlas-error/20 bg-atlas-error/10 p-3 text-xs text-atlas-error text-center">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input panel */}
      <div className="border-t border-border bg-secondary/60 p-3">
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
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-xs text-foreground placeholder-muted-foreground outline-none hover:border-primary focus:border-primary transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSearching || !input.trim()}
            className="rounded-xl bg-primary px-4 text-xs font-bold text-background hover:bg-primary-hover transition-colors disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
