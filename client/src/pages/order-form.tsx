import { useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Service } from "@shared/schema";

const orderSchema = z.object({
  clientName: z.string().min(2, "Ism familiya kamida 2 ta harf bo'lishi kerak"),
  email: z.string().email("To'g'ri email manzil kiriting"),
  phone: z.string().min(9, "To'g'ri telefon raqam kiriting"),
  telegramUsername: z.string().min(1, "Telegram username kiriting"),
  serviceId: z.string().min(1, "Xizmat turini tanlang"),
  details: z.string().min(10, "Loyiha haqida batafsil yozing (kamida 10 ta harf)"),
  budget: z.string().optional(),
  deadline: z.string().optional(),
  agree: z.boolean().refine(val => val === true, "Shartlarni qabul qilishingiz kerak"),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function OrderForm() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/order");
  const { toast } = useToast();
  
  // Get pre-selected service from navigation state
  const locationState = history.state;
  const preSelectedServiceId = locationState?.serviceId;
  const preSelectedServiceTitle = locationState?.serviceTitle;

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientName: "",
      email: "",
      phone: "",
      telegramUsername: "",
      serviceId: preSelectedServiceId || "",
      details: "",
      budget: "",
      deadline: "",
      agree: false,
    },
  });

  const orderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const { agree, ...orderData } = data;
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Buyurtma yuborildi!",
        description: "Tez orada siz bilan bog'lanamiz. Telegram orqali tasdiqlash xabari yuborildi.",
      });
      form.reset();
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Xatolik yuz berdi",
        description: "Buyurtmani yuborishda xatolik. Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
      console.error("Order submission error:", error);
    },
  });

  const onSubmit = (data: OrderFormData) => {
    orderMutation.mutate(data);
  };

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Buyurtma berish</h1>
          <p className="text-xl text-muted-foreground">
            Loyihangiz haqida ma'lumot bering va biz siz bilan bog'lanamiz
          </p>
        </div>

        {/* Pre-selected service indicator */}
        {preSelectedServiceTitle && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-primary"></i>
              <span className="font-medium">Tanlangan xizmat: {preSelectedServiceTitle}</span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <h2 className="text-xl font-semibold mb-4">Shaxsiy ma'lumotlar</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ism familiya *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ismingiz va familiyangiz" 
                          {...field}
                          data-testid="input-client-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon raqam *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+998 99 644 84 44" 
                          {...field}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Email manzil *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="email@example.com" 
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telegramUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram username *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="@username" 
                        {...field}
                        data-testid="input-telegram"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Service Information */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <h2 className="text-xl font-semibold mb-4">Xizmat ma'lumotlari</h2>
              
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Xizmat turi *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service">
                          <SelectValue placeholder="Xizmat turini tanlang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(services as Service[]).map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loyiha haqida batafsil *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Loyihangiz haqida batafsil ma'lumot bering: qanday funksiyalar kerak, qanday dizayn istaysiz, va boshqa muhim tafsilotlar..."
                        rows={4}
                        {...field}
                        data-testid="textarea-details"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <h2 className="text-xl font-semibold mb-4">Qo'shimcha ma'lumotlar</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Byudjet</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-budget">
                            <SelectValue placeholder="Byudjetni tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="500-1000">$500 - $1000</SelectItem>
                          <SelectItem value="1000-2500">$1000 - $2500</SelectItem>
                          <SelectItem value="2500-5000">$2500 - $5000</SelectItem>
                          <SelectItem value="5000+">$5000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tugash sanasi</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          data-testid="input-deadline"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="bg-card p-6 rounded-xl border border-border">
              <FormField
                control={form.control}
                name="agree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-agree"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Men{" "}
                        <Link href="/terms" className="text-primary hover:underline">
                          shartlar va qoidalar
                        </Link>
                        ga roziyman
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full py-3 text-lg font-semibold"
                disabled={orderMutation.isPending}
                data-testid="button-submit-order"
              >
                {orderMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Buyurtmani yuborish
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
