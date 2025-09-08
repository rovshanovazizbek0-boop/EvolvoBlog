import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

interface AIChatProps {
  serviceId: string;
  serviceTitle: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AIChat({ serviceId, serviceTitle }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: `Salom! Men sizga ${serviceTitle} xizmati bo'yicha eng mos yechimni tanlab berishga yordam beraman. Loyihangiz haqida gapirib bering!`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/ai/explain", {
        serviceId,
        question: inputValue,
      });

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.explanation,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Kechirasiz, hozir javob bera olmayapman. Iltimos, keyinroq urinib ko'ring.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <i className="fas fa-robot text-primary-foreground text-sm"></i>
        </div>
        <span className="font-semibold">AI Yordamchi</span>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4" data-testid="ai-chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-chat-message p-3 rounded-lg ${
              message.isUser
                ? "bg-primary text-primary-foreground ml-8"
                : "bg-background"
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        ))}
        {isLoading && (
          <div className="ai-chat-message bg-background p-3 rounded-lg">
            <p className="text-sm">Yozmoqda...</p>
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Savolingizni yozing..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          data-testid="ai-chat-input"
        />
        <Button 
          onClick={sendMessage} 
          disabled={isLoading || !inputValue.trim()}
          data-testid="ai-chat-send"
        >
          <i className="fas fa-paper-plane"></i>
        </Button>
      </div>
    </div>
  );
}
