export default function TelegramBanner() {
  return (
    <div className="telegram-banner sticky top-0 z-50 px-4 py-3 text-white shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fab fa-telegram text-2xl"></i>
          <span className="font-medium">Telegram botimiz orqali AI yordamida xizmat tanlang</span>
        </div>
        <a 
          href="https://t.me/evolvobot" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-white text-primary px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          data-testid="telegram-bot-link"
        >
          @evolvobot
        </a>
      </div>
    </div>
  );
}
