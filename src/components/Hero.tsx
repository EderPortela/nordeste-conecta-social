import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-nordeste.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background com gradiente */}
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-95" />
      
      {/* Imagem de fundo */}
      <div 
        className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Padrão xilogravura sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, hsl(var(--foreground)) 35px, hsl(var(--foreground)) 37px)`
        }} />
      </div>

      {/* Conteúdo */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Nome */}
          <div className="mb-6 animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight">
              Portella
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-white to-transparent rounded-full" />
          </div>

          {/* Slogan */}
          <p className="text-2xl md:text-3xl text-white/95 font-medium mb-8 animate-fade-in-delay-1">
            O Nordeste se conecta aqui.
          </p>

          {/* Descrição */}
          <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto mb-12 animate-fade-in-delay-2">
            A rede social autenticamente nordestina. Cultura, arte, música e conexões 
            que celebram nossa identidade. Vem ser parte dessa história, visse?
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
            <Button 
              size="lg" 
              variant="hero"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.href = '/auth'}
            >
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="hero-outline"
              className="text-lg px-8 py-6"
              onClick={() => document.querySelector('#funcionalidades')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Conhecer a Portella
            </Button>
          </div>

          {/* Badge */}
          <div className="mt-12 animate-fade-in-delay-4">
            <p className="text-white/70 text-sm">
              🌵 Feito com orgulho nordestino
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
