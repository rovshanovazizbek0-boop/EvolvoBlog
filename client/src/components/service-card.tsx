import { Link } from "wouter";
import type { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const getServiceIcon = (title: string) => {
    if (title.includes("Veb-sayt")) return "fas fa-globe";
    if (title.includes("Telegram")) return "fab fa-telegram";
    if (title.includes("Chatbot")) return "fas fa-robot";
    if (title.includes("avtomatlashtirish")) return "fas fa-cogs";
    return "fas fa-star";
  };

  const getServiceColor = (title: string) => {
    if (title.includes("Veb-sayt")) return "text-primary";
    if (title.includes("Telegram")) return "text-secondary";
    if (title.includes("Chatbot")) return "text-accent";
    if (title.includes("avtomatlashtirish")) return "text-orange-500";
    return "text-primary";
  };

  const getButtonColor = (title: string) => {
    if (title.includes("Veb-sayt")) return "bg-primary hover:bg-primary/90 text-primary-foreground";
    if (title.includes("Telegram")) return "bg-secondary hover:bg-secondary/90 text-secondary-foreground";
    if (title.includes("Chatbot")) return "bg-accent hover:bg-accent/90 text-accent-foreground";
    if (title.includes("avtomatlashtirish")) return "bg-orange-500 hover:bg-orange-600 text-white";
    return "bg-primary hover:bg-primary/90 text-primary-foreground";
  };

  return (
    <div className="service-card bg-background border border-border rounded-xl p-6 hover:border-primary/50">
      {service.imageUrl && (
        <img 
          src={service.imageUrl} 
          alt={service.title}
          className="w-full h-32 object-cover rounded-lg mb-4"
        />
      )}
      
      <div className={`w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center mb-4 ${getServiceColor(service.title).replace('text-', 'bg-')}/10`}>
        <i className={`${getServiceIcon(service.title)} ${getServiceColor(service.title)} text-xl`}></i>
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">{service.title}</h3>
      <p className="text-muted-foreground mb-4">{service.description.substring(0, 100)}...</p>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Narx:</span>
          <span className="text-sm font-medium">{service.priceRange}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Muddat:</span>
          <span className="text-sm font-medium">{service.duration}</span>
        </div>
      </div>
      
      <Link href={`/services/${service.id}`}>
        <button 
          className={`w-full py-2 rounded-lg font-medium transition-colors ${getButtonColor(service.title)}`}
          data-testid={`service-detail-button-${service.id}`}
        >
          Batafsil ma'lumot
        </button>
      </Link>
    </div>
  );
}
