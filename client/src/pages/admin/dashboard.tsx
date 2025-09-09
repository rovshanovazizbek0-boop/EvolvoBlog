import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Order, Service } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
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

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
    retry: false,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/admin/services"],
    retry: false,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PATCH", `/api/admin/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Buyurtma yangilandi",
        description: "Buyurtma holati muvaffaqiyatli o'zgartirildi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
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
        description: "Buyurtmani yangilashda xatolik yuz berdi.",
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

  const testSingleBlogMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/test-single-blog", {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Blog yaratildi! ✅",
        description: `"${data?.post?.title || 'Yangi blog'}" 30 soniyada nashr qilinadi`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik ❌",
        description: error.message || "Blog yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const testDailyGenerationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/test-blog-generation", {});
    },
    onSuccess: () => {
      toast({
        title: "7 ta blog yaratildi! ✅",
        description: "Barcha postlar bir necha daqiqada nashr qilinadi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Xatolik ❌",
        description: error.message || "Blog yaratishda xatolik yuz berdi",
        variant: "destructive",
      });
    },
  });

  const testSingleBlog = () => {
    testSingleBlogMutation.mutate();
  };

  const testDailyGeneration = () => {
    testDailyGenerationMutation.mutate();
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500";
      case "in_progress": return "bg-yellow-500";
      case "completed": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Yangi";
      case "in_progress": return "Jarayonda";
      case "completed": return "Tugallangan";
      default: return status;
    }
  };

  const getServiceTitle = (serviceId: string) => {
    const service = (services as Service[]).find(s => s.id === serviceId);
    return service?.title || "Noma'lum xizmat";
  };

  const totalOrders = (orders as Order[]).length;
  const newOrders = (orders as Order[]).filter((o: Order) => o.status === "new").length;
  const inProgressOrders = (orders as Order[]).filter((o: Order) => o.status === "in_progress").length;
  const completedOrders = (orders as Order[]).filter((o: Order) => o.status === "completed").length;

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
                <button className="text-primary font-medium" data-testid="nav-dashboard">
                  Dashboard
                </button>
                <button 
                  onClick={() => setLocation("/admin/services")}
                  className="text-foreground hover:text-primary transition-colors"
                  data-testid="nav-services"
                >
                  Xizmatlar
                </button>
                <button 
                  onClick={() => setLocation("/admin/clients")}
                  className="text-foreground hover:text-primary transition-colors"
                  data-testid="nav-clients"
                >
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami buyurtmalar</CardTitle>
              <i className="fas fa-shopping-cart text-muted-foreground"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-orders">{totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yangi buyurtmalar</CardTitle>
              <i className="fas fa-bell text-blue-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500" data-testid="new-orders">{newOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jarayonda</CardTitle>
              <i className="fas fa-clock text-yellow-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500" data-testid="progress-orders">{inProgressOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tugallangan</CardTitle>
              <i className="fas fa-check-circle text-green-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500" data-testid="completed-orders">{completedOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Blog Test Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🧪 Blog Tizimi Sinash</CardTitle>
            <CardDescription>
              AI blog yaratish va Telegram yuborishni sinash
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => testSingleBlog()}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={testSingleBlogMutation.isPending}
                data-testid="test-single-blog"
              >
                {testSingleBlogMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <i className="fas fa-flask mr-2"></i>
                    Bitta Blog Sinash
                  </>
                )}
              </Button>
              <Button 
                onClick={() => testDailyGeneration()}
                className="bg-green-600 hover:bg-green-700"
                disabled={testDailyGenerationMutation.isPending}
                data-testid="test-daily-generation"
              >
                {testDailyGenerationMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <i className="fas fa-calendar-day mr-2"></i>
                    Kunlik Yaratish Sinash
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>So'nggi buyurtmalar</CardTitle>
            <CardDescription>
              Barcha buyurtmalar va ularning holati
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg animate-pulse">
                    <div className="w-16 h-4 bg-muted rounded"></div>
                    <div className="flex-1 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-4 bg-muted rounded"></div>
                    <div className="w-32 h-8 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (orders as Order[]).length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-semibold text-foreground mb-2">Buyurtmalar mavjud emas</h3>
                <p className="text-muted-foreground">Hozircha hech qanday buyurtma qabul qilinmagan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(orders as Order[]).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="font-medium text-foreground">{order.clientName}</div>
                        <div className="text-sm text-muted-foreground">@{order.telegramUsername}</div>
                      </div>
                      
                      <div>
                        <div className="font-medium text-foreground">{getServiceTitle(order.serviceId)}</div>
                        <div className="text-sm text-muted-foreground">{order.phone}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.createdAt!).toLocaleDateString('uz-UZ')}
                        </div>
                        {order.budget && (
                          <div className="text-sm text-primary font-medium">{order.budget}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Select
                          value={order.status || 'new'}
                          onValueChange={(value) => updateOrderMutation.mutate({ orderId: order.id, status: value || 'new' })}
                          disabled={updateOrderMutation.isPending}
                        >
                          <SelectTrigger className="w-40" data-testid={`order-status-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Yangi</SelectItem>
                            <SelectItem value="in_progress">Jarayonda</SelectItem>
                            <SelectItem value="completed">Tugallangan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
