import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";
import DownloadPDFButton from "@/components/DownloadPDFButton";
import type { BlogPost } from "@shared/schema";

export default function BlogPostPage() {
  const { slug } = useParams();
  
  const { data: post, isLoading, error } = useQuery({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ["/api/blog?limit=3"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-12 bg-muted rounded mb-8"></div>
            <div className="h-64 bg-muted rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-exclamation-triangle text-3xl text-muted-foreground"></i>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Maqola topilmadi</h1>
          <p className="text-muted-foreground mb-8">Kechirasiz, bu maqola mavjud emas yoki o'chirilgan.</p>
          <Link href="/blog">
            <Button>Blog sahifasiga qaytish</Button>
          </Link>
        </div>
      </div>
    );
  }

  const typedPost = post as BlogPost;
  const otherPosts = (relatedPosts as BlogPost[]).filter(p => p.id !== typedPost.id).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{typedPost.title} | Evolvo.uz Blog</title>
        <meta name="description" content={typedPost.metaDescription} />
        <meta name="keywords" content={typedPost.keywords} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={typedPost.title} />
        <meta property="og:description" content={typedPost.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://evolvo.uz/blog/${typedPost.slug}`} />
        <meta property="og:image" content={typedPost.imageUrl} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={typedPost.title} />
        <meta name="twitter:description" content={typedPost.metaDescription} />
        <meta name="twitter:image" content={typedPost.imageUrl} />
        
        {/* Article specific tags */}
        <meta property="article:published_time" content={typedPost.publishedAt ? new Date(typedPost.publishedAt).toISOString() : new Date().toISOString()} />
        <meta property="article:author" content="Evolvo.uz" />
        <meta property="article:section" content={typedPost.category} />
        <meta property="article:tag" content={typedPost.keywords} />
      </Helmet>

      <div className="min-h-screen py-20 bg-background">
        <article className="max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-8" data-testid="breadcrumb">
            <Link href="/blog" className="hover:text-primary">Blog</Link>
            <span className="mx-2">/</span>
            <span>{typedPost.category}</span>
            <span className="mx-2">/</span>
            <span className="truncate">{typedPost.title}</span>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <div className="mb-4">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {typedPost.category}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6" data-testid="post-title">
              {typedPost.title}
            </h1>
            
            <div className="flex items-center space-x-6 text-muted-foreground mb-8">
              <div className="flex items-center space-x-2">
                <i className="fas fa-calendar"></i>
                <span data-testid="post-date">
                  {typedPost.publishedAt ? new Date(typedPost.publishedAt).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Bugun'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock"></i>
                <span data-testid="post-read-time">{typedPost.readTime} daqiqa o'qish</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-user"></i>
                <span>Evolvo.uz jamoasi</span>
              </div>
            </div>

          </header>

          {/* Featured Image with caption */}
          <div className="mb-12">
            <div className="relative group">
              <img 
                src={typedPost.imageUrl} 
                alt={typedPost.title}
                className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4 italic">
              {typedPost.category} bo'yicha chiroyli tasvir
            </p>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-12" data-testid="post-content">
            
            <div className="space-y-8 article-content">
              {typedPost.content.split('\n\n').map((paragraph, index) => {
                // Check if paragraph looks like a heading (starts with number or is all caps)
                const isHeading = /^(\d+\.|[A-Z\s]{10,}:)/.test(paragraph.trim());
                // Check if paragraph is a quote (contains quotes or starts with quote marks)
                const isQuote = paragraph.includes('"') || paragraph.startsWith('"') || paragraph.startsWith("'");
                
                if (isHeading) {
                  return (
                    <h3 key={index} className="text-2xl font-bold text-primary mt-12 mb-6 pb-2 border-b-2 border-primary/20">
                      {paragraph}
                    </h3>
                  );
                }
                
                if (isQuote) {
                  return (
                    <blockquote key={index} className="bg-muted/50 border-l-4 border-primary p-6 rounded-r-lg my-8">
                      <p className="text-lg italic text-muted-foreground leading-relaxed mb-0 relative">
                        <i className="fas fa-quote-left text-primary/30 text-2xl absolute -left-2 -top-2"></i>
                        <span className="ml-4">{paragraph}</span>
                      </p>
                    </blockquote>
                  );
                }
                
                return (
                  <p key={index} className="text-lg text-foreground leading-relaxed mb-6 text-justify">
                    {paragraph.split('.').map((sentence, sentenceIndex) => {
                      if (sentenceIndex === 0 || sentence.trim().length === 0) {
                        return sentence + (sentenceIndex < paragraph.split('.').length - 1 ? '.' : '');
                      }
                      return (
                        <span key={sentenceIndex}>
                          {sentence + (sentenceIndex < paragraph.split('.').length - 1 ? '.' : '')}
                          {sentenceIndex < paragraph.split('.').length - 2 && sentence.trim().length > 50 && <br className="hidden md:block" />}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
            </div>

            {/* Key Points Summary */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-8 mt-12 mb-8">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center">
                <i className="fas fa-lightbulb mr-2"></i>
                Asosiy xulosalar
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-check-circle text-green-500 mt-1 flex-shrink-0"></i>
                  <p className="text-sm text-muted-foreground">
                    AI va avtomatlashtirish biznesni rivojlantirish uchun kalit vosita
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-check-circle text-green-500 mt-1 flex-shrink-0"></i>
                  <p className="text-sm text-muted-foreground">
                    Texnologik yechimlar samaradorlikni oshiradi
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-check-circle text-green-500 mt-1 flex-shrink-0"></i>
                  <p className="text-sm text-muted-foreground">
                    Kelajakda raqamli transformatsiya zarur
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <i className="fas fa-check-circle text-green-500 mt-1 flex-shrink-0"></i>
                  <p className="text-sm text-muted-foreground">
                    Professional yordam bilan amalga oshirish mumkin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Article Footer */}
          <footer className="border-t border-border pt-8 mb-12">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-sm text-muted-foreground mr-2">Teglar:</span>
              {typedPost.keywords.split(',').map((tag, index) => (
                <span 
                  key={index}
                  className="bg-muted text-muted-foreground px-2 py-1 rounded text-sm"
                >
                  #{tag.trim().replace(/\s+/g, '')}
                </span>
              ))}
            </div>

            {/* Download and Share buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <DownloadPDFButton 
                post={typedPost} 
                className="bg-green-600 hover:bg-green-700 text-white"
              />
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Ulashish:</span>
                <a 
                  href={`https://t.me/share/url?url=https://evolvo.uz/blog/${typedPost.slug}&text=${encodeURIComponent(typedPost.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                  data-testid="share-telegram"
                >
                  <i className="fab fa-telegram text-xl"></i>
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=https://evolvo.uz/blog/${typedPost.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                  data-testid="share-facebook"
                >
                  <i className="fab fa-facebook text-xl"></i>
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?url=https://evolvo.uz/blog/${typedPost.slug}&text=${encodeURIComponent(typedPost.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                  data-testid="share-twitter"
                >
                  <i className="fab fa-twitter text-xl"></i>
                </a>
              </div>
            </div>
          </footer>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-8 text-center text-white mb-12">
            <h2 className="text-2xl font-bold mb-4">Loyihangizni boshlashga tayyormisiz?</h2>
            <p className="text-white/90 mb-6">
              Bizning AI-powered xizmatlarimiz yordamida biznesingizni rivojlantiring
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/services">
                <Button className="bg-white text-primary hover:bg-gray-100" data-testid="cta-services">
                  <i className="fas fa-rocket mr-2"></i>
                  Xizmatlarni ko'rish
                </Button>
              </Link>
              <a 
                href="https://t.me/evolvobot"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors inline-block"
                data-testid="cta-telegram"
              >
                <i className="fab fa-telegram mr-2"></i>
                Bog'lanish
              </a>
            </div>
          </div>

          {/* Related Posts */}
          {otherPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-8">O'xshash maqolalar</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {otherPosts.map((relatedPost) => (
                  <article key={relatedPost.id} className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Link href={`/blog/${relatedPost.slug}`}>
                      <img 
                        src={relatedPost.imageUrl} 
                        alt={relatedPost.title}
                        className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    
                    <div className="p-4">
                      <div className="text-xs text-muted-foreground mb-2">
                        {relatedPost.category} • {relatedPost.readTime} daqiqa
                      </div>
                      
                      <Link href={`/blog/${relatedPost.slug}`}>
                        <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer line-clamp-2">
                          {relatedPost.title}
                        </h3>
                      </Link>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
