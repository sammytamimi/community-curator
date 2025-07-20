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
    { 
      label: 'Emergency', 
      icon: '🚨', 
      description: 'Urgent assistance',
      gradient: 'from-red-500 to-red-600'
    },
    { 
      label: 'Resources', 
      icon: '📚', 
      description: 'Find support',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      label: 'Support', 
      icon: '🤝', 
      description: 'Get help',
      gradient: 'from-green-500 to-green-600'
    },
    { 
      label: 'Locations', 
      icon: '📍', 
      description: 'Find services',
      gradient: 'from-purple-500 to-purple-600'
    },
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

  const handleNewChat = () => {
    setMessages([]);
    setMessage('');
    setIsLoading(false);
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold gradient-text">Community Curator</h1>
          <p className="text-gray-600 mt-1 text-sm">AI-Powered Assistant</p>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-6">
          <nav className="space-y-2">
            <button 
              onClick={handleNewChat}
              className="w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-white hover:shadow-sm transition-all font-medium"
            >
              💬 New Chat
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-white hover:shadow-sm transition-all font-medium">
              📚 Resources
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-white hover:shadow-sm transition-all font-medium">
              ⚙️ Settings
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Powered by AI • v1.0
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {showWelcome ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-4xl w-full text-center">
              {/* Hero Section */}
              <div className="mb-16">
                <h1 className="text-6xl font-bold mb-6">
                  Make support{' '}
                  <span className="gradient-text">yours.</span>
                </h1>
                <h2 className="text-4xl font-bold mb-8 text-gray-800">
                  And theirs.
                </h2>
                <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                  Connect with community resources, emergency services, and support networks. 
                  Get the help you need, when you need it.
                </p>
                
                <button className="btn-primary text-lg px-8 py-4 rounded-2xl font-semibold inline-flex items-center gap-3">
                  <span>Get Started</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {actionButtons.map((button, index) => (
                  <button
                    key={index}
                    className="card group cursor-pointer text-center p-8 hover:scale-105 transition-all duration-300"
                    onClick={() => handleExampleClick(`I need help with ${button.label.toLowerCase()}`)}
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${button.gradient} flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {button.icon}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{button.label}</h3>
                    <p className="text-gray-600 text-sm">{button.description}</p>
                  </button>
                ))}
              </div>

              {/* One support system, help for everyone */}
              <div className="mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-8">
                  One platform, support for everyone
                </h2>
                
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-1 max-w-4xl mx-auto mb-12">
                  <div className="bg-white rounded-3xl p-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">🌐</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">Universal Access</h3>
                        <p className="text-gray-600 text-sm">Connect to resources regardless of your location or background</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">Instant Support</h3>
                        <p className="text-gray-600 text-sm">Get immediate assistance when you need it most</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-2xl flex items-center justify-center">
                          <span className="text-2xl">🤝</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">Community Care</h3>
                        <p className="text-gray-600 text-sm">Built by and for the community, ensuring relevant support</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Prompts */}
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Try asking about:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="btn-secondary text-left p-4 rounded-xl hover:scale-105 transition-all duration-200"
                      onClick={() => handleExampleClick(prompt)}
                    >
                      <span className="text-blue-500 mr-3">💭</span>
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, index) => {
                  const isNewest = index === messages.length - 1;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} ${
                        isNewest ? 'message-enter' : ''
                      }`}
                    >
                      <div
                        className={`max-w-3xl rounded-2xl px-6 py-4 shadow-sm ${
                          msg.isUser
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white message-bubble-user'
                            : 'bg-white border border-gray-200 text-gray-900 message-bubble-assistant'
                        }`}
                      >
                        <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                        <div className={`text-xs mt-2 opacity-75 ${msg.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start message-enter">
                    <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm message-bubble-assistant">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-gray-600 font-medium">Thinking...</span>
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
        <div className="border-t border-gray-200 bg-white p-6">
          <div className="max-w-4xl mx-auto">
            {/* Disclaimer */}
            <div className="text-center text-xs text-gray-500 mb-4">
              This service provides general guidance. For life-threatening emergencies, contact local emergency services immediately.
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe how we can assist you..."
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 px-6 pr-16 resize-none focus:outline-none focus:border-blue-500 focus:bg-white min-h-[60px] max-h-32 font-medium transition-all"
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
                <div className="absolute bottom-3 right-3">
                  <button 
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-3 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
