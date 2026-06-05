import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  UserPlus, 
  Calendar, 
  ShoppingBag, 
  Music, 
  MapPin,
  Newspaper,
  ExternalLink,
  Play
} from "lucide-react";

const suggestedProfiles = [
  { name: "Maria Silva", username: "mariasilva", bio: "Designer e ilustradora", location: "São Paulo, SP" },
  { name: "João Pereira", username: "joaopereira", bio: "Músico independente", location: "Rio de Janeiro, RJ" },
  { name: "Ana Costa", username: "anacosta", bio: "Fotógrafa e viajante", location: "Curitiba, PR" },
];

const culturalEvents = [
  { title: "Festival de Música", location: "São Paulo, SP", date: "10-15 Jul" },
  { title: "Feira de Design", location: "Belo Horizonte, MG", date: "Este fim de semana" },
  { title: "Meetup de Fotografia", location: "Online", date: "Amanhã" },
];

const feiraProducts = [
  { name: "Caderno Artesanal", seller: "Atelier Lume", price: "R$ 89,90" },
  { name: "Café Especial 250g", seller: "Torra Local", price: "R$ 32,50" },
  { name: "Print Fotográfico A3", seller: "Estúdio Norte", price: "R$ 45,00" },
];

const news = [
  { title: "Nova exposição de arte contemporânea", location: "São Paulo, SP" },
  { title: "Festival de cinema independente em agosto", location: "Rio de Janeiro, RJ" },
  { title: "Inscrições abertas para mostra de design", location: "Online" },
];

const RightSidebar = () => {
  return (
    <aside className="hidden xl:block w-80 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto pl-4">
      <div className="space-y-4">
        {/* Sugestões para Seguir */}
        <div className="bg-card rounded-2xl shadow-card p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Sugestões para você</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Pessoas que você pode gostar de seguir
          </p>
          <div className="space-y-3">
            {suggestedProfiles.map((user) => (
              <div key={user.username} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xs font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{user.location}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7">
                  Seguir
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Eventos em Destaque */}
        <div className="bg-card rounded-2xl shadow-card p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-secondary" />
            <h3 className="font-bold text-base">Eventos em Destaque</h3>
          </div>
          <div className="space-y-3">
            {culturalEvents.map((event, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                <p className="font-semibold text-sm text-foreground mb-1">{event.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{event.location}</span>
                </div>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {event.date}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Marketplace */}
        <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl shadow-card p-4 border border-accent/20">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-base">Marketplace</h3>
          </div>
          <div className="space-y-3 mb-4">
            {feiraProducts.map((product, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.seller}</p>
                </div>
                <p className="font-bold text-sm text-accent">{product.price}</p>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full" size="sm">
            <ExternalLink className="mr-2 h-3 w-3" />
            Ver Marketplace
          </Button>
        </div>

        {/* Música em Alta */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl shadow-card p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Music className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Música em Alta</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            As playlists mais ouvidas da semana
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
              <div className="h-8 w-8 bg-primary/20 rounded flex items-center justify-center">
                <Play className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold">Playlist em Destaque</p>
                <p className="text-xs text-muted-foreground">42 músicas</p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full" size="sm">
            Ver Playlists
          </Button>
        </div>

        {/* Notícias */}
        <div className="bg-card rounded-2xl shadow-card p-4 border border-border pb-4">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-5 w-5 text-secondary" />
            <h3 className="font-bold text-base">Notícias</h3>
          </div>
          <div className="space-y-3">
            {news.map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <p className="text-sm font-medium mb-1">{item.title}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{item.location}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
