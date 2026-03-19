import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart, Laugh, Frown, Angry, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  postId: string;
  currentUserId: string;
  currentReaction: string | null;
  onReactionChange: () => void;
}

const reactions = [
  { type: "like", icon: Heart, label: "Curtir", color: "text-red-500" },
  { type: "love", icon: Heart, label: "Amei", color: "text-pink-500" },
  { type: "haha", icon: Laugh, label: "Haha", color: "text-yellow-500" },
  { type: "wow", icon: Sparkles, label: "Uau", color: "text-blue-500" },
  { type: "sad", icon: Frown, label: "Triste", color: "text-gray-500" },
  { type: "angry", icon: Angry, label: "Grr", color: "text-orange-500" },
];

const ReactionPicker = ({ postId, currentUserId, currentReaction, onReactionChange }: ReactionPickerProps) => {
  const { toast } = useToast();
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setShowPicker(true);
  };

  const handleLeave = () => {
    hideTimeout.current = setTimeout(() => setShowPicker(false), 300);
  };

  const handleReaction = async (reactionType: string) => {
    if (!currentUserId) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para reagir.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (currentReaction === reactionType) {
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);
      } else {
        const { error: updateError } = await supabase
          .from("post_reactions")
          .update({ reaction_type: reactionType })
          .eq("post_id", postId)
          .eq("user_id", currentUserId);

        if (updateError) {
          await supabase.from("post_reactions").insert({
            post_id: postId,
            user_id: currentUserId,
            reaction_type: reactionType,
          });
        }
      }

      onReactionChange();
      setShowPicker(false);
    } catch (error: any) {
      toast({
        title: "Erro ao reagir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentReactionData = reactions.find((r) => r.type === currentReaction);

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleReaction("like")}
        disabled={isLoading}
        className={cn("px-2", currentReaction && "text-primary")}
      >
        {currentReactionData ? (
          <currentReactionData.icon className={cn("h-5 w-5", currentReactionData.color)} />
        ) : (
          <Heart className="h-5 w-5" strokeWidth={1.5} />
        )}
      </Button>

      {showPicker && (
        <div className="absolute bottom-full left-0 pb-2 z-50">
          <div className="bg-background border rounded-full shadow-xl p-1.5 flex gap-1 animate-scale-in">
            {reactions.map((reaction) => (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted hover:scale-125 transition-all duration-150"
                title={reaction.label}
              >
                <reaction.icon className={cn("h-5 w-5", reaction.color)} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
