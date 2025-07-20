'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const actionButtons = [
    { label: 'Emergency', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { label: 'Resources', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { label: 'Support', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { label: 'Locations', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  ];

  const examplePrompts = [
    "I need emergency shelter assistance",
    "Where can I find food distribution centers?",
    "How do I apply for emergency aid?",
    "What mental health resources are available?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/flavia/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: messageText })
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      let assistantContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        assistantContent += chunk;
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: assistantContent }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };

  const handleExampleClick = (prompt: string) => {
    setMessage(prompt);
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar-bg border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4">
          <h1 className="text-xl font-bold text-primary">Community Curator</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {showWelcome ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">How can we help you today?</h1>
              <p className="text-lg text-muted mb-8">Get assistance with emergency services, resources, and support.</p>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
                {actionButtons.map((button, index) => (
                  <button
                    key={index}
                    className={`${button.color} rounded-lg p-4 text-center transition-colors border border-transparent hover:border-opacity-20`}
                  >
                    <div className="font-medium">{button.label}</div>
                  </button>
                ))}
              </div>

              {/* Example Prompts */}
              <div className="space-y-3 mb-12">
                {examplePrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="block w-full text-left text-muted hover:text-foreground py-3 px-4 rounded-lg hover:bg-card-bg transition-colors border border-border"
                    onClick={() => handleExampleClick(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl rounded-lg px-4 py-2 ${
                        msg.isUser
                          ? 'bg-primary text-white'
                          : 'bg-card-bg border border-border text-foreground'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-xs mt-1 ${msg.isUser ? 'text-blue-100' : 'text-muted'}`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card-bg border border-border rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-muted">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border bg-card-bg p-4">
          <div className="max-w-4xl mx-auto">
            {/* Disclaimer */}
            <div className="text-center text-xs text-muted mb-4">
              This service provides general guidance. For life-threatening emergencies, contact local emergency services immediately.
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe how we can assist you..."
                  className="w-full bg-card-bg border border-border rounded-lg py-3 px-4 pr-20 resize-none focus:outline-none focus:border-primary min-h-[50px] max-h-32"
                  rows={1}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                
                {/* Send button */}
                <div className="absolute right-2 bottom-2">
                  <button 
                    type="submit"
                    className="bg-primary text-white rounded-full p-2 hover:bg-primary-dark transition-colors disabled:opacity-50"
                    disabled={!message.trim() || isLoading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
