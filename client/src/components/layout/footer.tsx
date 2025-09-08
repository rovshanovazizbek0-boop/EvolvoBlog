import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold">Evolvo.uz</span>
            </div>
            <p className="text-background/70 mb-4">
              AI teknologiyalari yordamida biznesingizni rivojlantiring.
            </p>
            <div className="flex space-x-4">
              <a href="https://t.me/evolvobot" target="_blank" rel="noopener noreferrer" className="text-background/70 hover:text-background" data-testid="footer-telegram">
                <i className="fab fa-telegram text-xl"></i>
              </a>
              <a href="#" className="text-background/70 hover:text-background" data-testid="footer-instagram">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-background/70 hover:text-background" data-testid="footer-linkedin">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Xizmatlar</h4>
            <ul className="space-y-2 text-background/70">
              <li><Link href="/services" className="hover:text-background">Veb-sayt yaratish</Link></li>
              <li><Link href="/services" className="hover:text-background">Telegram botlar</Link></li>
              <li><Link href="/services" className="hover:text-background">AI Chatbotlar</Link></li>
              <li><Link href="/services" className="hover:text-background">Biznes avtomatlashtirish</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Kompaniya</h4>
            <ul className="space-y-2 text-background/70">
              <li><Link href="/" className="hover:text-background">Biz haqimizda</Link></li>
              <li><Link href="/services" className="hover:text-background">Loyihalar</Link></li>
              <li><Link href="/blog" className="hover:text-background">Blog</Link></li>
              <li><a href="#contact" className="hover:text-background">Bog'lanish</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Bog'lanish</h4>
            <ul className="space-y-2 text-background/70">
              <li>
                <i className="fab fa-telegram mr-2"></i>
                @evolvobot
              </li>
              <li>
                <i className="fas fa-envelope mr-2"></i>
                info@evolvo.uz
              </li>
              <li>
                <i className="fas fa-phone mr-2"></i>
                +998 90 123 45 67
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/70">
          <p>&copy; 2024 Evolvo.uz. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>
    </footer>
  );
}
