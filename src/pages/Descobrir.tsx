import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import LeftSidebar from "@/components/LeftSidebar";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Search, Grid3X3, Users, MapPin, ShoppingBag } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
}

interface PostWithImage {
  id: string;
  image_url: string;
  content: string;
  like_count: number;
  comment_count: number;
}

const Descobrir = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
  const [postsWithImages, setPostsWithImages] = useState<PostWithImage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("explore");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      loadCurrentUserProfile(session.user.id);
      loadSuggestedProfiles(session.user.id);
      loadPostsWithImages();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCurrentUserProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setCurrentUserProfile(data);
  };

  const loadSuggestedProfiles = async (currentUserId: string) => {
    const { data } = await supabase.from("profiles").select("*").neq("id", currentUserId).limit(20);
    setSuggestedProfiles(data || []);
  };

  const loadPostsWithImages = async () => {
    const { data } = await supabase
      .from("posts_with_stats")
      .select("id, image_url, content, like_count, comment_count")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);
    setPostsWithImages((data || []).filter(p => p.image_url) as PostWithImage[]);
  };

  const handleFollow = async (profileId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("followers").insert({
        follower_id: user.id, following_id: profileId,
      });
      if (error) throw error;
      toast({ title: "Seguindo! 🎉" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  if (!user || !currentUserProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      {/* Header - Mobile */}
      <header className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0 rounded-xl h-9"
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-0 sm:px-4 lg:px-6 py-0 lg:py-6">
        <div className="flex gap-6 max-w-[1200px] mx-auto">
          {/* LEFT SIDEBAR */}
          <LeftSidebar
            profile={{
              username: currentUserProfile.username,
              display_name: currentUserProfile.display_name,
              location: currentUserProfile.location || undefined,
            }}
            activeRoute="/descobrir"
            onNavigate={(route) => navigate(route)}
            onNewPost={() => navigate("/feed")}
          />

          {/* CENTER COLUMN */}
          <main className="flex-1 max-w-3xl mx-auto lg:mx-0 w-full">
            {/* Desktop search */}
            <div className="hidden lg:block mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar pessoas, hashtags, lugares..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border rounded-xl h-11"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-transparent border-b border-border rounded-none h-12 p-0">
                <TabsTrigger
                  value="explore"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent h-full"
                >
                  <Grid3X3 className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger
                  value="people"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent h-full"
                >
                  <Users className="h-5 w-5" />
                </TabsTrigger>
              </TabsList>

              {/* Explore Grid - Instagram style */}
              <TabsContent value="explore" className="mt-0">
                {postsWithImages.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-5xl mb-4">📷</div>
                    <p className="text-muted-foreground">Nenhuma foto para explorar ainda</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                    {postsWithImages.map((post, index) => {
                      // Instagram-style: every 3rd set has a large tile
                      const isLarge = index % 10 === 2 || index % 10 === 7;
                      return (
                        <button
                          key={post.id}
                          className={`relative aspect-square overflow-hidden group ${
                            isLarge ? "row-span-2 col-span-1" : ""
                          }`}
                        >
                          <img
                            src={post.image_url}
                            alt=""
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-4 text-white text-sm font-semibold">
                              <span className="flex items-center gap-1">❤️ {post.like_count || 0}</span>
                              <span className="flex items-center gap-1">💬 {post.comment_count || 0}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* People - Suggested */}
              <TabsContent value="people" className="mt-4 px-4 sm:px-0">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base">Sugeridos para você</h3>
                  {suggestedProfiles.map((profile) => (
                    <div key={profile.id} className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        {profile.avatar_url ? (
                          <AvatarImage src={profile.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm">
                            {profile.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{profile.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile.display_name}</p>
                        {profile.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{profile.location}
                          </p>
                        )}
                      </div>
                      <Button size="sm" className="h-8 text-xs rounded-lg">
                        Seguir
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeRoute="/descobrir"
        onNavigate={(route) => navigate(route)}
      />
    </div>
  );
};

export default Descobrir;
