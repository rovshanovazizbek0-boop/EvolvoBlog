import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show banner after 3 seconds if not installed
    if (iOS && !isInstalled) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already dismissed in this session
  useEffect(() => {
    if (sessionStorage.getItem('pwa-install-dismissed')) {
      setShowInstallBanner(false);
    }
  }, []);

  if (isInstalled || !showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-900 border border-border rounded-lg shadow-lg z-50 p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="fas fa-download text-white text-lg"></i>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">
            Ilovani o'rnating
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isIOS 
              ? "Safari'da 'Ulashish' tugmasini bosib, keyin 'Bosh ekranga qo'shish' ni tanlang" 
              : "Evolvo.uz ilovasini telefoningizga o'rnating va tezkor foydalaning"
            }
          </p>
          
          <div className="flex gap-2">
            {!isIOS && deferredPrompt && (
              <Button 
                onClick={handleInstallClick}
                size="sm"
                className="bg-primary text-white hover:bg-primary/90"
                data-testid="install-app-button"
              >
                <i className="fas fa-download mr-2"></i>
                O'rnatish
              </Button>
            )}
            <Button 
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              data-testid="dismiss-install-button"
            >
              Yopish
            </Button>
          </div>
        </div>
        
        <button 
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1"
          data-testid="close-install-prompt"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}