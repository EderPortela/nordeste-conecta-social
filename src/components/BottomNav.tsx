import { Home, Search, Film, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
  onNewPost?: () => void;
  hasNotifications?: boolean;
}

const BottomNav = ({ activeRoute, onNavigate, onNewPost, hasNotifications }: BottomNavProps) => {
  const items = [
    { id: "home", icon: Home, route: "/feed", label: "Início" },
    { id: "discover", icon: Search, route: "/descobrir", label: "Explorar" },
    { id: "reels", icon: Film, route: "/reels", label: "Reels" },
    { id: "notifications", icon: Heart, route: "/notificacoes", label: "Atividade" },
    { id: "profile", icon: User, route: "/perfil", label: "Perfil" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const isActive = item.route && activeRoute === item.route;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.route)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full relative transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn("h-6 w-6", isActive && "fill-current")}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              {item.id === "notifications" && hasNotifications && (
                <span className="absolute top-1 right-1/2 translate-x-3 h-2 w-2 bg-secondary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
