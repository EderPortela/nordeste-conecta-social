import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Music2, Bookmark, MoreVertical, Plus, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import CreateReel from "@/components/CreateReel";

interface Reel {
  id: string;
  user_id: string;
  content: string;
  video_url: string | null;
  image_url: string | null;
  username: string;
  display_name: string;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
}

const Reels = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showCreateReel, setShowCreateReel] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/auth"); return; }
      setUser(user);
      loadReels();
    });
  }, [navigate]);

  const loadReels = async () => {
    // Load posts that have media (video or image) as reels
    const { data, error } = await supabase
      .from("posts_with_stats")
      .select("*")
      .or("video_url.neq.null,image_url.neq.null")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setReels(data.filter(p => p.video_url || p.image_url) as Reel[]);
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrolling) return;
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, isScrolling]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (isScrolling) return;

    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(reels.length - 1, currentIndex + direction));

    if (newIndex !== currentIndex) {
      setIsScrolling(true);
      setCurrentIndex(newIndex);
      containerRef.current?.children[newIndex]?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setIsScrolling(false), 600);
    }
  }, [currentIndex, reels.length, isScrolling]);

  const toggleLike = async (reelId: string) => {
    if (!user) return;
    const isLiked = likedReels.has(reelId);

    setLikedReels(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(reelId) : next.add(reelId);
      return next;
    });

    if (isLiked) {
      await supabase.from("post_reactions").delete().eq("post_id", reelId).eq("user_id", user.id);
    } else {
      await supabase.from("post_reactions").upsert({
        post_id: reelId, user_id: user.id, reaction_type: "❤️"
      }, { onConflict: "post_id,user_id" });
    }
  };

  const toggleSave = (reelId: string) => {
    setSavedReels(prev => {
      const next = new Set(prev);
      next.has(reelId) ? next.delete(reelId) : next.add(reelId);
      return next;
    });
    toast({ title: savedReels.has(reelId) ? "Removido" : "Salvo! 🌵" });
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-white font-bold text-lg">Reels</h1>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setShowCreateReel(true)}>
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Reels container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {reels.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg font-semibold">Nenhum reel ainda</p>
              <p className="text-sm text-white/60">Poste vídeos ou fotos para aparecer aqui!</p>
            </div>
          </div>
        ) : (
          reels.map((reel, index) => (
            <div key={reel.id} className="h-full w-full snap-start snap-always relative flex items-center justify-center">
              {/* Background media */}
              {reel.video_url ? (
                <video
                  src={reel.video_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted={index !== currentIndex}
                  autoPlay={index === currentIndex}
                  playsInline
                />
              ) : reel.image_url ? (
                <img
                  src={reel.image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : null}

              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

              {/* Right side actions */}
              <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-10">
                <button onClick={() => toggleLike(reel.id)} className="flex flex-col items-center gap-1">
                  <Heart
                    className={`h-7 w-7 transition-all ${likedReels.has(reel.id) ? "text-secondary fill-secondary scale-110" : "text-white"}`}
                  />
                  <span className="text-white text-xs font-semibold">{reel.like_count + (likedReels.has(reel.id) ? 1 : 0)}</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <MessageCircle className="h-7 w-7 text-white" />
                  <span className="text-white text-xs font-semibold">{reel.comment_count}</span>
                </button>

                <button className="flex flex-col items-center gap-1">
                  <Send className="h-7 w-7 text-white" />
                  <span className="text-white text-xs font-semibold">Enviar</span>
                </button>

                <button onClick={() => toggleSave(reel.id)}>
                  <Bookmark className={`h-7 w-7 transition-all ${savedReels.has(reel.id) ? "text-white fill-white" : "text-white"}`} />
                </button>

                <button>
                  <MoreVertical className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Bottom info */}
              <div className="absolute left-4 right-16 bottom-20 z-10">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 ring-2 ring-white/50">
                    {reel.avatar_url ? (
                      <AvatarImage src={reel.avatar_url} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-bold">
                        {reel.display_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-white font-semibold text-sm">{reel.username}</span>
                  <Button variant="outline" size="sm" className="h-7 rounded-lg border-white/50 text-white bg-transparent hover:bg-white/20 text-xs">
                    Seguir
                  </Button>
                </div>

                <p className="text-white text-sm leading-relaxed line-clamp-2 mb-2">
                  {reel.content}
                </p>

                <div className="flex items-center gap-2">
                  <Music2 className="h-3 w-3 text-white/70" />
                  <div className="overflow-hidden">
                    <p className="text-white/70 text-xs whitespace-nowrap animate-marquee">
                      🎵 Som original · {reel.username}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav
        activeRoute="/reels"
        onNavigate={(route) => navigate(route)}
      />

      {user && (
        <CreateReel
          userId={user.id}
          open={showCreateReel}
          onOpenChange={setShowCreateReel}
          onReelCreated={loadReels}
        />
      )}
    </div>
  );
};

export default Reels;
