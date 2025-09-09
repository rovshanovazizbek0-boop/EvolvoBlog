import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { Portfolio } from "@shared/schema";
import { Search, ExternalLink, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export default function PortfolioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: portfolioItems = [], isLoading } = useQuery({
    queryKey: ["/api/portfolio"],
  });

  // Filter items based on search and category
  const filteredItems = (portfolioItems as Portfolio[]).filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (Array.isArray(item.technologies) && item.technologies.some(tech => 
                           tech.toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set((portfolioItems as Portfolio[]).map(item => item.category)));

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Portfolio - Evolvo.uz | Bizning bajarilgan loyihalar</title>
        <meta 
          name="description" 
          content="Evolvo.uz tomonidan yaratilgan professional veb-saytlar, Telegram botlar va AI yechimlar portfoliosi. Bizning muvaffaqiyatli loyihalar va mijozlar bilan ishlash tajribasi." 
        />
        <meta name="keywords" content="portfolio, veb-sayt yaratish, telegram bot, AI chatbot, biznes avtomatlashtirish, O'zbekiston" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Portfolio - Evolvo.uz | Bizning bajarilgan loyihalar" />
        <meta property="og:description" content="Evolvo.uz tomonidan yaratilgan professional veb-saytlar, Telegram botlar va AI yechimlar portfoliosi." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://evolvo.uz/portfolio" />
        <meta property="og:image" content="https://evolvo.uz/og-portfolio.jpg" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Portfolio - Evolvo.uz" />
        <meta name="twitter:description" content="Bizning bajarilgan loyihalar va muvaffaqiyatli yechimlar" />
        <meta name="twitter:image" content="https://evolvo.uz/og-portfolio.jpg" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Evolvo.uz Portfolio",
            "description": "Professional veb-saytlar, Telegram botlar va AI yechimlar portfoliosi",
            "url": "https://evolvo.uz/portfolio",
            "numberOfItems": portfolioItems.length,
            "itemListElement": (portfolioItems as Portfolio[]).map((item, index) => ({
              "@type": "CreativeWork",
              "position": index + 1,
              "name": item.title,
              "description": item.description,
              "url": item.projectUrl,
              "image": item.imageUrl,
              "creator": {
                "@type": "Organization",
                "name": "Evolvo.uz"
              },
              "dateCreated": item.completedAt,
              "genre": item.category
            }))
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Bizning <span className="gradient-bg bg-clip-text text-transparent">portfoliomiz</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Professional veb-saytlar, Telegram botlar va AI yechimlari bilan mijozlarimizga 
            muvaffaqiyatli xizmat ko'rsatgan loyihalarimiz bilan tanishing
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2" data-testid="portfolio-count">
                {portfolioItems.length}+
              </div>
              <div className="text-muted-foreground text-sm">Bajarilgan loyihalar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary mb-2">
                {categories.length}+
              </div>
              <div className="text-muted-foreground text-sm">Turli sohalar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-2">100%</div>
              <div className="text-muted-foreground text-sm">Mijoz mamnuniyati</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground text-sm">Qo'llab-quvvatlash</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Loyihalarni qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="portfolio-search"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                data-testid="category-all"
              >
                Barchasi
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(9)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-3"></div>
                    <div className="h-6 bg-muted rounded mb-3"></div>
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <Card key={item.id} className="group hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(item.completedAt)}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {item.description}
                    </p>
                    
                    {Array.isArray(item.technologies) && item.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {item.technologies.slice(0, 4).map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                            {tech}
                          </span>
                        ))}
                        {item.technologies.length > 4 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                            +{item.technologies.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {item.clientName && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="w-3 h-3 mr-1" />
                          {item.clientName}
                        </div>
                      )}
                      {item.projectUrl && (
                        <a 
                          href={item.projectUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                          data-testid={`portfolio-view-${item.id}`}
                        >
                          Ko'rish
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Hech narsa topilmadi
              </h3>
              <p className="text-muted-foreground mb-6">
                Qidiruv shartlaringizni o'zgartiring yoki boshqa kategoriyani tanlang
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                data-testid="clear-filters"
              >
                Filtrlarni tozalash
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Sizning loyihangiz ham shu yerda bo'lishi mumkin!
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Bizning tajribali jamoamiz sizning g'oyalaringizni professional loyihaga aylantiradi. 
            Bugun boshlaylik!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
              data-testid="portfolio-cta-order"
            >
              <a href="/order">
                Loyihani boshlash
              </a>
            </Button>
            <Button 
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary"
              data-testid="portfolio-cta-contact"
            >
              <a href="https://t.me/evolvobot" target="_blank" rel="noopener noreferrer">
                Biz bilan bog'lanish
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}