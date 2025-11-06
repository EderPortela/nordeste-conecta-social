import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Calendar, 
  Edit,
  Heart,
  MessageCircle,
  Image as ImageIcon,
  Info
} from "lucide-react";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import PostCard from "@/components/PostCard";
import EditProfileDialog from "@/components/EditProfileDialog";
import PhotoGalleryModal from "@/components/PhotoGalleryModal";
import GamificationBadge from "@/components/GamificationBadge";
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
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<{ url: string; post_id: string; created_at: string }[]>([]);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);
      loadCurrentUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    }
  }, [username, currentUser]);

  const loadCurrentUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error: any) {
      console.error("Error loading current user profile:", error);
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      let query = supabase.from("profiles").select("*");
      
      if (username) {
        query = query.eq("username", username);
      } else if (currentUser) {
        query = query.eq("id", currentUser.id);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      setProfile(data);
      await loadPosts(data.id);
      await loadStats(data.id);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("posts_with_stats")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);

      // Extract photos for gallery
      const postPhotos = (data || [])
        .filter((post) => post.image_url)
        .map((post) => ({
          url: post.image_url,
          post_id: post.id,
          created_at: post.created_at,
        }));
      setPhotos(postPhotos);
    } catch (error: any) {
      console.error("Error loading posts:", error);
    }
  };

  const loadStats = async (userId: string) => {
    try {
      const { data: statsData, error } = await supabase
        .from("profile_stats")
        .select("followers_count, following_count, posts_count")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setStats({
        followers: statsData?.followers_count || 0,
        following: statsData?.following_count || 0,
        posts: statsData?.posts_count || 0,
      });

      // Check if current user is following this profile
      if (currentUser && currentUser.id !== userId) {
        const { data: followData } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", userId)
          .single();

        setIsFollowing(!!followData);
      }
    } catch (error: any) {
      console.error("Error loading stats:", error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id);

        if (error) throw error;

        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
        
        toast({
          title: "Deixou de seguir",
          description: `Você não segue mais @${profile.username}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id,
          });

        if (error) throw error;

        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
        
        toast({
          title: "Seguindo! 🎉",
          description: `Você agora segue @${profile.username}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  if (loading || !profile || !currentUserProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Layout */}
      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6 max-w-[1600px] mx-auto">
          {/* LEFT SIDEBAR */}
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

          {/* CENTER COLUMN - Profile Content */}
          <main className="flex-1 max-w-3xl mx-auto lg:mx-0 w-full">
            {/* Profile Header Card */}
            <Card className="rounded-2xl shadow-card border border-border overflow-hidden mb-6">
              {/* Cover Photo */}
              <div className="relative h-64 bg-gradient-to-br from-primary via-secondary to-accent overflow-hidden">
                {profile.cover_url && (
                  <img
                    src={profile.cover_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Profile Info */}
              <CardContent className="relative pt-0 pb-6">
                {/* Avatar */}
                <div className="flex justify-between items-start -mt-16 mb-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-glow">
                      {profile.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-4xl font-bold">
                          {profile.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>

                  {isOwnProfile ? (
                    <Button 
                      variant="outline" 
                      className="mt-4 hover-lift"
                      onClick={() => setShowEditDialog(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  ) : (
                    <div className="flex gap-2 mt-4">
                      <Button 
                        className="hover-lift shadow-soft min-w-[100px]"
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant={isFollowing ? "outline" : "default"}
                      >
                        {followLoading ? "..." : isFollowing ? "Seguindo" : "Seguir"}
                      </Button>
                      <Button variant="outline" className="hover-lift">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Mensagem
                      </Button>
                    </div>
                  )}
                </div>

                {/* Name and Bio */}
                <div className="space-y-3 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {profile.display_name}
                    </h1>
                    <p className="text-lg text-muted-foreground">@{profile.username}</p>
                  </div>

                  {profile.bio && (
                    <p className="text-foreground leading-relaxed">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Entrou em {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 pt-3">
                    <button className="hover:underline transition-all">
                      <span className="font-bold text-foreground">{stats.posts}</span>
                      <span className="text-muted-foreground ml-1">Posts</span>
                    </button>
                    <button className="hover:underline transition-all">
                      <span className="font-bold text-foreground">{stats.followers}</span>
                      <span className="text-muted-foreground ml-1">Seguidores</span>
                    </button>
                    <button className="hover:underline transition-all">
                      <span className="font-bold text-foreground">{stats.following}</span>
                      <span className="text-muted-foreground ml-1">Seguindo</span>
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-gradient-to-r from-arretado/20 to-arretado/10 text-arretado border-arretado/30">
                    🔥 Cabra Arretado
                  </Badge>
                  <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30">
                    🌵 Nordestino de Raiz
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Profile Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <Card className="rounded-2xl shadow-card border border-border mb-6">
                <TabsList className="w-full justify-start rounded-none bg-transparent border-b h-auto p-0">
                  <TabsTrigger 
                    value="posts" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger 
                    value="about"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Sobre
                  </TabsTrigger>
                  <TabsTrigger 
                    value="photos"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Fotos
                  </TabsTrigger>
                </TabsList>
              </Card>

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-6 mt-0">
                {posts.length === 0 ? (
                  <Card className="rounded-2xl shadow-card border border-border p-16 text-center">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-xl font-semibold text-foreground mb-2">
                      Nenhum post ainda
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isOwnProfile ? "Compartilhe suas histórias do Nordeste!" : "Este usuário ainda não publicou nada."}
                    </p>
                  </Card>
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

              {/* About Tab */}
              <TabsContent value="about">
                <Card className="rounded-2xl shadow-card border border-border p-6">
                  <h2 className="text-2xl font-bold mb-6">Sobre</h2>
                  <div className="space-y-4">
                    {profile.bio ? (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Bio</h3>
                        <p className="text-foreground">{profile.bio}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhuma informação adicional
                      </p>
                    )}
                    
                    <Separator />
                    
                    {profile.location && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Localização</h3>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{profile.location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos">
                {photos.length === 0 ? (
                  <Card className="rounded-2xl shadow-card border border-border p-16 text-center">
                    <div className="text-6xl mb-4">📷</div>
                    <p className="text-xl font-semibold text-foreground mb-2">
                      Nenhuma foto ainda
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isOwnProfile ? "Compartilhe fotos nos seus posts!" : "Este usuário ainda não compartilhou fotos."}
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.post_id}
                        onClick={() => {
                          setSelectedPhotoIndex(index);
                          setShowGallery(true);
                        }}
                        className="relative aspect-square rounded-xl overflow-hidden group hover-scale cursor-pointer"
                      >
                        <img
                          src={photo.url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>

          {/* RIGHT SIDEBAR */}
          <RightSidebar />
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
    </div>
  );
};

export default Profile;
