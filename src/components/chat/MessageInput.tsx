import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string, requestImage?: boolean) => void;
  disabled: boolean;
}

const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (requestImage: boolean = false) => {
    if (message.trim() && !disabled) {
      onSend(message, requestImage);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(false);
    }
  };

  return (
    <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm p-4">
      <div className="container max-w-4xl">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or describe an image to generate..."
            className="min-h-[60px] max-h-[200px] resize-none bg-background/50 border-border/50"
            disabled={disabled}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={disabled || !message.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={disabled || !message.trim()}
              size="icon"
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line. Click image icon to generate an image.
        </p>
      </div>
    </div>
  );
};

export default MessageInput;