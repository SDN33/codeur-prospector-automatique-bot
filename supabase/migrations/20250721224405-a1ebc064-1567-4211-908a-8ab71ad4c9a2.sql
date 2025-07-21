-- Create projects table to store scraped data
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  budget TEXT,
  skills TEXT[],
  posted_date TIMESTAMP WITH TIME ZONE,
  url TEXT,
  client_info JSONB,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prospects table to track contacted projects
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'rejected')),
  contact_date TIMESTAMP WITH TIME ZONE,
  message_sent TEXT,
  response_received TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message templates table
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scraping sessions table to track scraping activity
CREATE TABLE public.scraping_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  search_criteria JSONB,
  projects_found INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now - can be restricted later with auth)
CREATE POLICY "Anyone can view projects" 
ON public.projects 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view prospects" 
ON public.prospects 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can manage prospects" 
ON public.prospects 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can view templates" 
ON public.message_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can manage templates" 
ON public.message_templates 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can view scraping sessions" 
ON public.scraping_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can manage scraping sessions" 
ON public.scraping_sessions 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_posted_date ON public.projects(posted_date DESC);
CREATE INDEX idx_projects_skills ON public.projects USING GIN(skills);
CREATE INDEX idx_prospects_status ON public.prospects(status);
CREATE INDEX idx_prospects_project_id ON public.prospects(project_id);
CREATE INDEX idx_templates_category ON public.message_templates(category);