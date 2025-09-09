import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type Portfolio } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Edit, Plus, ExternalLink, Image as ImageIcon } from "lucide-react";

const portfolioFormSchema = z.object({
  title: z.string().min(1, "Loyiha nomi majburiy"),
  description: z.string().min(1, "Tavsif majburiy"),
  imageUrl: z.string().url("To'g'ri URL kiriting"),
  projectUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().min(1, "Kategoriya majburiy"),
  technologies: z.string(),
  clientName: z.string().optional(),
  completedAt: z.string(),
  isPublic: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  metaDescription: z.string().optional(),
});

type PortfolioFormData = z.infer<typeof portfolioFormSchema>;

export default function AdminPortfolio() {
  const [editingItem, setEditingItem] = useState<Portfolio | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: portfolioItems = [], isLoading } = useQuery({
    queryKey: ["/api/admin/portfolio"],
  });

  const form = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      projectUrl: "",
      category: "",
      technologies: "",
      clientName: "",
      completedAt: new Date().toISOString().split('T')[0],
      isPublic: true,
      featured: false,
      sortOrder: 0,
      metaDescription: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/portfolio", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portfolio"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/admin/portfolio/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portfolio"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/portfolio/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/portfolio"] });
    },
  });

  const onSubmit = (data: PortfolioFormData) => {
    const formattedData = {
      ...data,
      technologies: data.technologies.split(',').map(t => t.trim()).filter(Boolean),
      completedAt: new Date(data.completedAt),
      projectUrl: data.projectUrl || null,
      clientName: data.clientName || null,
      metaDescription: data.metaDescription || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleEdit = (item: Portfolio) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      projectUrl: item.projectUrl || "",
      category: item.category,
      technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : "",
      clientName: item.clientName || "",
      completedAt: new Date(item.completedAt).toISOString().split('T')[0],
      isPublic: item.isPublic ?? true,
      featured: item.featured ?? false,
      sortOrder: item.sortOrder ?? 0,
      metaDescription: item.metaDescription || "",
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.reset({
      title: "",
      description: "",
      imageUrl: "",
      projectUrl: "",
      category: "",
      technologies: "",
      clientName: "",
      completedAt: new Date().toISOString().split('T')[0],
      isPublic: true,
      featured: false,
      sortOrder: 0,
      metaDescription: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Portfolio boshqaruvi</h1>
        <Button onClick={handleCreate} data-testid="create-portfolio-button">
          <Plus className="w-4 h-4 mr-2" />
          Yangi loyiha qo'shish
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(portfolioItems as Portfolio[]).map((item) => (
            <Card key={item.id} className="group relative">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="truncate">{item.title}</span>
                  <div className="flex gap-1">
                    {item.featured && <Badge variant="secondary">Featured</Badge>}
                    {!item.isPublic && <Badge variant="outline">Private</Badge>}
                  </div>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm line-clamp-3">{item.description}</p>
                  {Array.isArray(item.technologies) && item.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.technologies.slice(0, 3).map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {item.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{new Date(item.completedAt).toLocaleDateString('uz-UZ')}</span>
                    {item.clientName && <span>{item.clientName}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(item)}
                      data-testid={`edit-portfolio-${item.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {item.projectUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        data-testid={`view-portfolio-${item.id}`}
                      >
                        <a href={item.projectUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`delete-portfolio-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Portfolio loyihasini tahrirlash" : "Yangi portfolio loyihasi"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loyiha nomi *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="portfolio-title-input" />
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
                    <FormLabel>Tavsif *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="portfolio-description-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategoriya *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Veb-sayt, Telegram bot, AI chatbot..." data-testid="portfolio-category-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rasm URL *</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" data-testid="portfolio-image-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loyiha URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="url" data-testid="portfolio-url-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technologies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texnologiyalar (vergul bilan ajrating)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="React, Node.js, PostgreSQL" data-testid="portfolio-technologies-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mijoz nomi</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="portfolio-client-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="completedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yakunlangan sana *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" data-testid="portfolio-date-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO tavsif</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} rows={2} placeholder="Portfolio sahifasi uchun SEO tavsif" data-testid="portfolio-meta-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="portfolio-public-switch"
                        />
                      </FormControl>
                      <FormLabel>Ommaviy ko'rinish</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="portfolio-featured-switch"
                        />
                      </FormControl>
                      <FormLabel>Asosiy sahifada ko'rsatish</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tartib raqami</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="portfolio-sort-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="portfolio-submit-button"
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? "Saqlanmoqda..." 
                    : editingItem ? "Yangilash" : "Yaratish"
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="portfolio-cancel-button"
                >
                  Bekor qilish
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}