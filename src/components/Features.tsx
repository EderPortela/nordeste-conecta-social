import { Heart, MessageCircle, Users, Store, Hash, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Conexões Autênticas",
    description: "Conecte-se com pessoas que compartilham seus interesses e paixões."
  },
  {
    icon: Hash,
    title: "Tendências Regionais",
    description: "Acompanhe os assuntos do momento e descubra novas hashtags todos os dias."
  },
  {
    icon: Store,
    title: "Marketplace",
    description: "Um espaço para criadores e empreendedores divulgarem seus produtos."
  },
  {
    icon: Heart,
    title: "Conteúdo Vivo",
    description: "Compartilhe fotos, vídeos, reels e momentos com sua comunidade."
  },
  {
    icon: MessageCircle,
    title: "Mensagens Diretas",
    description: "Converse em tempo real com amigos em chats privados e em grupo."
  },
  {
    icon: Sparkles,
    title: "Destaque para Criadores",
    description: "Ferramentas para valorizar quem produz conteúdo de qualidade."
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16" id="funcionalidades">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Por que a PortellaLens?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma rede social pensada para conexões reais.
            Aqui você encontra sua comunidade, sua voz e seu espaço.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 bg-card"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Bottom */}
        <div className="mt-16 text-center">
          <p className="text-2xl font-medium text-foreground mb-2">
            Bom demais, né?
          </p>
          <p className="text-muted-foreground">
            Junte-se à comunidade que cresce a cada dia.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
