import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, Wand2, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type MessageMode = "chat" | "image" | "pipeline";

interface MessageInputProps {
  onSend: (message: string, mode: MessageMode) => void;
  disabled: boolean;
  onOpenDocuments?: () => void;
}

const MessageInput = ({ onSend, disabled, onOpenDocuments }: MessageInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (mode: MessageMode = "chat") => {
    if (message.trim() && !disabled) {
      onSend(message, mode);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit("chat");
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
            placeholder="Type your message, describe an image, or request content creation..."
            className="min-h-[60px] max-h-[200px] resize-none bg-background/50 border-border/50"
            disabled={disabled}
          />
          <div className="flex flex-col gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSubmit("chat")}
                  disabled={disabled || !message.trim()}
                  size="icon"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quick Chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSubmit("pipeline")}
                  disabled={disabled || !message.trim()}
                  size="icon"
                  variant="outline"
                  className="border-amber-500/50 hover:bg-amber-500/10 text-amber-500"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Agent Pipeline (Idea → Draft → Editor)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => handleSubmit("image")}
                  disabled={disabled || !message.trim()}
                  size="icon"
                  variant="outline"
                  className="border-primary/50 hover:bg-primary/10"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate Image</TooltipContent>
            </Tooltip>

            {onOpenDocuments && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onOpenDocuments}
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>RAG Documents</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          <span className="text-primary">Send</span> for quick chat | 
          <span className="text-amber-500"> Wand</span> for 3-agent content pipeline | 
          <span className="text-primary"> Image</span> for generation
        </p>
      </div>
    </div>
  );
};

export default MessageInput;
