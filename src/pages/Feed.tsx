import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import FeedSidebar from "@/components/FeedSidebar";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
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
  const [activeFilter, setActiveFilter] = useState("all");

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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Portella
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              @{profile.username}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover-lift">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="container mx-auto px-4 py-6 flex gap-6 max-w-7xl">
        {/* Sidebar */}
        <FeedSidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Main Content */}
        <main className="flex-1 max-w-2xl mx-auto lg:mx-0">
          {/* Create Post Button */}
          <Button
            onClick={() => setShowCreatePost(!showCreatePost)}
            className="w-full mb-6 shadow-card hover:shadow-hover transition-all rounded-2xl h-14 text-base font-semibold"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            {showCreatePost ? "Cancelar" : "Compartilhar algo arretado"}
          </Button>

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
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                <p className="text-muted-foreground">Carregando posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl shadow-card border border-border">
                <p className="text-xl font-semibold text-foreground mb-2">
                  Nenhum post ainda, visse? 🌵
                </p>
                <p className="text-sm text-muted-foreground">
                  Seja o primeiro a compartilhar algo arretado!
                </p>
              </div>
            ) : (
              posts.map((post, index) => (
                <div
                  key={post.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
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

        {/* Right Sidebar Placeholder for future features */}
        <aside className="hidden xl:block w-72 sticky top-20 h-fit">
          <div className="bg-card rounded-2xl shadow-card p-6 border border-border">
            <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              Top da Semana 🏆
            </h3>
            <p className="text-sm text-muted-foreground">
              Em breve: posts mais curtidos!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Feed;