import { useQuery } from "@tanstack/react-query";
import ServiceCard from "@/components/service-card";
import type { Service } from "@shared/schema";

export default function Services() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Bizning xizmatlar
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI teknologiyalari va professional tajriba bilan biznesingizni yangi darajaga ko'taramiz. 
            Har bir xizmat sizning ehtiyojlaringizga moslashtiriladi.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                <div className="w-full h-32 bg-muted rounded-lg mb-4"></div>
                <div className="w-12 h-12 bg-muted rounded-lg mb-4"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(services as Service[]).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {/* Process Section */}
        <div className="mt-20 pt-20 border-t border-border">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Qanday ishlaydi?</h2>
            <p className="text-lg text-muted-foreground">
              Oddiy 4 bosqichda loyihangizni amalga oshiring
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Xizmat tanlang</h3>
              <p className="text-muted-foreground">Sizga kerakli xizmatni tanlang va AI yordamchisi bilan gaplashing</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-secondary">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Buyurtma bering</h3>
              <p className="text-muted-foreground">Loyiha tafsilotlarini to'ldiring va buyurtma bering</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-accent">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ishlab chiqamiz</h3>
              <p className="text-muted-foreground">Mutaxassislar jamoasi loyihangizni professional darajada amalga oshiradi</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-500">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Topshiramiz</h3>
              <p className="text-muted-foreground">Tayyor mahsulotni topshiramiz va texnik yordam beramiz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
