'use client';

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');

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
        {/* Main Chat Area */}
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
                  onClick={() => setMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card-bg p-4">
          <div className="max-w-4xl mx-auto">
            {/* Disclaimer */}
            <div className="text-center text-xs text-muted mb-4">
              This service provides general guidance. For life-threatening emergencies, contact local emergency services immediately.
            </div>
            
            {/* Message Input */}
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
              />
              
              {/* Send button */}
              <div className="absolute right-2 bottom-2">
                <button 
                  className="bg-primary text-white rounded-full p-2 hover:bg-primary-dark transition-colors"
                  disabled={!message.trim()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
