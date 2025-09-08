import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();

  // Don't show header on admin pages
  if (location.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="bg-card border-b border-border sticky top-16 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold text-foreground">Evolvo.uz</span>
          </Link>
          
          <div className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className="text-foreground hover:text-primary transition-colors font-medium"
              data-testid="nav-home"
            >
              Bosh sahifa
            </Link>
            <Link 
              href="/services" 
              className="text-foreground hover:text-primary transition-colors font-medium"
              data-testid="nav-services"
            >
              Xizmatlar
            </Link>
            <Link 
              href="/blog" 
              className="text-foreground hover:text-primary transition-colors font-medium"
              data-testid="nav-blog"
            >
              Blog
            </Link>
            <a 
              href="#contact" 
              className="text-foreground hover:text-primary transition-colors font-medium"
              data-testid="nav-contact"
            >
              Bog'lanish
            </a>
          </div>
          
          <button className="md:hidden text-foreground" data-testid="mobile-menu-button">
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
