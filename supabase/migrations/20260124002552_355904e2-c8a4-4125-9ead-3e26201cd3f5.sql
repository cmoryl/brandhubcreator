-- Enable realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE public.brands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;