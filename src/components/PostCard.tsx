import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentSection from "./CommentSection";

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

  const handleLike = async () => {
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
        setIsLiked(false);
        setLocalLikeCount(prev => prev - 1);
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: post.id,
            user_id: currentUserId,
          });

        if (error) throw error;
        setIsLiked(true);
        setLocalLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
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
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            {post.display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{post.display_name}</p>
          <p className="text-sm text-muted-foreground">@{post.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
          {post.user_id === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-foreground whitespace-pre-wrap">
          {renderContent(post.content)}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3 border-t">
        <div className="flex gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={isLiked ? "text-red-500" : ""}
          >
            <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            {localLikeCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {post.comment_count}
          </Button>
        </div>

        {showComments && (
          <CommentSection
            postId={post.id}
            currentUserId={currentUserId}
            onCommentAdded={onUpdate}
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;