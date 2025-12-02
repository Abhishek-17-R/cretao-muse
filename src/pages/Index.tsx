import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, Image as ImageIcon, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/chat");
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-3xl">
        <div className="inline-flex rounded-full bg-primary/10 p-6 animate-pulse-glow">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-slide-up">
            Cretao Gen-AI Assistant
          </h1>
          <p className="text-xl text-muted-foreground animate-slide-up">
            Your intelligent content creation companion powered by advanced AI
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12 animate-slide-up">
          <div className="border border-border/50 rounded-xl p-6 bg-card/30 backdrop-blur-sm hover:border-primary/50 transition-all">
            <Wand2 className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Chat</h3>
            <p className="text-sm text-muted-foreground">
              Engage in intelligent conversations for content creation and creative assistance
            </p>
          </div>
          
          <div className="border border-border/50 rounded-xl p-6 bg-card/30 backdrop-blur-sm hover:border-primary/50 transition-all">
            <ImageIcon className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Image Generation</h3>
            <p className="text-sm text-muted-foreground">
              Create stunning visuals from text descriptions with AI-powered generation
            </p>
          </div>
          
          <div className="border border-border/50 rounded-xl p-6 bg-card/30 backdrop-blur-sm hover:border-primary/50 transition-all">
            <Sparkles className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Smart Workflow</h3>
            <p className="text-sm text-muted-foreground">
              Streamlined agent workflow for efficient content creation tasks
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground group"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;