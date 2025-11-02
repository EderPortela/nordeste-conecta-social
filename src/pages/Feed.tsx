import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
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
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Portella
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              @{profile.username}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Create Post Button */}
        <Button
          onClick={() => setShowCreatePost(!showCreatePost)}
          className="w-full mb-6"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          {showCreatePost ? "Cancelar" : "Criar novo post"}
        </Button>

        {/* Create Post Form */}
        {showCreatePost && (
          <div className="mb-6">
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
              <p className="text-muted-foreground">Carregando posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">Nenhum post ainda, visse?</p>
              <p className="text-sm text-muted-foreground">
                Seja o primeiro a compartilhar algo arretado!
              </p>
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
    </div>
  );
};

export default Feed;