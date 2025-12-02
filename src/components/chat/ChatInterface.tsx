import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  created_at: string;
}

interface ChatInterfaceProps {
  userId: string;
}

const ChatInterface = ({ userId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = async () => {
    try {
      // Get or create conversation
      const { data: existingConversations } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      let convId: string;

      if (existingConversations && existingConversations.length > 0) {
        convId = existingConversations[0].id;
      } else {
        const { data: newConversation, error } = await supabase
          .from("conversations")
          .insert({ user_id: userId, title: "New Conversation" })
          .select()
          .single();

        if (error) throw error;
        convId = newConversation.id;
      }

      setConversationId(convId);

      // Load messages
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (messagesData) {
        setMessages(messagesData as Message[]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (content: string, requestImage: boolean = false) => {
    if (!conversationId) return;

    setLoading(true);

    try {
      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "user",
          content,
        })
        .select()
        .single();

      if (userError) throw userError;

      setMessages((prev) => [...prev, userMessage as Message]);

      // Call appropriate edge function
      const functionName = requestImage ? "generate-image" : "chat-assistant";
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { message: content, conversationId },
      });

      if (error) throw error;

      // Save assistant response
      const { data: assistantMessage, error: assistantError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "assistant",
          content: data.content || "",
          image_url: data.image_url || null,
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      setMessages((prev) => [...prev, assistantMessage as Message]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={messages} loading={loading} />
      <div ref={messagesEndRef} />
      <MessageInput onSend={handleSendMessage} disabled={loading} />
    </div>
  );
};

export default ChatInterface;