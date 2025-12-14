import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import LeftSidebar from "@/components/LeftSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Award, Lock, CheckCircle2, Flame, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface UserXP {
  total_xp: number;
  level: number;
}

interface UserBadge {
  badge_type: string;
  earned_at: string;
}

interface Achievement {
  id: string;
  badge_type: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
}

const badgeIcons: Record<string, string> = {
  cordel_iniciante: "📜",
  cordel_mestre: "🎭",
  explorador_sertao: "🌵",
  feirante_arretado: "🛍️",
  viajante_cultural: "✈️",
  contador_causos: "📖",
  influencer_nordestino: "⭐",
  guardiao_tradicoes: "🏛️"
};

const badgeNames: Record<string, string> = {
  cordel_iniciante: "Cordel Iniciante",
  cordel_mestre: "Cordel Mestre",
  explorador_sertao: "Explorador do Sertão",
  feirante_arretado: "Feirante Arretado",
  viajante_cultural: "Viajante Cultural",
  contador_causos: "Contador de Causos",
  influencer_nordestino: "Influencer Nordestino",
  guardiao_tradicoes: "Guardião das Tradições"
};

const badgeDescriptions: Record<string, string> = {
  cordel_iniciante: "Publique seu primeiro post com temática nordestina",
  cordel_mestre: "Publique 50 posts de literatura de cordel",
  explorador_sertao: "Visite 10 perfis de usuários diferentes",
  feirante_arretado: "Cadastre seu primeiro produto na Feira Nordestina",
  viajante_cultural: "Participe de 5 comunidades diferentes",
  contador_causos: "Receba 100 curtidas em seus posts",
  influencer_nordestino: "Alcance 500 seguidores",
  guardiao_tradicoes: "Complete todas as conquistas básicas"
};

const Conquistas = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [xpData, setXpData] = useState<UserXP | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await Promise.all([
      loadProfile(session.user.id),
      loadGamificationData(session.user.id),
      loadAchievements()
    ]);
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const loadGamificationData = async (userId: string) => {
    try {
      const { data: xp } = await supabase
        .from("user_xp")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (xp) setXpData(xp);

      const { data: badges } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", userId);
      if (badges) setEarnedBadges(badges);
    } catch (error) {
      console.error("Error loading gamification data:", error);
    }
  };

  const loadAchievements = async () => {
    try {
      const { data } = await supabase
        .from("achievements")
        .select("*");
      if (data) setAchievements(data);
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  };

  const currentLevelXP = xpData ? xpData.total_xp % 100 : 0;
  const progressToNextLevel = (currentLevelXP / 100) * 100;
  const xpToNextLevel = 100 - currentLevelXP;

  const isEarned = (badgeType: string) => {
    return earnedBadges.some(b => b.badge_type === badgeType);
  };

  const allBadgeTypes = Object.keys(badgeNames);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex gap-6">
          <LeftSidebar
            profile={profile}
            activeRoute="/conquistas"
            onNavigate={(route) => navigate(route)}
            onNewPost={() => navigate("/feed")}
          />

          <main className="flex-1 max-w-4xl space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-8 w-8 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Conquistas</h1>
                </div>
                <p className="text-muted-foreground">
                  Acompanhe seu progresso e desbloqueie badges explorando a cultura nordestina!
                </p>
              </div>
            </div>

            {/* XP and Level Card */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Seu Progresso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Level */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary">
                        <span className="text-4xl font-bold text-primary">
                          {xpData?.level || 1}
                        </span>
                      </div>
                      <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500" />
                    </div>
                    <span className="mt-3 text-sm font-medium text-muted-foreground">Nível</span>
                  </div>

                  {/* XP Progress */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span className="font-semibold">XP Total</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {xpData?.total_xp || 0}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso para o próximo nível</span>
                        <span className="font-medium">{currentLevelXP}/100 XP</span>
                      </div>
                      <Progress value={progressToNextLevel} className="h-3" />
                      <p className="text-xs text-muted-foreground text-center">
                        Faltam <span className="font-semibold text-primary">{xpToNextLevel} XP</span> para o nível {(xpData?.level || 1) + 1}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Award className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-lg font-bold">{earnedBadges.length}</p>
                          <p className="text-xs text-muted-foreground">Badges Conquistados</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Target className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-lg font-bold">{allBadgeTypes.length - earnedBadges.length}</p>
                          <p className="text-xs text-muted-foreground">Faltam Desbloquear</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
              <Card className="border-green-500/20 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Badges Conquistados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.badge_type}
                        className="relative p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-4xl">{badgeIcons[badge.badge_type]}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {badgeNames[badge.badge_type]}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {badgeDescriptions[badge.badge_type]}
                            </p>
                            <Badge variant="secondary" className="mt-2 text-xs bg-green-500/20 text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Conquistado
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Badges */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Todas as Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allBadgeTypes.map((badgeType) => {
                    const earned = isEarned(badgeType);
                    return (
                      <div
                        key={badgeType}
                        className={`relative p-4 rounded-xl border transition-all ${
                          earned
                            ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
                            : "bg-muted/30 border-border opacity-60 hover:opacity-80"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`text-4xl ${!earned && "grayscale"}`}>
                            {badgeIcons[badgeType]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {badgeNames[badgeType]}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {badgeDescriptions[badgeType]}
                            </p>
                            {earned ? (
                              <Badge variant="secondary" className="mt-2 text-xs bg-primary/20 text-primary">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Desbloqueado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="mt-2 text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!earned && (
                          <div className="absolute inset-0 bg-background/20 rounded-xl" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* How to Earn XP */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Como Ganhar XP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { action: "Criar um post", xp: "+10 XP", icon: "📝" },
                    { action: "Receber curtida", xp: "+2 XP", icon: "❤️" },
                    { action: "Comentar", xp: "+5 XP", icon: "💬" },
                    { action: "Seguir alguém", xp: "+3 XP", icon: "👥" },
                    { action: "Entrar em comunidade", xp: "+15 XP", icon: "🏘️" },
                    { action: "Vender produto", xp: "+25 XP", icon: "🛍️" },
                    { action: "Publicar story", xp: "+5 XP", icon: "📸" },
                    { action: "Perfil completo", xp: "+50 XP", icon: "✅" },
                  ].map((item) => (
                    <div
                      key={item.action}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{item.action}</p>
                        <p className="text-xs text-primary font-semibold">{item.xp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Conquistas;
