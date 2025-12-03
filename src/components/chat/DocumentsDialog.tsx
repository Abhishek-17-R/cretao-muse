import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface DocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const DocumentsDialog = ({ open, onOpenChange, userId }: DocumentsDialogProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open]);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading documents", description: error.message, variant: "destructive" });
    } else {
      setDocuments(data || []);
    }
  };

  const handleAddDocument = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setLoading(true);

    const { error } = await supabase.from("documents").insert({
      user_id: userId,
      title: newTitle,
      content: newContent,
    });

    if (error) {
      toast({ title: "Error adding document", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document added", description: "Your document is now available for RAG context." });
      setNewTitle("");
      setNewContent("");
      loadDocuments();
    }
    setLoading(false);
  };

  const handleDeleteDocument = async (id: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting document", description: error.message, variant: "destructive" });
    } else {
      loadDocuments();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            RAG Knowledge Base
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
            <h4 className="text-sm font-medium">Add New Document</h4>
            <Input
              placeholder="Document title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Paste your content here... This will be used as context for AI responses."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={handleAddDocument}
              disabled={loading || !newTitle.trim() || !newContent.trim()}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Document
            </Button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Your Documents ({documents.length})</h4>
            <ScrollArea className="h-[200px]">
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No documents yet. Add documents to enhance AI responses with your knowledge.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start justify-between p-3 bg-background rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm truncate">{doc.title}</h5>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {doc.content.substring(0, 150)}...
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentsDialog;
