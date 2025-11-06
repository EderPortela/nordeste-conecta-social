import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Award } from "lucide-react";

interface UserXP {
  total_xp: number;
  level: number;
}

interface UserBadge {
  badge_type: string;
  earned_at: string;
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

interface GamificationBadgeProps {
  userId: string;
}

const GamificationBadge = ({ userId }: GamificationBadgeProps) => {
  const [xpData, setXpData] = useState<UserXP | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    loadGamificationData();
  }, [userId]);

  const loadGamificationData = async () => {
    try {
      // Load XP data
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (xpData) {
        setXpData(xpData);
      }

      // Load badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", userId);

      if (badgesData) {
        setBadges(badgesData);
      }
    } catch (error) {
      console.error("Error loading gamification data:", error);
    }
  };

  const currentLevelXP = xpData ? xpData.total_xp % 100 : 0;
  const progressToNextLevel = (currentLevelXP / 100) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {xpData && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-bold">Nível {xpData.level}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentLevelXP} / 100 XP
              </span>
            </div>
            <Progress value={progressToNextLevel} />
            <p className="text-xs text-muted-foreground mt-1">
              Total: {xpData.total_xp} XP
            </p>
          </div>
        )}

        {badges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Badges Conquistados
            </h4>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge
                  key={badge.badge_type}
                  variant="secondary"
                  className="flex items-center gap-1"
                  title={badgeNames[badge.badge_type]}
                >
                  <span>{badgeIcons[badge.badge_type]}</span>
                  <span className="text-xs">{badgeNames[badge.badge_type]}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!xpData && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Comece a interagir para ganhar XP e badges!
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default GamificationBadge;
