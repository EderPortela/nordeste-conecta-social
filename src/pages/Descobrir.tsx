import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  MapPin,
  Users,
  Calendar,
  Star,
  Trophy,
  Sparkles,
  ShoppingBag,
  Music,
  BookOpen,
  Laugh,
  Flame,
} from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
}

const Descobrir = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadCurrentUserProfile(session.user.id);
      loadSuggestedProfiles(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
      console.error("Error loading profile:", error);
    }
  };

  const loadSuggestedProfiles = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId)
        .limit(12);

      if (error) throw error;
      setSuggestedProfiles(data || []);
    } catch (error: any) {
      console.error("Error loading profiles:", error);
    }
  };

  const handleFollow = async (profileId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("followers")
        .insert({
          follower_id: user.id,
          following_id: profileId,
        });

      if (error) throw error;

      toast({
        title: "Seguindo! 🎉",
        description: "+10 XP ganhos por fazer uma nova conexão!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const banners = [
    {
      title: "Cordel da Semana",
      description: "Participe do desafio de cordel e ganhe +50 XP!",
      icon: BookOpen,
      color: "from-primary to-secondary",
    },
    {
      title: "Artista em Destaque",
      description: "Conheça os talentos nordestinos da semana",
      icon: Star,
      color: "from-secondary to-accent",
    },
    {
      title: "Desafio Cultural",
      description: "Compartilhe sua tradição favorita",
      icon: Trophy,
      color: "from-accent to-primary",
    },
  ];

  const categories = [
    { id: "musica", label: "Música e Forró", icon: Music, color: "text-primary", count: "1.2k" },
    { id: "culinaria", label: "Culinária", icon: Flame, color: "text-secondary", count: "890" },
    { id: "cordel", label: "Cordel e Cultura", icon: BookOpen, color: "text-accent", count: "650" },
    { id: "humor", label: "Humor", icon: Laugh, color: "text-massa", count: "2.1k" },
  ];

  const topUsers = [
    { name: "Top Cordelista", user: "João Poeta", badge: "🏆" },
    { name: "Melhor Causo", user: "Maria Contadora", badge: "⭐" },
    { name: "Artista Revelação", user: "Pedro Cantador", badge: "🎭" },
  ];

  if (!user || !currentUserProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6 max-w-[1600px] mx-auto">
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
          <main className="flex-1 max-w-3xl mx-auto lg:mx-0 w-full space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent p-8 text-white shadow-glow">
              <div className="relative z-10">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                  <Sparkles className="h-8 w-8" />
                  Explore o Nordeste Digital
                </h1>
                <p className="text-lg opacity-90">
                  Descubra pessoas, cultura e eventos arretados!
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 opacity-20">
                <div className="text-[200px]">🌵</div>
              </div>
            </div>

            {/* Banners Rotativos */}
            <div className="grid md:grid-cols-3 gap-4">
              {banners.map((banner, index) => (
                <Card
                  key={index}
                  className="group hover-lift cursor-pointer overflow-hidden"
                >
                  <div className={`h-2 bg-gradient-to-r ${banner.color}`} />
                  <CardContent className="p-4">
                    <banner.icon className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-bold text-lg mb-1">{banner.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {banner.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search Bar */}
            <Card className="rounded-2xl shadow-card">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pessoas, comunidades, eventos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs defaultValue="pessoas" className="w-full">
              <TabsList className="w-full justify-start bg-card rounded-2xl p-1">
                <TabsTrigger value="pessoas">👥 Pessoas</TabsTrigger>
                <TabsTrigger value="vilarejos">🏘️ Vilarejos</TabsTrigger>
                <TabsTrigger value="feira">🛍️ Feira</TabsTrigger>
                <TabsTrigger value="eventos">🎭 Eventos</TabsTrigger>
              </TabsList>

              {/* Pessoas Tab */}
              <TabsContent value="pessoas" className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Gente da Terra</h2>
                  <Badge variant="secondary">
                    +10 XP por seguir alguém novo
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {suggestedProfiles.map((profile) => (
                    <Card key={profile.id} className="hover-lift">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            {profile.avatar_url ? (
                              <AvatarImage src={profile.avatar_url} />
                            ) : (
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                                {profile.display_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate">
                              {profile.display_name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              @{profile.username}
                            </p>
                            {profile.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {profile.location}
                              </div>
                            )}
                            {profile.bio && (
                              <p className="text-sm mt-2 line-clamp-2">
                                {profile.bio}
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleFollow(profile.id)}
                          >
                            Seguir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Vilarejos Tab */}
              <TabsContent value="vilarejos" className="space-y-4 mt-6">
                <h2 className="text-2xl font-bold mb-4">
                  Comunidades e Vilarejos
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <Card key={cat.id} className="hover-lift cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <cat.icon className={`h-6 w-6 ${cat.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold">{cat.label}</h3>
                            <p className="text-sm text-muted-foreground">
                              {cat.count} membros
                            </p>
                          </div>
                        </div>
                        <Button className="w-full" variant="outline">
                          Entrar na Vila (+10 XP)
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Feira Tab */}
              <TabsContent value="feira" className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Feira Nordestina</h2>
                  <Badge variant="secondary" className="bg-gradient-to-r from-arretado/20 to-arretado/10">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    Produtos Locais
                  </Badge>
                </div>

                <Card className="p-16 text-center">
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-xl font-bold mb-2">
                    Feira em Breve!
                  </h3>
                  <p className="text-muted-foreground">
                    Logo você poderá explorar produtos artesanais e comidas típicas
                  </p>
                </Card>
              </TabsContent>

              {/* Eventos Tab */}
              <TabsContent value="eventos" className="space-y-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Eventos Culturais</h2>
                  <Badge variant="secondary">
                    +20 XP por participar
                  </Badge>
                </div>

                <Card className="p-16 text-center">
                  <div className="text-6xl mb-4">🎪</div>
                  <h3 className="text-xl font-bold mb-2">
                    Eventos em Breve!
                  </h3>
                  <p className="text-muted-foreground">
                    Aguarde festivais, feiras e encontros culturais
                  </p>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Destaques da Semana */}
            <Card className="rounded-2xl shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Destaques da Semana
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topUsers.map((top, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 hover-lift cursor-pointer"
                  >
                    <div className="text-3xl">{top.badge}</div>
                    <div className="flex-1">
                      <p className="font-semibold">{top.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {top.user}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Ver Perfil
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </main>

          {/* RIGHT SIDEBAR */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default Descobrir;
