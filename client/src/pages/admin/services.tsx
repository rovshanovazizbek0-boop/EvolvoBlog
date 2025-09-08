import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

const serviceSchema = z.object({
  title: z.string().min(1, "Sarlavha kiritilishi shart"),
  description: z.string().min(1, "Tavsif kiritilishi shart"),
  priceRange: z.string().min(1, "Narx diapazoni kiritilishi shart"),
  duration: z.string().min(1, "Muddat kiritilishi shart"),
  imageUrl: z.string().url("To'g'ri URL kiriting").optional().or(z.literal("")),
  aiPromptTemplate: z.string().min(1, "AI shablon kiritilishi shart"),
  features: z.string(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function AdminServices() {
  const [, setLocation] = useLocation();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/admin/services"],
    retry: false,
  });

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      priceRange: "",
      duration: "",
      imageUrl: "",
      aiPromptTemplate: "",
      features: "",
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const { features, ...serviceData } = data;
      const featuresArray = features.split('\n').filter(f => f.trim());
      return await apiRequest("POST", "/api/admin/services", {
        ...serviceData,
        features: featuresArray,
      });
    },
    onSuccess: () => {
      toast({
        title: "Xizmat yaratildi",
        description: "Yangi xizmat muvaffaqiyatli qo'shildi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      form.reset();
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
        description: "Xizmat yaratishda xatolik yuz berdi.",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      if (!editingService) return;
      const { features, ...serviceData } = data;
      const featuresArray = features.split('\n').filter(f => f.trim());
      return await apiRequest("PATCH", `/api/admin/services/${editingService.id}`, {
        ...serviceData,
        features: featuresArray,
      });
    },
    onSuccess: () => {
      toast({
        title: "Xizmat yangilandi",
        description: "Xizmat ma'lumotlari muvaffaqiyatli yangilandi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
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
        description: "Xizmatni yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await apiRequest("DELETE", `/api/admin/services/${serviceId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Xizmat o'chirildi",
        description: "Xizmat muvaffaqiyatli o'chirildi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
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
        description: "Xizmatni o'chirishda xatolik yuz berdi.",
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

  const handleEditService = (service: Service) => {
    setEditingService(service);
    form.setValue("title", service.title);
    form.setValue("description", service.description);
    form.setValue("priceRange", service.priceRange);
    form.setValue("duration", service.duration);
    form.setValue("imageUrl", service.imageUrl || "");
    form.setValue("aiPromptTemplate", service.aiPromptTemplate);
    form.setValue("features", Array.isArray(service.features) ? service.features.join('\n') : "");
    setIsDialogOpen(true);
  };

  const handleAddService = () => {
    setEditingService(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateServiceMutation.mutate(data);
    } else {
      createServiceMutation.mutate(data);
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
                <button className="text-primary font-medium" data-testid="nav-services">
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Xizmatlar boshqaruvi</h1>
            <p className="text-muted-foreground">Mavjud xizmatlarni boshqaring va yangilarini qo'shing</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddService} data-testid="add-service-button">
                <i className="fas fa-plus mr-2"></i>
                Yangi xizmat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Xizmatni tahrirlash" : "Yangi xizmat qo'shish"}
                </DialogTitle>
                <DialogDescription>
                  Xizmat ma'lumotlarini to'ldiring
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sarlavha</FormLabel>
                        <FormControl>
                          <Input placeholder="Xizmat nomi" {...field} data-testid="service-title-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tavsif</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Xizmat haqida batafsil" rows={3} {...field} data-testid="service-description-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priceRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Narx diapazoni</FormLabel>
                          <FormControl>
                            <Input placeholder="$500 - $5000" {...field} data-testid="service-price-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Muddat</FormLabel>
                          <FormControl>
                            <Input placeholder="5-14 kun" {...field} data-testid="service-duration-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rasm URL (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} data-testid="service-image-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Xususiyatlar (har bir qatorda bittadan)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={`Responsive dizayn\nSEO optimizatsiya\nAdmin panel\n1 yil texnik yordam`}
                            rows={4}
                            {...field}
                            data-testid="service-features-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiPromptTemplate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI shablon</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Siz {service} xizmati bilan qiziqasiz. Loyihangiz haqida batafsil gapiring..."
                            rows={3}
                            {...field}
                            data-testid="service-prompt-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="cancel-service-button"
                    >
                      Bekor qilish
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                      data-testid="save-service-button"
                    >
                      {createServiceMutation.isPending || updateServiceMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Saqlanmoqda...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          {editingService ? "Yangilash" : "Yaratish"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Services Grid */}
        {servicesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="w-full h-32 bg-muted rounded"></div>
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
        ) : (services as Service[]).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <i className="fas fa-box-open text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">Xizmatlar mavjud emas</h3>
              <p className="text-muted-foreground mb-6">Hozircha hech qanday xizmat qo'shilmagan.</p>
              <Button onClick={handleAddService} data-testid="add-first-service">
                <i className="fas fa-plus mr-2"></i>
                Birinchi xizmatni qo'shish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(services as Service[]).map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  {service.imageUrl && (
                    <img 
                      src={service.imageUrl} 
                      alt={service.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Narx:</span>
                      <span className="font-medium">{service.priceRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Muddat:</span>
                      <span className="font-medium">{service.duration}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditService(service)}
                      data-testid={`edit-service-${service.id}`}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Tahrir
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => {
                        if (confirm("Ushbu xizmatni o'chirishni istaysizmi?")) {
                          deleteServiceMutation.mutate(service.id);
                        }
                      }}
                      disabled={deleteServiceMutation.isPending}
                      data-testid={`delete-service-${service.id}`}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
