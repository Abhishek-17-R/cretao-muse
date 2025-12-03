import { useEffect, useState } from "react";
import { Plus, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AppSidebarProps {
  userId: string;
  currentConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
}

export function AppSidebar({
  userId,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
}: AppSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();

    // Subscribe to conversation changes
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading conversations",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRename = async () => {
    if (!selectedConversation || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title: newTitle.trim() })
        .eq("id", selectedConversation.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Conversation renamed",
        description: "The conversation has been renamed successfully.",
      });
      setRenameDialogOpen(false);
      setNewTitle("");
    } catch (error: any) {
      toast({
        title: "Error renaming conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", selectedConversation.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Conversation deleted",
        description: "The conversation has been deleted successfully.",
      });
      setDeleteDialogOpen(false);

      // If we deleted the current conversation, create a new one
      if (selectedConversation.id === currentConversationId) {
        onNewConversation();
      }
    } catch (error: any) {
      toast({
        title: "Error deleting conversation",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openRenameDialog = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setNewTitle(conversation.title || "");
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
        <SidebarTrigger className="m-2 self-end" />

        <SidebarContent>
          {!collapsed && (
            <div className="px-3 py-2">
              <Button
                onClick={onNewConversation}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            </div>
          )}

          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Conversations</SidebarGroupLabel>}

            <SidebarGroupContent>
              <SidebarMenu>
                {conversations.length === 0 && !collapsed && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                )}

                {conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <div className="group relative flex items-center">
                      <SidebarMenuButton
                        asChild
                        className={
                          currentConversationId === conversation.id
                            ? "bg-muted text-primary font-medium"
                            : "hover:bg-muted/50"
                        }
                      >
                        <button
                          onClick={() => onConversationSelect(conversation.id)}
                          className="flex-1 flex items-center"
                        >
                          <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                          {!collapsed && (
                            <span className="truncate">
                              {conversation.title || "New Conversation"}
                            </span>
                          )}
                        </button>
                      </SidebarMenuButton>

                      {!collapsed && currentConversationId === conversation.id && (
                        <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRenameDialog(conversation);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(conversation);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new title for this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter conversation title"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}