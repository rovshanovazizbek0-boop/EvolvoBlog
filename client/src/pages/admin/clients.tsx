import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Client, Order } from "@shared/schema";

export default function AdminClients() {
  const [, setLocation] = useLocation();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientNotes, setClientNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Ruxsat berilmagan",
        description: "Admin paneliga kirish uchun tizimga kiring...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/admin/login");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/admin/clients"],
    retry: false,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/admin/orders"],
    retry: false,
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ clientId, notes }: { clientId: string; notes: string }) => {
      return await apiRequest("PATCH", `/api/admin/clients/${clientId}`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Mijoz ma'lumotlari yangilandi",
        description: "Eslatmalar muvaffaqiyatli saqlandi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      setSelectedClient(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Ruxsat berilmagan",
          description: "Tizimdan chiqib ketdingiz. Qayta kirilmoqda...",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation("/admin/login");
        }, 500);
        return;
      }
      toast({
        title: "Xatolik",
        description: "Mijoz ma'lumotlarini yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/logout", {});
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const filteredClients = (clients as Client[]).filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telegramUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const getClientOrders = (clientTelegram: string) => {
    return (orders as Order[]).filter(order => order.telegramUsername === clientTelegram);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setClientNotes(client.notes || "");
  };

  const handleSaveNotes = () => {
    if (selectedClient) {
      updateClientMutation.mutate({
        clientId: selectedClient.id,
        notes: clientNotes,
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Admin Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">E</span>
                </div>
                <span className="text-xl font-bold text-foreground">Evolvo.uz Admin</span>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <button 
                  onClick={() => setLocation("/admin/dashboard")}
                  className="text-foreground hover:text-primary transition-colors"
                  data-testid="nav-dashboard"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setLocation("/admin/services")}
                  className="text-foreground hover:text-primary transition-colors"
                  data-testid="nav-services"
                >
                  Xizmatlar
                </button>
                <button className="text-primary font-medium" data-testid="nav-clients">
                  Mijozlar
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
                data-testid="view-site-button"
              >
                <i className="fas fa-external-link-alt mr-2"></i>
                Saytni ko'rish
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="logout-button"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mijozlar boshqaruvi</h1>
            <p className="text-muted-foreground">Mijozlar ma'lumotlari va buyurtma tarixi</p>
          </div>
          
          <div className="md:w-80">
            <Input
              type="text"
              placeholder="Mijozlarni qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="clients-search-input"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {clientsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? "Mijozlar topilmadi" : "Mijozlar mavjud emas"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Qidiruv bo'yicha mijozlar topilmadi. Boshqa so'z bilan qidiring."
                  : "Hozircha hech qanday mijoz ro'yxatdan o'tmagan."
                }
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm("")}
                  className="mt-4"
                  data-testid="clear-search-button"
                >
                  Qidiruvni tozalash
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              const clientOrders = getClientOrders(client.telegramUsername);
              const lastOrder = clientOrders[0];
              
              return (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <CardDescription>@{client.telegramUsername}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {client.totalOrders} buyurtma
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm">
                        <i className="fas fa-phone mr-2 text-muted-foreground"></i>
                        <span>{client.phone}</span>
                      </div>
                      
                      {client.email && (
                        <div className="flex items-center text-sm">
                          <i className="fas fa-envelope mr-2 text-muted-foreground"></i>
                          <span>{client.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm">
                        <i className="fas fa-calendar mr-2 text-muted-foreground"></i>
                        <span>
                          {new Date(client.createdAt!).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                      
                      {lastOrder && (
                        <div className="text-sm text-muted-foreground">
                          So'nggi buyurtma: {new Date(lastOrder.createdAt!).toLocaleDateString('uz-UZ')}
                        </div>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleViewClient(client)}
                          data-testid={`view-client-${client.id}`}
                        >
                          <i className="fas fa-eye mr-2"></i>
                          Batafsil ko'rish
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{client.name}</DialogTitle>
                          <DialogDescription>
                            Mijoz ma'lumotlari va buyurtma tarixi
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Client Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Telegram</label>
                              <p className="text-foreground">@{client.telegramUsername}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Telefon</label>
                              <p className="text-foreground">{client.phone}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Buyurtmalar soni</label>
                              <p className="text-foreground">{client.totalOrders}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Ro'yxatdan o'tgan</label>
                              <p className="text-foreground">
                                {new Date(client.createdAt!).toLocaleDateString('uz-UZ')}
                              </p>
                            </div>
                          </div>
                          
                          {/* Notes */}
                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                              Eslatmalar
                            </label>
                            <Textarea
                              value={clientNotes}
                              onChange={(e) => setClientNotes(e.target.value)}
                              placeholder="Mijoz haqida eslatmalar yozing..."
                              rows={3}
                              data-testid="client-notes-textarea"
                            />
                            <Button 
                              onClick={handleSaveNotes}
                              disabled={updateClientMutation.isPending}
                              className="mt-2"
                              data-testid="save-notes-button"
                            >
                              {updateClientMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                  Saqlanmoqda...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-save mr-2"></i>
                                  Eslatmalarni saqlash
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* Order History */}
                          <div>
                            <h4 className="text-lg font-semibold mb-4">Buyurtma tarixi</h4>
                            {clientOrders.length === 0 ? (
                              <p className="text-muted-foreground">Buyurtmalar mavjud emas</p>
                            ) : (
                              <div className="space-y-3">
                                {clientOrders.map((order) => (
                                  <div key={order.id} className="border border-border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium">{order.serviceId}</span>
                                      <Badge 
                                        variant={order.status === "completed" ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {order.status === "new" ? "Yangi" : 
                                         order.status === "in_progress" ? "Jarayonda" : "Tugallangan"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                      {order.details.substring(0, 100)}...
                                    </p>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <span>{new Date(order.createdAt!).toLocaleDateString('uz-UZ')}</span>
                                      {order.budget && <span>{order.budget}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami mijozlar</CardTitle>
              <i className="fas fa-users text-muted-foreground"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-clients">
                {(clients as Client[]).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bir nechta buyurtma berganlar</CardTitle>
              <i className="fas fa-repeat text-muted-foreground"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="repeat-clients">
                {(clients as Client[]).filter(client => (client.totalOrders || 0) > 1).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eslatmalar bor</CardTitle>
              <i className="fas fa-sticky-note text-muted-foreground"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="clients-with-notes">
                {(clients as Client[]).filter(client => client.notes?.trim()).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
