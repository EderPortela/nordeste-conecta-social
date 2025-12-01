import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Users, Settings, ArrowLeft, UserPlus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
  creator_id: string;
}

interface Member {
  id: string;
  user_id: string;
  joined_at: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  hashtags: string[];
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
}

const CommunityPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { communityId } = useParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);
      loadCommunityData(session.user.id);
    });
  }, [navigate, communityId]);

  const loadCommunityData = async (userId: string) => {
    setLoading(true);
    try {
      // Load community info
      const { data: communityData, error: communityError } = await (supabase as any)
        .from("communities")
        .select("*")
        .eq("id", communityId)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);
      setIsCreator(communityData.creator_id === userId);

      // Check if user is member
      const { data: memberData } = await (supabase as any)
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .single();

      setIsMember(!!memberData);

      // Load members
      await loadMembers();

      // Load posts if user is member
      if (memberData) {
        await loadPosts();
      }
    } catch (error: any) {
      console.error("Error loading community:", error);
      toast({
        title: "Erro ao carregar comunidade",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      // In a real implementation, you'd have a community_posts table
      // For now, we'll just show recent posts
      const { data, error } = await supabase
        .from("posts_with_stats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      // Map to include video_url (default to null if not present)
      const postsWithVideo = (data || []).map((post: any) => ({
        ...post,
        video_url: post.video_url || null
      }));
      setPosts(postsWithVideo);
    } catch (error: any) {
      console.error("Error loading posts:", error);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("community_members")
        .select(`
          id,
          user_id,
          joined_at,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("community_id", communityId);

      if (error) throw error;

      const formattedMembers = (data || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        joined_at: member.joined_at,
        username: member.profiles?.username || "unknown",
        display_name: member.profiles?.display_name || "Usuário",
        avatar_url: member.profiles?.avatar_url || null,
      }));

      setMembers(formattedMembers);
    } catch (error: any) {
      console.error("Error loading members:", error);
    }
  };

  const toggleMembership = async () => {
    if (!currentUser) return;

    try {
      if (isMember) {
        await (supabase as any)
          .from("community_members")
          .delete()
          .eq("community_id", communityId)
          .eq("user_id", currentUser.id);

        toast({
          title: "Você saiu da comunidade",
        });
        setIsMember(false);
        setPosts([]);
      } else {
        await (supabase as any)
          .from("community_members")
          .insert({
            community_id: communityId,
            user_id: currentUser.id
          });

        toast({
          title: "Você entrou na comunidade!",
          description: "+10 XP",
        });
        setIsMember(true);
        await loadPosts();
      }

      await loadMembers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Comunidade não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <LeftSidebar 
              activeRoute="/comunidades"
              onNavigate={(route) => navigate(route)}
            />
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="space-y-6">
              {/* Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/comunidades")}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    {isCreator && (
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                    )}
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl">{community.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {community.description}
                      </CardDescription>
                    </div>
                    <Badge>{community.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {members.length} membros
                      </div>
                      {isCreator && (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Criador
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant={isMember ? "outline" : "default"}
                      onClick={toggleMembership}
                    >
                      {isMember ? "Sair da Comunidade" : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Entrar na Vila
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="feed" className="flex-1">Feed</TabsTrigger>
                  <TabsTrigger value="members" className="flex-1">Membros</TabsTrigger>
                  <TabsTrigger value="about" className="flex-1">Sobre</TabsTrigger>
                </TabsList>

                {/* Feed Tab */}
                <TabsContent value="feed" className="space-y-6 mt-6">
                  {!isMember ? (
                    <Card className="p-8 text-center">
                      <p className="text-lg font-semibold mb-2">
                        Entre na comunidade para ver o feed
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Conecte-se com outros membros e participe das conversas
                      </p>
                      <Button onClick={toggleMembership}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Entrar na Vila
                      </Button>
                    </Card>
                  ) : (
                    <>
                      {currentUser && <CreatePost userId={currentUser.id} onPostCreated={loadPosts} />}
                      {posts.length === 0 ? (
                        <Card className="p-8 text-center">
                          <p className="text-muted-foreground">
                            Nenhum post ainda. Seja o primeiro a postar!
                          </p>
                        </Card>
                      ) : (
                        posts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={currentUser?.id || ""}
                            onUpdate={loadPosts}
                          />
                        ))
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Membros ({members.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                {member.avatar_url ? (
                                  <AvatarImage src={member.avatar_url} />
                                ) : (
                                  <AvatarFallback>
                                    {member.display_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="font-semibold">{member.display_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  @{member.username}
                                </p>
                              </div>
                            </div>
                            {member.user_id === community.creator_id && (
                              <Badge variant="secondary">
                                <Shield className="h-3 w-3 mr-1" />
                                Criador
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sobre a Comunidade</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Descrição</h4>
                        <p className="text-muted-foreground">{community.description}</p>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Regras</h4>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                          <li>Seja respeitoso com todos os membros</li>
                          <li>Mantenha as discussões relevantes ao tema da comunidade</li>
                          <li>Não compartilhe conteúdo ofensivo ou inadequado</li>
                          <li>Valorize a cultura nordestina e suas tradições</li>
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-2">Estatísticas</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-muted-foreground">Total de Membros</p>
                            <p className="text-2xl font-bold">{members.length}</p>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-muted-foreground">Posts</p>
                            <p className="text-2xl font-bold">{posts.length}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
