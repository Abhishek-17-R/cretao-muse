import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentResponse {
  agent: string;
  output: string;
}

interface PipelineResponse {
  stages: AgentResponse[];
  finalContent: string;
}

// Idea Agent - Brainstorms and generates creative ideas
async function runIdeaAgent(prompt: string, apiKey: string): Promise<string> {
  console.log("🧠 Idea Agent: Starting brainstorm...");
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are the IDEA AGENT - a creative brainstormer. Your job is to:
1. Analyze the user's request
2. Generate 3-5 creative angles or approaches
3. Identify key themes and concepts
4. Suggest a compelling direction

Output format: Provide a structured brainstorm with bullet points. Be creative and think outside the box.
Do not use markdown formatting symbols like asterisks or hashes. Use plain text with proper spacing.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Idea Agent error: ${response.status}`);
  }

  const data = await response.json();
  const output = data.choices?.[0]?.message?.content || "";
  console.log("🧠 Idea Agent: Complete");
  return output;
}

// Draft Agent - Creates initial draft based on ideas
async function runDraftAgent(prompt: string, ideas: string, apiKey: string): Promise<string> {
  console.log("✍️ Draft Agent: Creating draft...");
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are the DRAFT AGENT - a skilled content writer. Your job is to:
1. Take the brainstormed ideas and create a complete first draft
2. Structure the content logically with clear sections
3. Write engaging, clear prose
4. Include all key points from the ideas

Output format: Write a complete draft based on the ideas provided. Make it comprehensive but readable.
Do not use markdown formatting symbols like asterisks or hashes. Use plain text with proper spacing and line breaks.`,
        },
        {
          role: "user",
          content: `Original request: ${prompt}\n\nIdeas from brainstorm:\n${ideas}\n\nPlease create a complete draft based on these ideas.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Draft Agent error: ${response.status}`);
  }

  const data = await response.json();
  const output = data.choices?.[0]?.message?.content || "";
  console.log("✍️ Draft Agent: Complete");
  return output;
}

// Editor Agent - Polishes and refines the draft
async function runEditorAgent(prompt: string, draft: string, apiKey: string): Promise<string> {
  console.log("🔍 Editor Agent: Polishing content...");
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are the EDITOR AGENT - a meticulous editor and quality controller. Your job is to:
1. Review the draft for clarity, flow, and impact
2. Fix any grammatical or spelling errors
3. Improve sentence structure and word choice
4. Ensure the content fully addresses the original request
5. Add finishing touches to make it publication-ready

Output format: Provide the final polished version of the content. Make it professional and engaging.
Do not use markdown formatting symbols like asterisks or hashes. Use plain text with proper spacing and line breaks.`,
        },
        {
          role: "user",
          content: `Original request: ${prompt}\n\nDraft to edit:\n${draft}\n\nPlease polish and finalize this content.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Editor Agent error: ${response.status}`);
  }

  const data = await response.json();
  const output = data.choices?.[0]?.message?.content || "";
  console.log("🔍 Editor Agent: Complete");
  return output;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("🚀 Starting Content Pipeline for:", message);

    // Prepare prompt with RAG context if available
    let enrichedPrompt = message;
    if (context && context.length > 0) {
      enrichedPrompt = `Context information:\n${context}\n\nUser request: ${message}`;
      console.log("📚 RAG: Added context to prompt");
    }

    // Run the 3-agent pipeline
    const stages: AgentResponse[] = [];

    // Step 1: Idea Agent
    const ideas = await runIdeaAgent(enrichedPrompt, LOVABLE_API_KEY);
    stages.push({ agent: "Idea Agent", output: ideas });

    // Step 2: Draft Agent
    const draft = await runDraftAgent(message, ideas, LOVABLE_API_KEY);
    stages.push({ agent: "Draft Agent", output: draft });

    // Step 3: Editor Agent
    const finalContent = await runEditorAgent(message, draft, LOVABLE_API_KEY);
    stages.push({ agent: "Editor Agent", output: finalContent });

    console.log("✅ Content Pipeline complete");

    const response: PipelineResponse = {
      stages,
      finalContent,
    };

    return new Response(JSON.stringify({ content: finalContent, pipeline: response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in content-pipeline:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
