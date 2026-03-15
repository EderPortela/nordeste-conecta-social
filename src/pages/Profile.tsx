import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Edit,
  Grid3X3,
  Bookmark,
  Settings,
  Heart,
  MessageCircle,
} from "lucide-react";
import LeftSidebar from "@/components/LeftSidebar";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";
import EditProfileDialog from "@/components/EditProfileDialog";
import PhotoGalleryModal from "@/components/PhotoGalleryModal";
import FriendshipButton from "@/components/FriendshipButton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
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

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { username } = useParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("grid");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<{ url: string; post_id: string; created_at: string }[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setCurrentUser(session.user);
      loadCurrentUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) { navigate("/auth"); return; }
      setCurrentUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) loadProfile();
  }, [username, currentUser]);

  const loadCurrentUserProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setCurrentUserProfile(data);
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      let query = supabase.from("profiles").select("*");
      if (username) query = query.eq("username", username);
      else if (currentUser) query = query.eq("id", currentUser.id);

      const { data, error } = await query.single();
      if (error) throw error;
      setProfile(data);
      await Promise.all([loadPosts(data.id), loadStats(data.id)]);
    } catch (error: any) {
      toast({ title: "Erro ao carregar perfil", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (userId: string) => {
    const { data } = await supabase
      .from("posts_with_stats").select("*")
      .eq("user_id", userId).order("created_at", { ascending: false });
    setPosts(data || []);
    const postPhotos = (data || [])
      .filter((post) => post.image_url)
      .map((post) => ({ url: post.image_url, post_id: post.id, created_at: post.created_at }));
    setPhotos(postPhotos);
  };

  const loadStats = async (userId: string) => {
    const { data: statsData } = await supabase
      .from("profile_stats")
      .select("followers_count, following_count, posts_count")
      .eq("id", userId).single();

    setStats({
      followers: statsData?.followers_count || 0,
      following: statsData?.following_count || 0,
      posts: statsData?.posts_count || 0,
    });

    if (currentUser && currentUser.id !== userId) {
      const { data: followData } = await supabase
        .from("followers").select("id")
        .eq("follower_id", currentUser.id).eq("following_id", userId).single();
      setIsFollowing(!!followData);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase.from("followers").delete()
          .eq("follower_id", currentUser.id).eq("following_id", profile.id);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await supabase.from("followers").insert({
          follower_id: currentUser.id, following_id: profile.id,
        });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  if (loading || !profile || !currentUserProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <div className="container mx-auto px-0 sm:px-4 lg:px-6 py-0 lg:py-6">
        <div className="flex gap-6 max-w-[1200px] mx-auto">
          {/* LEFT SIDEBAR - Desktop */}
          <LeftSidebar
            profile={{
              username: currentUserProfile.username,
              display_name: currentUserProfile.display_name,
              location: currentUserProfile.location || undefined,
            }}
            activeRoute="/perfil"
            onNavigate={(route) => navigate(route)}
            onNewPost={() => navigate("/feed")}
          />

          {/* CENTER COLUMN - Instagram-style Profile */}
          <main className="flex-1 max-w-2xl mx-auto lg:mx-0 w-full">
            {/* Profile Header - Instagram style */}
            <div className="px-4 sm:px-8 py-6 sm:py-10">
              <div className="flex items-start gap-6 sm:gap-10">
                {/* Avatar - Large, centered on mobile */}
                <Avatar className="h-20 w-20 sm:h-36 sm:w-36 ring-2 ring-border flex-shrink-0">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl sm:text-4xl font-bold">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Username + action buttons */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <h1 className="text-xl font-normal text-foreground">{profile.username}</h1>
                    {isOwnProfile ? (
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 rounded-lg font-semibold text-sm"
                          onClick={() => setShowEditDialog(true)}
                        >
                          Editar perfil
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => navigate("/configuracoes")}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className={`h-8 rounded-lg font-semibold text-sm ${isFollowing ? 'bg-muted text-foreground hover:bg-muted/80' : ''}`}
                          variant={isFollowing ? "secondary" : "default"}
                          onClick={handleFollow}
                          disabled={followLoading}
                        >
                          {isFollowing ? "Seguindo" : "Seguir"}
                        </Button>
                        <FriendshipButton
                          currentUserId={currentUser!.id}
                          targetUserId={profile.id}
                          targetUsername={profile.username}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 rounded-lg font-semibold text-sm"
                          onClick={() => navigate("/mensagens")}
                        >
                          Mensagem
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Stats - Instagram style */}
                  <div className="hidden sm:flex gap-8 mb-4">
                    <span><strong>{stats.posts}</strong> publicações</span>
                    <span><strong>{stats.followers}</strong> seguidores</span>
                    <span><strong>{stats.following}</strong> seguindo</span>
                  </div>

                  {/* Bio */}
                  <div className="hidden sm:block">
                    <p className="font-semibold text-sm">{profile.display_name}</p>
                    {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
                    {profile.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />{profile.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile bio */}
              <div className="sm:hidden mt-4">
                <p className="font-semibold text-sm">{profile.display_name}</p>
                {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
                {profile.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />{profile.location}
                  </p>
                )}
              </div>

              {/* Mobile stats */}
              <div className="sm:hidden flex border-t border-border mt-4 py-3">
                <div className="flex-1 text-center">
                  <p className="font-semibold text-sm">{stats.posts}</p>
                  <p className="text-xs text-muted-foreground">publicações</p>
                </div>
                <div className="flex-1 text-center border-x border-border">
                  <p className="font-semibold text-sm">{stats.followers}</p>
                  <p className="text-xs text-muted-foreground">seguidores</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="font-semibold text-sm">{stats.following}</p>
                  <p className="text-xs text-muted-foreground">seguindo</p>
                </div>
              </div>

              {/* Cultural badges */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-primary/20">
                  🌵 Nordestino
                </Badge>
                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-secondary/10 to-secondary/5 text-secondary border-secondary/20">
                  🔥 Arretado
                </Badge>
              </div>
            </div>

            {/* Tabs - Instagram style grid/posts */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-transparent border-t border-border rounded-none h-12 p-0">
                <TabsTrigger
                  value="grid"
                  className="flex-1 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent h-full"
                >
                  <Grid3X3 className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger
                  value="posts"
                  className="flex-1 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent h-full"
                >
                  <Heart className="h-5 w-5" />
                </TabsTrigger>
                <TabsTrigger
                  value="saved"
                  className="flex-1 rounded-none border-t-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent h-full"
                >
                  <Bookmark className="h-5 w-5" />
                </TabsTrigger>
              </TabsList>

              {/* Grid Tab - Instagram photo grid */}
              <TabsContent value="grid" className="mt-0">
                {photos.length === 0 && posts.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-5xl mb-4">📷</div>
                    <p className="text-lg font-semibold mb-1">Compartilhe fotos</p>
                    <p className="text-sm text-muted-foreground">
                      {isOwnProfile ? "Quando você compartilhar fotos, elas aparecerão aqui." : "Nenhuma foto ainda."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.post_id}
                        onClick={() => { setSelectedPhotoIndex(index); setShowGallery(true); }}
                        className="relative aspect-square overflow-hidden group"
                      >
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-4 text-white text-sm font-semibold">
                            <span>❤️</span>
                            <span>💬</span>
                          </div>
                        </div>
                      </button>
                    ))}
                    {/* Show text-only posts as placeholder tiles */}
                    {posts.filter(p => !p.image_url).map((post) => (
                      <div
                        key={post.id}
                        className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-3"
                      >
                        <p className="text-xs text-center text-muted-foreground line-clamp-4">{post.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Posts Tab - Feed style */}
              <TabsContent value="posts" className="mt-0 space-y-0 sm:space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground">Nenhum post ainda</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUser!.id}
                      onUpdate={loadProfile}
                    />
                  ))
                )}
              </TabsContent>

              {/* Saved Tab */}
              <TabsContent value="saved" className="mt-0">
                <div className="text-center py-20">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" strokeWidth={1} />
                  <p className="text-lg font-semibold mb-1">Salvos</p>
                  <p className="text-sm text-muted-foreground">
                    {isOwnProfile ? "Salve fotos e posts que quiser ver novamente." : "Nada salvo ainda."}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {isOwnProfile && profile && (
        <EditProfileDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          profile={profile}
          onSuccess={loadProfile}
        />
      )}

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        photos={photos}
        initialIndex={selectedPhotoIndex}
        open={showGallery}
        onOpenChange={setShowGallery}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeRoute="/perfil"
        onNavigate={(route) => navigate(route)}
      />
    </div>
  );
};

export default Profile;
