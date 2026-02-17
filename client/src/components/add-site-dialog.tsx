import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSiteSchema, type InsertSite } from "@shared/schema";
import { useCreateSite } from "@/hooks/use-sites";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

export function AddSiteDialog() {
  const [open, setOpen] = useState(false);
  const createSite = useCreateSite();
  
  const form = useForm<InsertSite>({
    resolver: zodResolver(insertSiteSchema),
    defaultValues: {
      name: "",
      url: "",
      intervalMinutes: 5,
      isActive: true,
    },
  });

  const onSubmit = async (data: InsertSite) => {
    try {
      await createSite.mutateAsync(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Monitor New Site</DialogTitle>
          <DialogDescription>
            Enter the details of the website you want to monitor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Portfolio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="intervalMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Interval (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      placeholder="5" 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createSite.isPending}>
                {createSite.isPending ? "Adding..." : "Start Monitoring"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
