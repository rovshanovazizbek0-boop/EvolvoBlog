import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { BlogPost } from "@shared/schema";
import { formatDate } from "@/lib/date-utils";

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ["/api/blog?limit=50"],
  });

  const categories = [
    "AI va Avtomatlashtirish",
    "Telegram Botlar", 
    "Veb Dasturlash",
    "Marketing Avtomatlashtirish",
    "Produktivlik",
    "AI Promptlar",
    "O'zbekiston Innovatsiyalar"
  ];

  const filteredPosts = (blogPosts as BlogPost[]).filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Blog va yangiliklar
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI teknologiyalari, dasturlash va biznes rivojlanishi haqida foydali maqolalar. 
            Har kuni yangi ma'lumotlar va amaliy maslahatlar.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Maqolalarni qidiring..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="blog-search-input"
            />
          </div>
          <div className="md:w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="blog-category-filter">
                <SelectValue placeholder="Kategoriya tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6">
                  <div className="h-4 bg-muted rounded mb-3"></div>
                  <div className="h-6 bg-muted rounded mb-3"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-search text-3xl text-muted-foreground"></i>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Hech narsa topilmadi</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || (selectedCategory !== "all") 
                ? "Qidiruv yoki filtr bo'yicha maqolalar topilmadi. Boshqa so'z bilan qidiring."
                : "Hozircha blog maqolalari mavjud emas."
              }
            </p>
            {(searchTerm || (selectedCategory !== "all")) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                }}
                className="text-primary hover:text-primary/80 font-medium"
                data-testid="clear-filters-button"
              >
                Filtrlarni tozalash
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {filteredPosts.map((post) => (
                <article key={post.id} className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <Link href={`/blog/${post.slug}`}>
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  
                  <div className="p-6">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span>•</span>
                      <span>{post.readTime} daqiqa o'qish</span>
                    </div>
                    
                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="text-xl font-semibold text-foreground mb-3 hover:text-primary transition-colors cursor-pointer line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt.length > 150 ? post.excerpt.substring(0, 150) + '...' : post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {post.publishedAt ? formatDate(post.publishedAt) : 'Bugun'}
                      </span>
                      <Link 
                        href={`/blog/${post.slug}`} 
                        className="text-primary hover:text-primary/80 font-medium"
                        data-testid={`read-post-${post.slug}`}
                      >
                        O'qish →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More Section */}
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {filteredPosts.length} ta maqola ko'rsatilmoqda
              </p>
              <Link href="https://t.me/evolvoaiuz_bot" target="_blank" rel="noopener noreferrer">
                <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  <i className="fab fa-telegram mr-2"></i>
                  Yangiliklar uchun obuna bo'ling
                </button>
              </Link>
            </div>
          </>
        )}

        {/* Newsletter CTA */}
        <div className="mt-16 bg-gradient-to-r from-primary to-secondary rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Yangiliklar va maslahatlar</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Har kuni yangi AI texnologiyalari, dasturlash maslahatlar va biznes yechimlar haqida 
            birinchi bo'lib xabar oling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <a 
              href="https://t.me/evolvoaiuz_bot" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              data-testid="newsletter-telegram-link"
            >
              <i className="fab fa-telegram mr-2"></i>
              Telegram'da obuna bo'ling
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
