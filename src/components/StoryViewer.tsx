import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Story {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  media_url: string;
  media_type: string;
  created_at: string;
}

interface StoryViewerProps {
  userId: string;
  stories: Story[];
  currentUserId: string;
  onClose: () => void;
  onFinish: () => void;
}

const StoryViewer = ({ userId, stories, currentUserId, onClose, onFinish }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.media_type === "video" ? 15000 : 5000;

  useEffect(() => {
    if (!currentStory) return;

    // Registrar visualização
    const recordView = async () => {
      await supabase.from("story_views" as any).insert({
        story_id: currentStory.id,
        viewer_id: currentUserId,
      }).then(() => {});
    };

    recordView();
  }, [currentStory, currentUserId]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (duration / 100));
        
        if (newProgress >= 100) {
          handleNext();
          return 0;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, duration]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onFinish();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Barra de progresso */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={currentStory.avatar_url || ""} alt={currentStory.display_name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
              {currentStory.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-semibold">{currentStory.display_name}</p>
            <p className="text-xs text-white/70">
              {new Date(currentStory.created_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Conteúdo do Story */}
      <div
        className="relative w-full h-full max-w-md flex items-center justify-center"
        onClick={() => setIsPaused(!isPaused)}
      >
        {currentStory.media_type === "video" ? (
          <video
            src={currentStory.media_url}
            className="max-h-full max-w-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Navegação */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="text-white hover:bg-white/20 pointer-events-auto"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        <div className="flex-1" />
        {currentIndex < stories.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="text-white hover:bg-white/20 pointer-events-auto"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
