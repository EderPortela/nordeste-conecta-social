import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // Verificar autenticação
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      if (session.user) {
        loadProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
      loadPosts();
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts_with_stats")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar posts",
        description: error.message,
        variant: "destructive",
      });
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

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile & Desktop */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover-lift"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Portella 🌵
          </h1>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden md:inline">
              @{profile.username}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover-lift">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout - 3 Columns */}
      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6 max-w-[1600px] mx-auto">
          {/* LEFT SIDEBAR - Navegação e Identidade */}
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

          {/* CENTER COLUMN - Feed de Postagens (Principal) */}
          <main className="flex-1 max-w-3xl mx-auto lg:mx-0 w-full">
            {/* Create Post Form */}
            {showCreatePost && (
              <div className="mb-6 animate-fade-in">
                <CreatePost
                  userId={user.id}
                  onPostCreated={handlePostCreated}
                />
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-16 bg-card rounded-2xl shadow-card border border-border">
                  <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                  <p className="text-muted-foreground font-medium">Carregando o melhor do Nordeste...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl shadow-card border border-border">
                  <div className="text-6xl mb-4">🌵</div>
                  <p className="text-xl font-semibold text-foreground mb-2">
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
                posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <PostCard
                      post={post}
                      currentUserId={user.id}
                      onUpdate={loadPosts}
                    />
                  </div>
                ))
              )}
            </div>
          </main>

          {/* RIGHT SIDEBAR - Descobertas e Cultura */}
          <RightSidebar />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm animate-fade-in">
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={() => setShowMobileMenu(false)}
              className="mb-4"
            >
              Fechar
            </Button>
            <LeftSidebar
              profile={{
                username: profile.username,
                display_name: profile.display_name,
                location: profile.location || undefined,
              }}
              activeRoute="/feed"
              onNavigate={(route) => {
                setShowMobileMenu(false);
                navigate(route);
              }}
              onNewPost={() => {
                setShowMobileMenu(false);
                setShowCreatePost(!showCreatePost);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;