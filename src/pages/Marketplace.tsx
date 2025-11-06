import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  location: string;
  seller_username: string;
  seller_display_name: string;
  seller_avatar_url: string;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartCount, setCartCount] = useState(0);

  const categories = [
    "all",
    "artesanato",
    "alimentacao",
    "moda",
    "decoracao",
    "musica",
    "literatura"
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);
      loadProducts();
      loadCartCount(session.user.id);
    });
  }, [navigate]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products_with_seller")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error loading products:", error);
    }
  };

  const loadCartCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity", { count: "exact" })
        .eq("user_id", userId);

      if (error) throw error;
      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(total);
    } catch (error: any) {
      console.error("Error loading cart:", error);
    }
  };

  const addToCart = async (productId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .upsert({
          user_id: currentUser.id,
          product_id: productId,
          quantity: 1
        }, {
          onConflict: "user_id,product_id"
        });

      if (error) throw error;

      toast({
        title: "Produto adicionado ao carrinho!",
        description: "Continue comprando ou finalize seu pedido.",
      });

      loadCartCount(currentUser.id);
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar ao carrinho",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <LeftSidebar />
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Feira Nordestina</h1>
                <Button variant="outline" onClick={() => navigate("/carrinho")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Carrinho ({cartCount})
                </Button>
              </div>

              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === "all" ? "Todos" : cat}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="overflow-hidden">
                    {product.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{product.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {product.location}
                          </CardDescription>
                        </div>
                        <Badge>{product.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            R$ {product.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estoque: {product.stock}
                          </p>
                        </div>
                        <p className="text-sm">
                          por <span className="font-semibold">{product.seller_display_name}</span>
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => addToCart(product.id)}
                        className="w-full"
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? "Esgotado" : "Adicionar ao Carrinho"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
