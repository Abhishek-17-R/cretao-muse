import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MessageList from "./MessageList";
import MessageInput, { MessageMode } from "./MessageInput";
import PipelineProgress from "./PipelineProgress";
import DocumentsDialog from "./DocumentsDialog";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  created_at: string;
}

interface PipelineStage {
  agent: string;
  status: "pending" | "running" | "complete";
}

interface ChatInterfaceProps {
  userId: string;
  conversationId: string | null;
  onConversationIdChange: (id: string) => void;
}

const ChatInterface = ({ userId, conversationId, onConversationIdChange }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[] | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) {
      initializeConversation();
    } else {
      loadMessages(conversationId);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeConversation = async () => {
    try {
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

      onConversationIdChange(convId);
      loadMessages(convId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (convId: string) => {
    try {
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
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchRAGContext = async (): Promise<string> => {
    try {
      const { data } = await supabase
        .from("documents")
        .select("content")
        .eq("user_id", userId)
        .limit(5);

      if (data && data.length > 0) {
        return data.map((d) => d.content).join("\n\n---\n\n");
      }
    } catch (error) {
      console.error("Error fetching RAG context:", error);
    }
    return "";
  };

  const handleSendMessage = async (content: string, mode: MessageMode = "chat") => {
    if (!conversationId) return;

    setLoading(true);

    // Initialize pipeline progress for pipeline mode
    if (mode === "pipeline") {
      setPipelineStages([
        { agent: "Idea Agent", status: "pending" },
        { agent: "Draft Agent", status: "pending" },
        { agent: "Editor Agent", status: "pending" },
      ]);
    }

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

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Determine function and prepare body
      let functionName: string;
      let body: any = { message: content, conversationId };

      if (mode === "image") {
        functionName = "generate-image";
      } else if (mode === "pipeline") {
        functionName = "content-pipeline";
        // Fetch RAG context for pipeline
        const ragContext = await fetchRAGContext();
        body.context = ragContext;

        // Simulate pipeline progress
        setPipelineStages((prev) =>
          prev?.map((s, i) => (i === 0 ? { ...s, status: "running" } : s)) || null
        );

        // Add delay to show progress (actual processing happens in edge function)
        setTimeout(() => {
          setPipelineStages((prev) =>
            prev?.map((s, i) =>
              i === 0 ? { ...s, status: "complete" } : i === 1 ? { ...s, status: "running" } : s
            ) || null
          );
        }, 2000);

        setTimeout(() => {
          setPipelineStages((prev) =>
            prev?.map((s, i) =>
              i <= 1 ? { ...s, status: "complete" } : i === 2 ? { ...s, status: "running" } : s
            ) || null
          );
        }, 4000);
      } else {
        functionName = "chat-assistant";
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
      });

      if (error) throw error;

      // Complete pipeline stages
      if (mode === "pipeline") {
        setPipelineStages((prev) =>
          prev?.map((s) => ({ ...s, status: "complete" })) || null
        );
        setTimeout(() => setPipelineStages(null), 1500);
      }

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
      setPipelineStages(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList messages={messages} loading={loading} />
      {pipelineStages && (
        <div className="px-4 pb-2">
          <PipelineProgress stages={pipelineStages} />
        </div>
      )}
      <div ref={messagesEndRef} />
      <MessageInput
        onSend={handleSendMessage}
        disabled={loading}
        onOpenDocuments={() => setDocumentsOpen(true)}
      />
      <DocumentsDialog
        open={documentsOpen}
        onOpenChange={setDocumentsOpen}
        userId={userId}
      />
    </div>
  );
};

export default ChatInterface;
