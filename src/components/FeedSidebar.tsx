import { Button } from "@/components/ui/button";
import { Music, Soup, Scroll, Scissors, Laugh, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedSidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  { id: "all", label: "Tudo", icon: MapPin },
  { id: "musica", label: "Música", icon: Music },
  { id: "culinaria", label: "Culinária", icon: Soup },
  { id: "cordel", label: "Cordel & Poesia", icon: Scroll },
  { id: "artesanato", label: "Artesanato", icon: Scissors },
  { id: "humor", label: "Humor", icon: Laugh },
];

const FeedSidebar = ({ activeFilter, onFilterChange }: FeedSidebarProps) => {
  return (
    <aside className="hidden lg:block w-64 sticky top-20 h-fit">
      <div className="bg-card rounded-2xl shadow-card p-4 border border-border">
        <h2 className="font-bold text-lg mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Feed Cultural
        </h2>
        <nav className="space-y-1">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all hover-lift",
                activeFilter === filter.id && "shadow-soft"
              )}
              onClick={() => onFilterChange(filter.id)}
            >
              <filter.icon className="mr-3 h-4 w-4" />
              {filter.label}
            </Button>
          ))}
        </nav>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">
            Empreendedores
          </h3>
          <Button variant="outline" className="w-full" size="sm">
            <MapPin className="mr-2 h-4 w-4" />
            Feira Nordestina
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default FeedSidebar;
