import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import ServiceCard from "@/components/service-card";
import type { Service, BlogPost, Portfolio } from "@shared/schema";

export default function Home() {
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: blogPosts = [], isLoading: blogLoading } = useQuery({
    queryKey: ["/api/blog?limit=3"],
  });

  const { data: featuredPortfolio = [], isLoading: portfolioLoading } = useQuery({
    queryKey: ["/api/portfolio/featured"],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="home" className="py-20 bg-gradient-to-br from-background via-muted to-background">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            AI Asosidagi
            <span className="gradient-bg bg-clip-text text-transparent"> Biznes Yechimlari</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Biznesingizni rivojlantirish uchun zamonaviy AI teknologiyalari yordamida professional veb-saytlar, 
            Telegram botlar va avtomatlashtirish tizimlari yaratamiz.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/services">
              <button 
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                data-testid="hero-services-button"
              >
                <i className="fas fa-rocket mr-2"></i>
                Xizmatlarni ko'rish
              </button>
            </Link>
            <a 
              href="https://t.me/evolvobot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="border border-border text-foreground px-8 py-4 rounded-lg font-semibold hover:bg-muted transition-colors inline-block"
              data-testid="hero-telegram-button"
            >
              <i className="fab fa-telegram mr-2"></i>
              Telegram'da bog'lanish
            </a>
          </div>
          
          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-projects">100+</div>
              <div className="text-muted-foreground">Bajarilgan loyihalar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2" data-testid="stat-support">24/7</div>
              <div className="text-muted-foreground">AI yordam</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2" data-testid="stat-duration">7 kun</div>
              <div className="text-muted-foreground">O'rtacha muddat</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2" data-testid="stat-satisfaction">99%</div>
              <div className="text-muted-foreground">Mijoz mamnuniyati</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Bizning xizmatlar</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI teknologiyalari va professional tajriba bilan biznesingizni yangi darajaga ko'taramiz
            </p>
          </div>
          
          {servicesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-background border border-border rounded-xl p-6 animate-pulse">
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
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Bizning portfoliomiz</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Biz yaratgan professional loyihalar va mijozlar uchun muvaffaqiyatli ishlanmalar
            </p>
          </div>
          
          {portfolioLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-muted"></div>
                  <div className="p-6">
                    <div className="h-4 bg-muted rounded mb-3"></div>
                    <div className="h-6 bg-muted rounded mb-3"></div>
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredPortfolio.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(featuredPortfolio as Portfolio[]).map((item) => (
                <article key={item.id} className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-primary font-medium">{item.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.completedAt).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {Array.isArray(item.technologies) && item.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.technologies.slice(0, 3).map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                            {tech}
                          </span>
                        ))}
                        {item.technologies.length > 3 && (
                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                            +{item.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {item.clientName && (
                        <span className="text-sm text-muted-foreground">
                          {item.clientName}
                        </span>
                      )}
                      {item.projectUrl && (
                        <a 
                          href={item.projectUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
                        >
                          Ko'rish
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Tez orada portfoliomiz bilan tanishasiz</p>
            </div>
          )}
          
          {featuredPortfolio.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/portfolio">
                <button 
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  data-testid="all-portfolio-button"
                >
                  Barcha loyihalar
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Yangiliklar va maqolalar</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI, texnologiya va biznes rivojlanishi haqida foydali ma'lumotlar
            </p>
          </div>
          
          {blogLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
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
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(blogPosts as BlogPost[]).map((post) => (
                <article key={post.id} className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  
                  <div className="p-6">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                      <span>{post.category}</span>
                      <span>•</span>
                      <span>{post.readTime} daqiqa o'qish</span>
                    </div>
                    
                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="text-xl font-semibold text-foreground mb-3 hover:text-primary transition-colors cursor-pointer">
                        {post.title}
                      </h3>
                    </Link>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt.length > 120 ? post.excerpt.substring(0, 120) + '...' : post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.publishedAt!).toLocaleDateString('uz-UZ')}
                      </span>
                      <Link href={`/blog/${post.slug}`} className="text-primary hover:text-primary/80 font-medium">
                        O'qish →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/blog">
              <button 
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                data-testid="all-blog-posts-button"
              >
                Barcha maqolalar
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Biz bilan bog'laning
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Loyihangiz haqida gaplashish yoki savollar berish uchun bizga murojaat qiling. 
            Biz har doim sizga yordam berishga tayyormiz!
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fab fa-telegram text-primary-foreground text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Telegram</h3>
              <p className="text-muted-foreground mb-4">Tezkor aloqa va maslahat</p>
              <a 
                href="https://t.me/evolvobot" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium"
              >
                @evolvobot
              </a>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope text-primary-foreground text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Email</h3>
              <p className="text-muted-foreground mb-4">Rasmiy murojaat uchun</p>
              <a 
                href="mailto:info@evolvo.uz"
                className="text-primary hover:text-primary/80 font-medium"
              >
                info@evolvo.uz
              </a>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-phone text-primary-foreground text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Telefon</h3>
              <p className="text-muted-foreground mb-4">To'g'ridan-to'g'ri aloqa</p>
              <a 
                href="tel:+998901234567"
                className="text-primary hover:text-primary/80 font-medium"
              >
                +998 90 123 45 67
              </a>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order">
              <button 
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                data-testid="contact-start-project"
              >
                <i className="fas fa-rocket mr-2"></i>
                Loyihani boshlash
              </button>
            </Link>
            <a 
              href="https://t.me/evolvobot" 
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border text-foreground px-8 py-4 rounded-lg font-semibold hover:bg-muted transition-colors inline-block"
              data-testid="contact-telegram-button"
            >
              <i className="fab fa-telegram mr-2"></i>
              Telegram'da yozing
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Loyihangizni boshlashga tayyormisiz?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Bizning mutaxassislar jamoasi sizning biznesingizni rivojlantirish uchun eng yaxshi yechimlarni taklif qiladi.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order">
              <button 
                className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                data-testid="cta-start-project"
              >
                <i className="fas fa-rocket mr-2"></i>
                Loyihani boshlash
              </button>
            </Link>
            <a 
              href="https://t.me/evolvobot" 
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors inline-block"
              data-testid="cta-telegram-contact"
            >
              <i className="fab fa-telegram mr-2"></i>
              Telegram'da bog'lanish
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
