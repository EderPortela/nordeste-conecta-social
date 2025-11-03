import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Flame, Zap, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  postId: string;
  currentReaction?: string;
  onReact: (reaction: string) => void;
  className?: string;
}

const reactions = [
  { id: "arretado", label: "Arretado!", icon: Heart, color: "text-arretado" },
  { id: "massa", label: "Massa demais!", icon: Flame, color: "text-massa" },
  { id: "oxente", label: "Oxente!", icon: Zap, color: "text-oxente" },
  { id: "cabra-bom", label: "Cabra bom!", icon: Smile, color: "text-cabra-bom" },
];

const ReactionPicker = ({ currentReaction, onReact, className }: ReactionPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = (reactionId: string) => {
    onReact(reactionId);
    setShowPicker(false);
  };

  const currentReactionData = reactions.find(r => r.id === currentReaction);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          "transition-all",
          currentReaction && currentReactionData?.color
        )}
      >
        {currentReactionData ? (
          <>
            <currentReactionData.icon className="mr-2 h-4 w-4 fill-current animate-pulse-heart" />
            {currentReactionData.label}
          </>
        ) : (
          <>
            <Heart className="mr-2 h-4 w-4" />
            Curtir
          </>
        )}
      </Button>

      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-2xl shadow-card p-2 flex gap-1 animate-fade-in z-10">
          {reactions.map((reaction) => (
            <Button
              key={reaction.id}
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reaction.id)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 hover:scale-110 transition-transform",
                reaction.color
              )}
              title={reaction.label}
            >
              <reaction.icon className="h-5 w-5" />
              <span className="text-xs whitespace-nowrap">{reaction.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
