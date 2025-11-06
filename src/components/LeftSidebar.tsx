import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Search, 
  MessageCircle, 
  User, 
  Settings, 
  Music, 
  Soup, 
  Scroll, 
  Laugh, 
  Scissors,
  MapPin,
  Plus,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeftSidebarProps {
  profile?: {
    username: string;
    display_name: string;
    location?: string;
  };
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  onNewPost?: () => void;
}

const menuItems = [
  { id: "home", label: "Início", icon: Home, route: "/feed" },
  { id: "discover", label: "Descobrir", icon: Search, route: "/descobrir" },
  { id: "marketplace", label: "Feira Nordestina", icon: Soup, route: "/marketplace" },
  { id: "communities", label: "Vilarejos", icon: MapPin, route: "/comunidades" },
  { id: "messages", label: "Mensagens", icon: MessageCircle, route: "/mensagens" },
  { id: "profile", label: "Perfil", icon: User, route: "/perfil" },
  { id: "settings", label: "Configurações", icon: Settings, route: "/configuracoes" },
];

const categories = [
  { id: "musica", label: "Música e Forró", icon: Music, color: "text-primary" },
  { id: "culinaria", label: "Culinária Nordestina", icon: Soup, color: "text-secondary" },
  { id: "cordel", label: "Cordel e Cultura", icon: Scroll, color: "text-accent" },
  { id: "humor", label: "Humor e Memes", icon: Laugh, color: "text-massa" },
  { id: "artesanato", label: "Artesanato", icon: Scissors, color: "text-cabra-bom" },
];

const trending = [
  { tag: "CuscuzComOvo", count: "2.3k" },
  { tag: "Forró2025", count: "1.8k" },
  { tag: "ArraiáDigital", count: "1.2k" },
  { tag: "VozesDoSertão", count: "890" },
];

const LeftSidebar = ({ profile, activeRoute = "/feed", onNavigate, onNewPost }: LeftSidebarProps) => {
  return (
    <aside className="hidden lg:block w-72 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto pr-4">
      <div className="space-y-4">
        {/* Logo */}
        <div className="px-4 pt-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Portella 🌵
          </h1>
        </div>

        {/* Menu Principal */}
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeRoute === item.route ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-base h-12 hover-lift",
                activeRoute === item.route && "shadow-soft"
              )}
              onClick={() => onNavigate?.(item.route)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </nav>

        <Separator />

        {/* Perfil Rápido */}
        {profile && (
          <div className="bg-card rounded-2xl shadow-card p-4 border border-border mx-2">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold">
                  {profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{profile.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
              </div>
            </div>
            
            {profile.location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <MapPin className="h-3 w-3" />
                <span>{profile.location}</span>
              </div>
            )}

            <Badge variant="secondary" className="w-full justify-center bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20">
              Cabra Arretado
            </Badge>

            <Button 
              className="w-full mt-3 shadow-soft hover:shadow-hover transition-all"
              onClick={onNewPost}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Post
            </Button>
          </div>
        )}

        <Separator />

        {/* Categorias */}
        <div className="px-2">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 px-2">
            Categorias
          </h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="ghost"
                className="w-full justify-start hover-lift"
                size="sm"
              >
                <cat.icon className={cn("mr-3 h-4 w-4", cat.color)} />
                <span className="text-sm">{cat.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tendências */}
        <div className="px-2 pb-4">
          <div className="flex items-center gap-2 mb-3 px-2">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <h3 className="font-semibold text-sm text-muted-foreground">
              Tendências do Dia
            </h3>
          </div>
          <div className="space-y-2">
            {trending.map((trend) => (
              <button
                key={trend.tag}
                className="w-full text-left p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <p className="font-semibold text-sm text-primary">#{trend.tag}</p>
                <p className="text-xs text-muted-foreground">{trend.count} posts</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
