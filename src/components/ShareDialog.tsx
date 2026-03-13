import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Send } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postContent: string;
  postAuthor: string;
  currentUserId: string;
  onShared?: () => void;
}

const ShareDialog = ({
  open,
  onOpenChange,
  postId,
  postContent,
  postAuthor,
  currentUserId,
  onShared,
}: ShareDialogProps) => {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const { error } = await supabase
        .from("post_shares" as any)
        .insert({
          post_id: postId,
          user_id: currentUserId,
          comment: comment || null,
        } as any);

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Já compartilhado!",
            description: "Você já compartilhou esse post, visse?",
          });
        } else {
          throw error;
        }
      } else {
        // Create notification for post author
        const { data: postData } = await supabase
          .from("posts")
          .select("user_id")
          .eq("id", postId)
          .single();

        if (postData && postData.user_id !== currentUserId) {
          await supabase.from("notifications" as any).insert({
            user_id: postData.user_id,
            actor_id: currentUserId,
            type: "share",
            title: "compartilhou seu post",
            body: postContent.substring(0, 100),
            reference_id: postId,
            reference_type: "post",
          } as any);
        }

        toast({
          title: "Compartilhado! 🎉",
          description: "Post compartilhado no seu feed!",
        });
        onShared?.();
      }

      setComment("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao compartilhar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    toast({
      title: "Link copiado! 📋",
      description: "Compartilhe onde quiser!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Compartilhar Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original post preview */}
          <div className="bg-muted/50 rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">
              Post de @{postAuthor}
            </p>
            <p className="text-sm line-clamp-3">{postContent}</p>
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Adicione um comentário ao compartilhar... (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
            rows={3}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {sharing ? "Compartilhando..." : "Compartilhar no Feed"}
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
