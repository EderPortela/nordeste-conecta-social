import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StoryViewer from "./StoryViewer";

interface Story {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  media_url: string;
  media_type: string;
  created_at: string;
  view_count: number;
}

interface StoriesBarProps {
  currentUserId: string;
}

const StoriesBar = ({ currentUserId }: StoriesBarProps) => {
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<Map<string, Story[]>>(new Map());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const { data, error } = await supabase
      .from("stories_with_user" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar stories:", error);
      return;
    }

    if (data) {
      setStories(data as any);
      
      // Agrupar stories por usuário
      const grouped = new Map<string, Story[]>();
      data.forEach((story: any) => {
        const userStories = grouped.get(story.user_id) || [];
        userStories.push(story);
        grouped.set(story.user_id, userStories);
      });
      
      setGroupedStories(grouped);
    }
  };

  const handleUploadStory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `${currentUserId}/${Date.now()}.${fileExt}`;

    setUploading(true);

    try {
      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pegar URL pública
      const { data } = supabase.storage.from("stories").getPublicUrl(filePath);

      // Criar registro no banco
      const mediaType = file.type.startsWith("video") ? "video" : "image";
      const { error: insertError } = await supabase.from("stories" as any).insert({
        user_id: currentUserId,
        media_url: data.publicUrl,
        media_type: mediaType,
      });

      if (insertError) throw insertError;

      toast({
        title: "Story publicado!",
        description: "Seu story está disponível por 24 horas.",
      });

      loadStories();
    } catch (error: any) {
      toast({
        title: "Erro ao publicar story",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const userStories = Array.from(groupedStories.entries()).map(([userId, userStoryList]) => ({
    userId,
    stories: userStoryList,
    latestStory: userStoryList[0],
  }));

  // Colocar story do usuário atual no início
  const sortedUserStories = userStories.sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide">
        {/* Adicionar Story */}
        <div className="flex flex-col items-center gap-2 min-w-fit">
          <label htmlFor="story-upload" className="cursor-pointer">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-dashed border-primary">
                <AvatarImage src="" alt="" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Plus className="h-6 w-6 text-primary" />
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-1 max-w-[70px] truncate">Seu story</p>
          </label>
          <input
            id="story-upload"
            type="file"
            accept="image/*,video/*"
            onChange={handleUploadStory}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Stories dos usuários */}
        {sortedUserStories.map(({ userId, stories: userStoryList, latestStory }) => (
          <div
            key={userId}
            className="flex flex-col items-center gap-2 min-w-fit cursor-pointer"
            onClick={() => setSelectedUserId(userId)}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 rounded-full p-[2px] animate-pulse">
                <div className="bg-background rounded-full p-[2px]">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={latestStory.avatar_url || ""} alt={latestStory.display_name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      {latestStory.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <Avatar className="h-16 w-16 opacity-0">
                <AvatarImage src="" alt="" />
                <AvatarFallback></AvatarFallback>
              </Avatar>
            </div>
            <p className="text-xs text-center max-w-[70px] truncate">
              {userId === currentUserId ? "Você" : latestStory.display_name}
            </p>
          </div>
        ))}
      </div>

      {/* Visualizador de Stories */}
      {selectedUserId && (
        <StoryViewer
          userId={selectedUserId}
          stories={groupedStories.get(selectedUserId) || []}
          currentUserId={currentUserId}
          onClose={() => setSelectedUserId(null)}
          onFinish={() => {
            // Ir para o próximo usuário
            const currentIndex = sortedUserStories.findIndex(us => us.userId === selectedUserId);
            if (currentIndex < sortedUserStories.length - 1) {
              setSelectedUserId(sortedUserStories[currentIndex + 1].userId);
            } else {
              setSelectedUserId(null);
            }
          }}
        />
      )}
    </>
  );
};

export default StoriesBar;
