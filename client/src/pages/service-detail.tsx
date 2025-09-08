import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import AIChat from "@/components/ai-chat";
import type { Service } from "@shared/schema";

export default function ServiceDetail() {
  const { id } = useParams();
  
  const { data: service, isLoading, error } = useQuery({
    queryKey: ["/api/services", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-12 bg-muted rounded mb-8"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
              <div className="h-80 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Xizmat topilmadi</h1>
          <p className="text-muted-foreground mb-8">Kechirasiz, bu xizmat mavjud emas yoki o'chirilgan.</p>
          <Link href="/services">
            <Button>Xizmatlarga qaytish</Button>
          </Link>
        </div>
      </div>
    );
  }

  const typedService = service as Service;

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-8" data-testid="breadcrumb">
          <Link href="/services" className="hover:text-primary">Xizmatlar</Link>
          <span className="mx-2">/</span>
          <span>{typedService.title}</span>
        </nav>

        {/* Service Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="service-title">
            {typedService.title}
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="service-description">
            {typedService.description}
          </p>
        </div>

        {/* Service Image */}
        {typedService.imageUrl && (
          <div className="mb-8">
            <img 
              src={typedService.imageUrl} 
              alt={typedService.title}
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Service Details */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Xizmat haqida</h2>
            
            {/* Pricing and Duration */}
            <div className="bg-card p-6 rounded-xl border border-border mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-muted-foreground mb-2">Narx</h3>
                  <p className="text-xl font-bold text-primary" data-testid="service-price">
                    {typedService.priceRange}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-muted-foreground mb-2">Muddat</h3>
                  <p className="text-xl font-bold text-accent" data-testid="service-duration">
                    {typedService.duration}
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            {typedService.features && Array.isArray(typedService.features) && typedService.features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Nimalar kiradi</h3>
                <div className="space-y-3">
                  {(typedService.features as string[]).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <i className="fas fa-check text-accent"></i>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <Link href="/order" state={{ serviceId: typedService.id, serviceTitle: typedService.title }}>
              <Button 
                className="w-full bg-primary text-primary-foreground py-3 text-lg font-semibold hover:bg-primary/90"
                data-testid="order-service-button"
              >
                <i className="fas fa-shopping-cart mr-2"></i>
                Buyurtma berish
              </Button>
            </Link>
          </div>

          {/* AI Assistant Chat */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">AI Yordamchi</h2>
            <AIChat serviceId={typedService.id} serviceTitle={typedService.title} />
          </div>
        </div>

        {/* Related Services */}
        <div className="mt-16 pt-16 border-t border-border">
          <h2 className="text-2xl font-semibold mb-8">Boshqa xizmatlar</h2>
          <div className="text-center">
            <Link href="/services">
              <Button variant="outline" data-testid="view-all-services">
                Barcha xizmatlarni ko'rish
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
