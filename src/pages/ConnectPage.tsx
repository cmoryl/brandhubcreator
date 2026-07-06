import { useState } from "react";
import { Copy, Check, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ConnectPage() {
  const [copied, setCopied] = useState(false);
  const mcpUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mcp`;

  const copy = async () => {
    await navigator.clipboard.writeText(mcpUrl);
    setCopied(true);
    toast.success("MCP URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Agent integrations
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Connect an AI assistant to BrandHub</h1>
        <p className="text-muted-foreground">
          Paste the URL below into ChatGPT or Claude to let it read your brands, products,
          events, and organizations as you.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">MCP server URL</CardTitle>
          <CardDescription>Copy this. You'll paste it into the assistant.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm break-all">
            <span className="flex-1">{mcpUrl}</span>
            <Button size="sm" variant="secondary" onClick={copy} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <CardTitle className="text-base">Connect from ChatGPT</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>
              Open{" "}
              <a
                href="https://chatgpt.com/#settings/Connectors/Advanced"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                ChatGPT → Settings → Connectors → Advanced
              </a>{" "}
              and turn on <span className="font-medium">Developer mode</span> (read the risk
              notice shown there).
            </li>
            <li>
              In the chat composer's <span className="font-medium">+</span> menu, enable
              Developer mode.
            </li>
            <li>
              Click <span className="font-medium">Add sources</span>, then{" "}
              <span className="font-medium">Connect more</span>.
            </li>
            <li>Give the connector a name (e.g. "BrandHub") and paste the MCP URL above.</li>
            <li>Sign in and approve access when prompted, then ask ChatGPT to use BrandHub.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <CardTitle className="text-base">Connect from Claude</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>
              Open{" "}
              <a
                href="https://claude.ai/customize/connectors?modal=add-custom-connector"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                Claude → Connectors → Add custom connector
              </a>
              .
            </li>
            <li>Give the connector a name (e.g. "BrandHub") and paste the MCP URL above.</li>
            <li>Sign in and approve access when prompted.</li>
            <li>
              Enable the connector from the chat composer, then ask Claude to use BrandHub.
            </li>
          </ol>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        The assistant will only see what you can see — access is scoped to your BrandHub
        account.
      </p>
    </main>
  );
}
