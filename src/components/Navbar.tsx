import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import logoImg from "@/assets/logo-portellalens.png";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img src={logoImg} alt="PortellaLens" className="h-8 w-auto" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#sobre" className="text-foreground hover:text-primary transition-colors">
              Sobre
            </a>
            <a href="#funcionalidades" className="text-foreground hover:text-primary transition-colors">
              Funcionalidades
            </a>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
              Entrar
            </Button>
            <Button size="sm" onClick={() => window.location.href = '/auth'}>
              Cadastrar
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
