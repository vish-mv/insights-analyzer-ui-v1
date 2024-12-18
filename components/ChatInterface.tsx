'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // Changed from number to string
  error?: boolean;
  chart?: string;
}
interface ApiResponse {
    response: string;
    chart?: string;
  }

const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing data...');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: formatTimestamp(new Date()),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLoadingMessage('Analyzing data...');

    try {
      const response = await fetch('https://f2c7f522-ef47-48ce-a429-3fc2f15d2011-dev.e1-us-east-azure.choreoapis.dev/visal/insights-analyzer-v1/v1.0/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_query: input
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data: ApiResponse = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: formatTimestamp(new Date()),
        chart: data.chart // Include chart if it exists in the response
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('API Error:', error);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again later.',
        timestamp: formatTimestamp(new Date()),
        error: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto px-4 py-6">
      <div className="text-3xl font-bold mb-6 text-gray-800">
        Choreo Insights Analytics Chatbot
      </div>
      
      <div className="flex-grow overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex flex-col h-full">
          {/* Messages Container */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <Bot className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                        ? 'bg-blue-50 text-gray-800'
                        : message.error
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-50 text-gray-800'
                    }`}
                    >
                    <div className="text-sm">
                        {message.role === 'user' ? (
                            message.content
                        ) : (
                            <div className="space-y-2">
                            {message.content
                                .split(/(?=##)/)
                                .filter(Boolean)
                                .map((mainSection, i) => {
                                const mainParts = mainSection.split('|').map(part => part.trim());
                                const mainHeader = mainParts[0].replace('##', '').trim();
                                
                                return (
                                    <div key={i} className="mb-4">
                                    {/* Main Header (##) */}
                                    <h2 className="text-lg font-bold my-2 text-gray-00">
                                        {mainHeader}
                                    </h2>

                                    {/* Content after main header */}
                                    {mainParts.slice(1).map((part, j) => {
                                        if (part.startsWith('###')) {
                                        // Handle subsections (###)
                                        const subParts = part.split('-').map(item => item.trim());
                                        const subHeader = subParts[0].replace('###', '').trim();
                                        
                                        return (
                                            <div key={j} className="mb-3">
                                            <h3 className="text-lg font-semibold my-2 text-gray-700">
                                                {subHeader}
                                            </h3>
                                            {/* Bullet points under subsection */}
                                            {subParts.slice(1).map((item, k) => (
                                                <div key={k} className="flex items-start ml-4 my-1">
                                                <span className="mr-2">•</span>
                                                <span className="flex-1">
                                                    {/* Split by ** but keep the delimiters */}
                                                    {item.split(/(\*\*[^*]+\*\*)/).map((part, l) => {
                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                        // Bold text
                                                        return (
                                                        <span key={l} className="font-bold">
                                                            {part.slice(2, -2)} {/* Remove ** from start and end */}
                                                        </span>
                                                        );
                                                    } else if (part.includes('`')) {
                                                        // Code blocks
                                                        return part.split('`').map((codePart, m) => (
                                                        <span key={m} className={m % 2 === 1 ? 'bg-gray-100 px-1 rounded font-mono text-sm' : ''}>
                                                            {codePart}
                                                        </span>
                                                        ));
                                                    } else {
                                                        // Regular text
                                                        return <span key={l}>{part}</span>;
                                                    }
                                                    })}
                                                </span>
                                                </div>
                                            ))}
                                            </div>
                                        );
                                        } else {
                                        // Regular content
                                        return (
                                            <div key={j} className="ml-2">
                                            {part.split(/(\*\*[^*]+\*\*)/).map((section, k) => {
                                                if (section.startsWith('**') && section.endsWith('**')) {
                                                return (
                                                    <span key={k} className="font-bold">
                                                    {section.slice(2, -2)}
                                                    </span>
                                                );
                                                } else if (section.includes('`')) {
                                                return section.split('`').map((codePart, l) => (
                                                    <span key={l} className={l % 2 === 1 ? 'bg-gray-100 px-1 rounded font-mono text-sm' : ''}>
                                                    {codePart}
                                                    </span>
                                                ));
                                                } else {
                                                return <span key={k}>{section}</span>;
                                                }
                                            })}
                                            </div>
                                        );
                                        }
                                    })}
                                    </div>
                                );
                                })}
                            </div>
                        )}
                        </div>
                    {message.chart && (
                        <img
                        src={`data:image/png;base64,${message.chart}`}
                        alt="Analysis Chart"
                        className="mt-3 rounded-lg max-w-full"
                        />
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                        {message.timestamp}
                    </div>
                    </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ml-2">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
                <div className="flex justify-start items-start">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <Bot className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="w-[300px] bg-gray-50 rounded-2xl px-4 py-1">
                    <div className="flex items-center space-x-2 text-gray-600">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm">{loadingMessage}</span>
                    </div>
                            
                    <div className="logo-holder mt-2 ml-0 text-left"> {/* Added ml-0 text-left */}
                        <div className="bar"></div>
                        <div className="bar fill1"></div>
                        <div className="bar fill2"></div>
                        <div className="bar fill3"></div>
                        <div className="bar fill4"></div>
                        <div className="bar fill5"></div>
                        <div className="bar fill6"></div>
                        <div className="bar fill7"></div>
                        <div className="bar fill8"></div>
                        <div className="bar fill9"></div>
                        <div className="bar fill10"></div>
                        <div className="bar fill2"></div>
                        <div className="bar fill6"></div>
                        <div className="bar"></div>
                    </div>
                    </div>
                </div>)}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What would you like to analyze?"
                className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
