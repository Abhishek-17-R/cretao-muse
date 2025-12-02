import { Sparkles, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  created_at: string;
}

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

const MessageList = ({ messages, loading }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <div className="rounded-full bg-primary/10 p-6 animate-pulse-glow">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Welcome to Cretao Gen-AI Assistant</h2>
            <p className="text-muted-foreground max-w-md">
              Your intelligent content creation companion. Ask me anything or request image generation!
            </p>
          </div>
        </div>
      )}
      
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 animate-slide-up ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {message.role === "assistant" && (
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
          )}
          
          <div
            className={`flex flex-col gap-2 max-w-[70%] rounded-2xl px-4 py-3 ${
              message.role === "user"
                ? "bg-message-user text-primary-foreground"
                : "bg-message-assistant text-foreground border border-border/50"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.image_url && (
              <img
                src={message.image_url}
                alt="Generated content"
                className="rounded-lg max-w-full h-auto"
              />
            )}
          </div>
          
          {message.role === "user" && (
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
      
      {loading && (
        <div className="flex gap-3 justify-start animate-slide-up">
          <Avatar className="h-8 w-8 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </AvatarFallback>
          </Avatar>
          <div className="bg-message-assistant text-foreground border border-border/50 rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-100" />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse delay-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;