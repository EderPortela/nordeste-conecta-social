import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Trash2, MapPin, Share2, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentSection from "./CommentSection";
import ReactionPicker from "./ReactionPicker";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    hashtags: string[];
    created_at: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    like_count: number;
    comment_count: number;
  };
  currentUserId: string;
  onUpdate: () => void;
}

const PostCard = ({ post, currentUserId, onUpdate }: PostCardProps) => {
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count);
  const [currentReaction, setCurrentReaction] = useState<string | undefined>();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    checkIfLiked();
  }, [post.id, currentUserId]);

  const checkIfLiked = async () => {
    try {
      const { data, error } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error("Error checking like:", error);
    }
  };

  const handleReaction = async (reaction: string) => {
    try {
      if (currentReaction === reaction) {
        // Remove reaction
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
        setCurrentReaction(undefined);
        setIsLiked(false);
        setLocalLikeCount(prev => prev - 1);
      } else {
        // Add or update reaction
        if (isLiked) {
          // Update existing like
          const { error } = await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", post.id)
            .eq("user_id", currentUserId);

          if (error) throw error;
        }

        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: post.id,
            user_id: currentUserId,
          });

        if (error) throw error;
        setCurrentReaction(reaction);
        setIsLiked(true);
        if (!isLiked) {
          setLocalLikeCount(prev => prev + 1);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Post removido dos salvos" : "Post salvo",
      description: isSaved ? "" : "Você pode ver depois!",
    });
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que quer deletar este post?")) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: "Post deletado",
        description: "Seu post foi removido.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderContent = (text: string) => {
    return text.split(/(\s+)/).map((word, index) => {
      if (word.startsWith("#")) {
        return (
          <span key={index} className="text-primary font-medium">
            {word}
          </span>
        );
      }
      return word;
    });
  };

  return (
    <Card className="rounded-2xl shadow-card hover:shadow-hover transition-all border-border overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-lg">
              {post.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-foreground text-base">{post.display_name}</p>
              <span className="text-sm text-muted-foreground">@{post.username}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>
          {post.user_id === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-4">
        <p className="text-foreground whitespace-pre-wrap text-base leading-relaxed">
          {renderContent(post.content)}
        </p>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <ReactionPicker
              postId={post.id}
              currentReaction={currentReaction}
              onReact={handleReaction}
            />
            <span className="text-sm text-muted-foreground ml-2">
              {localLikeCount > 0 && `${localLikeCount} ${localLikeCount === 1 ? 'cabra gostou' : 'cabras gostaram'}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">
                {post.comment_count > 0 ? `${post.comment_count}` : 'Comentar'}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent/10 hover:text-accent transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className={`hover:bg-secondary/10 transition-colors ${
                isSaved ? "text-secondary" : ""
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="w-full pt-3 border-t border-border/50 animate-fade-in">
            <CommentSection
              postId={post.id}
              currentUserId={currentUserId}
              onCommentAdded={onUpdate}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;