import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let textContent = "";
    let fileName = "Pasted Content";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload (PDF or text file)
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const pastedText = formData.get("text") as string | null;

      if (pastedText) {
        textContent = pastedText;
        fileName = "Pasted Report";
      } else if (file) {
        fileName = file.name;
        if (file.name.toLowerCase().endsWith(".pdf")) {
          // For PDF, we extract text using a simple approach
          const arrayBuffer = await file.arrayBuffer();
          textContent = extractTextFromPdfBytes(new Uint8Array(arrayBuffer));
          if (!textContent || textContent.trim().length < 50) {
            textContent = `[PDF Document: ${file.name}, Size: ${formatFileSize(file.size)}] - PDF text extraction yielded limited results. The document may contain primarily images or scanned content.`;
          }
        } else {
          // Text/markdown file
          textContent = await file.text();
        }
      }
    } else {
      // JSON body with text content
      const body = await req.json();
      textContent = body.text || "";
      fileName = body.fileName || "Pasted Report";
    }

    if (!textContent || textContent.trim().length < 10) {
      return new Response(JSON.stringify({ error: "No meaningful content found in the uploaded document" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Truncate very long documents to avoid token limits
    const maxChars = 30000;
    const truncatedContent = textContent.length > maxChars
      ? textContent.substring(0, maxChars) + "\n\n[Content truncated due to length...]"
      : textContent;

    console.log(`Processing report: "${fileName}", content length: ${textContent.length} chars`);

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to extract structured insights
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a brand intelligence analyst. Extract structured insights from the provided document/report content. 
Return a JSON object with the following structure:
{
  "summary": "Brief 2-3 sentence summary of the document",
  "insights": [
    {
      "type": "insight" | "learning" | "metric" | "milestone" | "note",
      "content": "The extracted insight text (1-3 sentences, clear and actionable)",
      "category": "Category like 'Market Position', 'Competitive', 'Brand Strategy', 'Customer', 'Visual Identity', 'Digital Presence', etc.",
      "confidence": 0.0-1.0
    }
  ]
}

Guidelines:
- Extract 5-15 distinct insights depending on document richness
- Each insight should be self-contained and valuable on its own
- Use "metric" type for any quantitative data points
- Use "insight" for strategic observations and analysis findings
- Use "learning" for recommendations and best practices
- Use "milestone" for achievements or significant events mentioned
- Use "note" for general observations
- Assign confidence based on how clearly the insight is supported by the source material
- Categories should be consistent and meaningful for brand management

Return ONLY valid JSON, no markdown formatting.`
          },
          {
            role: "user",
            content: `Extract brand intelligence insights from this document:\n\nDocument: "${fileName}"\n\n${truncatedContent}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_insights",
              description: "Extract structured brand insights from a document",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Brief 2-3 sentence summary of the document"
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["insight", "learning", "metric", "milestone", "note"]
                        },
                        content: {
                          type: "string",
                          description: "The extracted insight (1-3 sentences)"
                        },
                        category: {
                          type: "string",
                          description: "Category like Market Position, Competitive, Brand Strategy, etc."
                        },
                        confidence: {
                          type: "number",
                          description: "Confidence score 0.0-1.0"
                        }
                      },
                      required: ["type", "content", "category", "confidence"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["summary", "insights"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "Failed to analyze document with AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    
    // Extract from tool call response
    let extracted: { summary: string; insights: any[] };
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      extracted = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        extracted = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      } catch {
        extracted = {
          summary: "Could not fully parse the document. Manual review recommended.",
          insights: [{
            type: "note",
            content: content.substring(0, 500),
            category: "General",
            confidence: 0.5
          }]
        };
      }
    }

    console.log(`Extracted ${extracted.insights?.length || 0} insights from "${fileName}"`);

    return new Response(JSON.stringify({
      fileName,
      summary: extracted.summary,
      insights: extracted.insights || [],
      contentLength: textContent.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing report import:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to process report",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  // Simple PDF text extraction - looks for text streams between BT/ET markers
  // This is a basic approach; complex PDFs may need more sophisticated parsing
  const text: string[] = [];
  const str = new TextDecoder("latin1").decode(bytes);
  
  // Extract text from PDF streams
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = streamRegex.exec(str)) !== null) {
    const streamContent = match[1];
    // Look for text show operators: Tj, TJ, ', "
    const textRegex = /\(([^)]*)\)\s*Tj/g;
    let textMatch;
    while ((textMatch = textRegex.exec(streamContent)) !== null) {
      const extracted = textMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (extracted.trim()) {
        text.push(extracted);
      }
    }
    // Also try TJ arrays
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjMatch;
    while ((tjMatch = tjArrayRegex.exec(streamContent)) !== null) {
      const parts = tjMatch[1].match(/\(([^)]*)\)/g);
      if (parts) {
        const combined = parts.map(p => p.slice(1, -1)).join("");
        if (combined.trim()) {
          text.push(combined);
        }
      }
    }
  }
  
  return text.join(" ").replace(/\s+/g, " ").trim();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
