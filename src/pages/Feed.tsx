import { useEffect, useState } from "react";
import logoImg from "@/assets/logo-portellalens.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Menu } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import BottomNav from "@/components/BottomNav";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import StoriesBar from "@/components/StoriesBar";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  location?: string | null;
}

interface Post {
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
}

const Feed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      if (session.user) loadProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      setProfile(data);
      loadPosts();
    } catch (error: any) {
      toast({ title: "Erro ao carregar perfil", description: error.message, variant: "destructive" });
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts_with_stats").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar posts", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handlePostCreated = () => {
    setShowCreatePost(false);
    loadPosts();
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      {/* Header - Instagram style */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/feed")}>
            <img src={logoImg} alt="PortellaLens" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell userId={user.id} />
            <span className="text-sm font-medium text-muted-foreground hidden md:inline ml-2">
              @{profile.username}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden lg:flex">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="container mx-auto px-0 sm:px-4 lg:px-6 py-0 lg:py-6">
        <div className="flex gap-6 max-w-[1200px] mx-auto">
          {/* LEFT SIDEBAR - Desktop only */}
          <LeftSidebar
            profile={{
              username: profile.username,
              display_name: profile.display_name,
              location: profile.location || undefined,
            }}
            activeRoute="/feed"
            onNavigate={(route) => navigate(route)}
            onNewPost={() => setShowCreatePost(!showCreatePost)}
          />

          {/* CENTER COLUMN - Feed */}
          <main className="flex-1 max-w-lg mx-auto w-full">
            {/* Stories - Instagram style */}
            <div className="border-b border-border bg-card mb-0 sm:rounded-xl sm:border sm:mb-4">
              <div className="py-3 px-4">
                <StoriesBar currentUserId={user.id} />
              </div>
            </div>

            {/* Create Post Form */}
            {showCreatePost && (
              <div className="mb-4 px-4 sm:px-0 animate-fade-in">
                <CreatePost userId={user.id} onPostCreated={handlePostCreated} />
              </div>
            )}

            {/* Posts Feed - Instagram style */}
            <div className="space-y-0 sm:space-y-4">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="text-muted-foreground text-sm mt-3">Carregando...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="text-6xl mb-4">🌵</div>
                  <p className="text-lg font-semibold text-foreground mb-2">
                    Nenhum post ainda, visse?
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Seja o primeiro a compartilhar algo arretado!
                  </p>
                  <Button onClick={() => setShowCreatePost(true)}>
                    Criar Primeiro Post
                  </Button>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    onUpdate={loadPosts}
                  />
                ))
              )}
            </div>
          </main>

          {/* RIGHT SIDEBAR - Desktop only */}
          <RightSidebar />
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav
        activeRoute="/feed"
        onNavigate={(route) => navigate(route)}
        onNewPost={() => setShowCreatePost(!showCreatePost)}
      />
    </div>
  );
};

export default Feed;
