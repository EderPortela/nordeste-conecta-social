import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentSection from "./CommentSection";
import ReactionPicker from "./ReactionPicker";
import ShareDialog from "./ShareDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    video_url?: string | null;
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
  const [showShare, setShowShare] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);

  useEffect(() => {
    loadShareCount();
  }, [post.id]);

  const loadShareCount = async () => {
    const { count } = await supabase
      .from("post_shares")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);
    setShareCount(count || 0);
  };

  useEffect(() => {
    checkIfLiked();
  }, [post.id, currentUserId]);

  const checkIfLiked = async () => {
    try {
      const { data, error } = await supabase
        .from("post_reactions")
        .select("reaction_type")
        .eq("post_id", post.id)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.reaction_type) {
        setCurrentReaction(data.reaction_type);
        setIsLiked(true);
      }
    } catch (error) {
      console.error("Error checking reaction:", error);
    }
  };

  const handleReactionChange = () => {
    checkIfLiked();
    onUpdate();
  };

  const handleDoubleTap = async () => {
    if (isLiked) return;
    setDoubleTapHeart(true);
    setTimeout(() => setDoubleTapHeart(false), 1000);
    // Trigger a like via reaction
    try {
      await supabase.from("post_reactions").upsert({
        post_id: post.id,
        user_id: currentUserId,
        reaction_type: "like",
      }, { onConflict: "post_id,user_id" });
      setIsLiked(true);
      setCurrentReaction("❤️");
      setLocalLikeCount(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removido dos salvos" : "Salvo",
      description: isSaved ? "" : "Você pode ver depois!",
    });
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que quer deletar este post?")) return;
    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      toast({ title: "Post deletado" });
      onUpdate();
    } catch (error: any) {
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
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
      if (word.startsWith("@")) {
        return (
          <span key={index} className="text-primary font-medium">
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const hasMedia = post.image_url || post.video_url;

  return (
    <Card className="rounded-none sm:rounded-xl border-x-0 sm:border-x border-border bg-card overflow-hidden shadow-none sm:shadow-card">
      {/* Header - Instagram style */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-9 w-9 ring-2 ring-primary/20">
          {post.avatar_url ? (
            <AvatarImage src={post.avatar_url} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-bold">
              {post.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">{post.username}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {post.user_id === currentUserId && (
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setShowShare(true)}>
              <Send className="h-4 w-4 mr-2" />
              Compartilhar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Media - Full width Instagram style */}
      {hasMedia && (
        <div
          className="relative w-full bg-muted cursor-pointer"
          onDoubleClick={handleDoubleTap}
        >
          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post"
              className="w-full object-cover max-h-[600px]"
              loading="lazy"
            />
          )}
          {post.video_url && (
            <video
              src={post.video_url}
              controls
              className="w-full max-h-[600px]"
            />
          )}
          {/* Double-tap heart animation */}
          {doubleTapHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="h-24 w-24 text-white fill-white animate-pulse-heart drop-shadow-lg" />
            </div>
          )}
        </div>
      )}

      {/* Action buttons - Instagram style */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <ReactionPicker
              postId={post.id}
              currentUserId={currentUserId}
              currentReaction={currentReaction || null}
              onReactionChange={handleReactionChange}
            />
            <button onClick={() => setShowComments(!showComments)}>
              <MessageCircle className="h-6 w-6 text-foreground hover:text-muted-foreground transition-colors" strokeWidth={1.5} />
            </button>
            <button onClick={() => setShowShare(true)}>
              <Send className="h-6 w-6 text-foreground hover:text-muted-foreground transition-colors" strokeWidth={1.5} />
            </button>
          </div>
          <button onClick={handleSave}>
            <Bookmark
              className={`h-6 w-6 transition-colors ${isSaved ? "text-foreground fill-current" : "text-foreground hover:text-muted-foreground"}`}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* Like count */}
        {localLikeCount > 0 && (
          <p className="font-semibold text-sm mb-1">
            {localLikeCount} {localLikeCount === 1 ? 'curtida' : 'curtidas'}
          </p>
        )}

        {/* Content text */}
        <div className="mb-1">
          <p className="text-sm">
            <span className="font-semibold mr-1">{post.username}</span>
            {renderContent(post.content)}
          </p>
        </div>

        {/* Comment count */}
        {post.comment_count > 0 && !showComments && (
          <button
            className="text-sm text-muted-foreground mb-1"
            onClick={() => setShowComments(true)}
          >
            Ver {post.comment_count > 1 ? `todos os ${post.comment_count} comentários` : '1 comentário'}
          </button>
        )}

        {/* Comments section */}
        {showComments && (
          <div className="pt-2 border-t border-border/50 animate-fade-in">
            <CommentSection
              postId={post.id}
              currentUserId={currentUserId}
              onCommentAdded={onUpdate}
            />
          </div>
        )}
      </div>

      <div className="h-3" />

      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        postId={post.id}
        postContent={post.content}
        postAuthor={post.username}
        currentUserId={currentUserId}
        onShared={loadShareCount}
      />
    </Card>
  );
};

export default PostCard;
