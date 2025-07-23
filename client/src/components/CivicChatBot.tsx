import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Send, Bot, User, Loader2, Sparkles, Shield, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysisType?: 'bill' | 'politician' | 'general';
  confidence?: number;
  sources?: string[];
  truthScore?: number;
  propagandaRisk?: 'low' | 'medium' | 'high';
  followUpSuggestions?: string[];
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CivicChatBot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm CivicOS, your Canadian civic intelligence assistant. I can help you analyze legislation, track politicians, explain your rights, and guide civic actions. What would you like to know?",
      timestamp: new Date(),
      analysisType: 'general',
      confidence: 1.0,
      sources: ['CivicOS System'],
      truthScore: 1.0,
      propagandaRisk: 'low',
      followUpSuggestions: [
        "Tell me about the latest bills in Parliament",
        "Who is my MP and how can I contact them?",
        "What are my rights as a Canadian citizen?",
        "How do I file a complaint about government services?"
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiRequest('/api/ai/chat', 'POST', {
        message: input.trim(),
        context: {
          userLocation: (user as any)?.city ? `${(user as any).city}, ${(user as any).province}` : undefined,
          userInterests: ['civic engagement', 'Canadian politics'],
          previousMessages: messages.slice(-5).map(msg => msg.content)
        }
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || response.response || "I'm sorry, I couldn't generate a response at this time.",
        timestamp: new Date(),
        analysisType: 'general',
        confidence: 0.9,
        sources: ['CivicOS AI'],
        truthScore: 0.9,
        propagandaRisk: 'low',
        followUpSuggestions: [
          "Ask me about Canadian politics",
          "Learn about your rights",
          "Find your local representatives"
        ]
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to my AI service right now. Please try again in a moment, or contact support if the issue persists.",
        timestamp: new Date(),
        analysisType: 'general',
        confidence: 0.0,
        sources: ['CivicOS System'],
        truthScore: 0.0,
        propagandaRisk: 'low'
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-500";
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getPropagandaColor = (risk?: string) => {
    if (!risk) return "bg-gray-500";
    if (risk === 'low') return "bg-green-500";
    if (risk === 'medium') return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle>CivicOS AI Assistant</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {user ? 'Authenticated' : 'Guest'}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Bot className="h-4 w-4 mt-1 text-blue-600 flex-shrink-0" />
                      )}
                      {message.role === 'user' && (
                        <User className="h-4 w-4 mt-1 text-white flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        
                        {message.role === 'assistant' && (
                          <div className="mt-2 space-y-1">
                            {message.confidence && (
                              <div className="flex items-center space-x-2 text-xs">
                                <span className="text-gray-500">Confidence:</span>
                                <div className={`w-2 h-2 rounded-full ${getConfidenceColor(message.confidence)}`}></div>
                                <span>{(message.confidence * 100).toFixed(0)}%</span>
                              </div>
                            )}
                            
                            {message.propagandaRisk && (
                              <div className="flex items-center space-x-2 text-xs">
                                <Shield className="h-3 w-3 text-gray-500" />
                                <span className="text-gray-500">Propaganda Risk:</span>
                                <Badge variant="outline" className={`text-xs ${getPropagandaColor(message.propagandaRisk)}`}>
                                  {message.propagandaRisk}
                                </Badge>
                              </div>
                            )}
                            
                            {message.truthScore && (
                              <div className="flex items-center space-x-2 text-xs">
                                <TrendingUp className="h-3 w-3 text-gray-500" />
                                <span className="text-gray-500">Truth Score:</span>
                                <span>{(message.truthScore * 100).toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">Analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {messages.length > 1 && messages[messages.length - 1].role === 'assistant' && 
           messages[messages.length - 1].followUpSuggestions && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-2">Suggested follow-ups:</p>
              <div className="flex flex-wrap gap-2">
                {messages[messages.length - 1].followUpSuggestions?.slice(0, 3).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about bills, politicians, your rights..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}