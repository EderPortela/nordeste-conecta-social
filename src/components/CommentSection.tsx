import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
  };
}

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
  onCommentAdded: () => void;
}

const CommentSection = ({ postId, currentUserId, onCommentAdded }: CommentSectionProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar comentários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      await loadComments();
      onCommentAdded();
    } catch (error: any) {
      toast({
        title: "Erro ao comentar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      await loadComments();
      onCommentAdded();
      
      toast({
        title: "Comentário deletado",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full space-y-4 pt-3 border-t">
      {/* Comments List */}
      {loadingComments ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          Carregando comentários...
        </p>
      ) : comments.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {comment.profiles.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{comment.profiles.display_name}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  {comment.user_id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(comment.id)}
                      className="h-6 w-6 ml-auto"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Seja o primeiro a comentar!
        </p>
      )}

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={1000}
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading || !newComment.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default CommentSection;