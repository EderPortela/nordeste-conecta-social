import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreatePostProps {
  userId: string;
  onPostCreated: () => void;
}

const CreatePost = ({ userId, onPostCreated }: CreatePostProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Ops!",
        description: "O post não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const hashtags = extractHashtags(content);
      
      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: content.trim(),
          hashtags,
        });

      if (error) throw error;

      toast({
        title: "Post criado!",
        description: "Seu post foi compartilhado com sucesso.",
      });

      setContent("");
      onPostCreated();
    } catch (error: any) {
      toast({
        title: "Erro ao criar post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="O que você quer compartilhar hoje? Use #hashtags para marcar temas..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={5000}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {content.length}/5000 caracteres
            </span>
            <Button type="submit" disabled={loading || !content.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publicar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePost;