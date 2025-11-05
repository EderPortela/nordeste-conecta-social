import { useState } from "react";
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
      // Se já tem a mesma reação, remove
      if (currentReaction === reactionType) {
        await supabase
          .from("post_reactions" as any)
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);
      } else {
        // Tenta atualizar primeiro, se não existir, insere
        const { error: updateError } = await supabase
          .from("post_reactions" as any)
          .update({ reaction_type: reactionType })
          .eq("post_id", postId)
          .eq("user_id", currentUserId);

        if (updateError) {
          // Se não conseguiu atualizar, insere
          await supabase.from("post_reactions" as any).insert({
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
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setTimeout(() => setShowPicker(false), 200)}
        onClick={() => handleReaction("like")}
        disabled={isLoading}
        className={cn(currentReaction && "text-primary")}
      >
        {currentReactionData ? (
          <currentReactionData.icon className={cn("h-4 w-4 mr-2", currentReactionData.color)} />
        ) : (
          <Heart className="h-4 w-4 mr-2" />
        )}
        {currentReactionData?.label || "Reagir"}
      </Button>

      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 bg-background border rounded-full shadow-lg p-2 flex gap-2 z-10 animate-scale-in"
          onMouseEnter={() => setShowPicker(true)}
          onMouseLeave={() => setShowPicker(false)}
        >
          {reactions.map((reaction) => (
            <Button
              key={reaction.type}
              variant="ghost"
              size="icon"
              onClick={() => handleReaction(reaction.type)}
              className="hover:scale-125 transition-transform"
              title={reaction.label}
            >
              <reaction.icon className={cn("h-5 w-5", reaction.color)} />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
