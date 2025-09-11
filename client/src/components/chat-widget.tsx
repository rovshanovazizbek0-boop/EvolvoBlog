import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, X, Send, User, Bot, Phone, Mail, MessageSquare } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  messageType: string;
  metadata?: any;
  createdAt: string;
}

interface ChatConversation {
  id: string;
  sessionId: string;
  status: string;
  lastMessage?: string;
}

interface ServiceRecommendation {
  serviceId: string;
  title: string;
  reason: string;
  matchScore: number;
}

interface LeadForm {
  show: boolean;
  title: string;
  fields: string[];
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormData, setLeadFormData] = useState({
    name: "",
    phone: "",
    telegramUsername: "",
    email: ""
  });
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize conversation when chat opens
  useEffect(() => {
    if (isOpen && !conversation) {
      initializeConversation();
    }
  }, [isOpen, conversation]);

  const initializeConversation = async () => {
    try {
      const response = await apiRequest("POST", "/api/chat/conversation", {
        sessionId
      });
      const data = await response.json();
      setConversation(data);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        content: "Salom! Men Evolvo.uz kompaniyasining AI yordamchisiman. Sizga veb-sayt, Telegram bot, AI chatbot va boshqa xizmatlarni tanlashda yordam beraman. Qanday loyiha ustida ishlamoqchisiz?",
        isUser: false,
        messageType: "text",
        createdAt: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Failed to initialize conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !conversation) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: inputValue,
      isUser: true,
      messageType: "text",
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await apiRequest("POST", "/api/chat/message", {
        conversationId: conversation.id,
        message: inputValue,
        messageType: "text"
      });

      const data = await response.json();
      
      // Add AI response
      if (data.aiMessage) {
        const aiMessage: ChatMessage = {
          id: data.aiMessage.id,
          content: data.aiMessage.content,
          isUser: false,
          messageType: data.aiMessage.messageType || "text",
          metadata: data.aiMessage.metadata,
          createdAt: data.aiMessage.createdAt
        };
        setMessages(prev => [...prev, aiMessage]);
      }

      // Handle service recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        // Add recommendation message after a short delay
        setTimeout(() => {
          const recMessage: ChatMessage = {
            id: `rec_${Date.now()}`,
            content: "Sizning talabingizga asosan bir nechta xizmatlarni tavsiya qilaman:",
            isUser: false,
            messageType: "recommendations",
            metadata: { recommendations: data.recommendations },
            createdAt: new Date().toISOString()
          };
          setMessages(prev => [...prev, recMessage]);
        }, 1000);
      }

      // Show lead form if needed
      if (data.leadForm && data.leadForm.show) {
        setTimeout(() => {
          setShowLeadForm(true);
        }, 2000);
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: "Kechirasiz, xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
        isUser: false,
        messageType: "text",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const submitLeadForm = async () => {
    if (!conversation || !leadFormData.name || !leadFormData.phone) return;

    try {
      await apiRequest("POST", "/api/chat/lead", {
        conversationId: conversation.id,
        name: leadFormData.name,
        phone: leadFormData.phone,
        telegramUsername: leadFormData.telegramUsername,
        email: leadFormData.email,
        leadQuality: "warm",
        status: "new"
      });

      setShowLeadForm(false);
      const successMessage: ChatMessage = {
        id: `lead_success_${Date.now()}`,
        content: `Rahmat, ${leadFormData.name}! Ma'lumotlaringiz qabul qilindi. Tez orada sizga aloqaga chiqamiz. Telegram: @evolvo_uz`,
        isUser: false,
        messageType: "text",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, successMessage]);
      
      // Reset form
      setLeadFormData({
        name: "",
        phone: "",
        telegramUsername: "",
        email: ""
      });
    } catch (error) {
      console.error("Failed to submit lead:", error);
    }
  };

  const selectRecommendation = (rec: ServiceRecommendation) => {
    const message = `${rec.title} xizmati haqida batafsil ma'lumot bering. Narxi va muddati qanday?`;
    setInputValue(message);
    setRecommendations([]);
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('uz-UZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.messageType === "recommendations" && message.metadata?.recommendations) {
      return (
        <div className="space-y-2">
          <p className="text-sm">{message.content}</p>
          <div className="grid gap-2">
            {message.metadata.recommendations.map((rec: ServiceRecommendation, index: number) => (
              <div
                key={index}
                className="border rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => selectRecommendation(rec)}
                data-testid={`recommendation-card-${index}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {rec.matchScore}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <p className="text-sm">{message.content}</p>;
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          size="icon"
          data-testid="chat-widget-button"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open chat</span>
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Evolvo AI</h3>
                <p className="text-xs text-muted-foreground">
                  {isTyping ? "Yozmoqda..." : "Onlayn"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              data-testid="chat-close-button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                    data-testid={`message-${message.isUser ? 'user' : 'bot'}`}
                  >
                    {renderMessage(message)}
                    <p className="text-xs opacity-70 mt-1">
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Lead Form */}
          {showLeadForm && (
            <div className="p-4 border-t bg-muted/50">
              <h4 className="font-medium text-sm mb-3">Aloqa ma'lumotlari</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Ismingiz *"
                  value={leadFormData.name}
                  onChange={(e) => setLeadFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="lead-form-name"
                />
                <Input
                  placeholder="Telefon raqam *"
                  value={leadFormData.phone}
                  onChange={(e) => setLeadFormData(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="lead-form-phone"
                />
                <Input
                  placeholder="Telegram username"
                  value={leadFormData.telegramUsername}
                  onChange={(e) => setLeadFormData(prev => ({ ...prev, telegramUsername: e.target.value }))}
                  data-testid="lead-form-telegram"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={submitLeadForm}
                    disabled={!leadFormData.name || !leadFormData.phone}
                    className="flex-1"
                    data-testid="lead-form-submit"
                  >
                    Yuborish
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowLeadForm(false)}
                    data-testid="lead-form-cancel"
                  >
                    Bekor qilish
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                placeholder="Xabaringizni yozing..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                data-testid="chat-input"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                data-testid="chat-send-button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}