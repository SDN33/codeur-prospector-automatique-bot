import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchCriteria {
  keywords?: string;
  budget_min?: number;
  budget_max?: number;
  skills?: string[];
  posted_days?: number;
}

interface ScrapedProject {
  title: string;
  description: string;
  budget: string;
  skills: string[];
  posted_date: string;
  url: string;
  client_info?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { searchCriteria } = await req.json() as { searchCriteria: SearchCriteria };

    console.log('Starting scraping with criteria:', searchCriteria);

    // Create scraping session
    const { data: session, error: sessionError } = await supabase
      .from('scraping_sessions')
      .insert({
        search_criteria: searchCriteria,
        status: 'running'
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // Simulate scraping codeur.com (replace with real scraping logic)
    const scrapedProjects: ScrapedProject[] = await scrapeCodeurProjects(searchCriteria);

    // Insert scraped projects into database
    if (scrapedProjects.length > 0) {
      const { data: insertedProjects, error: insertError } = await supabase
        .from('projects')
        .insert(scrapedProjects.map(project => ({
          title: project.title,
          description: project.description,
          budget: project.budget,
          skills: project.skills,
          posted_date: project.posted_date,
          url: project.url,
          client_info: project.client_info
        })));

      if (insertError) {
        console.error('Error inserting projects:', insertError);
        throw insertError;
      }
    }

    // Update scraping session as completed
    await supabase
      .from('scraping_sessions')
      .update({
        status: 'completed',
        projects_found: scrapedProjects.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', session.id);

    console.log(`Scraping completed. Found ${scrapedProjects.length} projects`);

    return new Response(
      JSON.stringify({
        success: true,
        projectsFound: scrapedProjects.length,
        sessionId: session.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function scrapeCodeurProjects(criteria: SearchCriteria): Promise<ScrapedProject[]> {
  // For now, return realistic fake data
  // TODO: Implement real scraping logic with proper HTML parsing
  const mockProjects: ScrapedProject[] = [
    {
      title: "Développement d'une application mobile React Native",
      description: "Nous recherchons un développeur expérimenté pour créer une application mobile de e-commerce. L'application doit être compatible iOS et Android, avec intégration de paiement et gestion des commandes.",
      budget: "5 000 € - 8 000 €",
      skills: ["React Native", "JavaScript", "API REST", "Firebase"],
      posted_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      url: "https://codeur.com/projects/123456",
      client_info: {
        name: "TechStart SAS",
        verified: true,
        location: "Paris, France"
      }
    },
    {
      title: "Refonte complète d'un site web WordPress",
      description: "Site vitrine existant à moderniser avec nouveau design responsive, optimisation SEO et intégration CRM. Environ 15 pages à refaire.",
      budget: "2 500 € - 4 000 €",
      skills: ["WordPress", "PHP", "CSS", "JavaScript", "SEO"],
      posted_date: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      url: "https://codeur.com/projects/123457",
      client_info: {
        name: "Marketing Plus",
        verified: false,
        location: "Lyon, France"
      }
    },
    {
      title: "Création d'une API REST avec Node.js",
      description: "Développement d'une API pour une application de gestion de stock. Base de données PostgreSQL, authentification JWT, documentation Swagger.",
      budget: "3 000 € - 5 000 €",
      skills: ["Node.js", "Express", "PostgreSQL", "JWT", "Docker"],
      posted_date: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
      url: "https://codeur.com/projects/123458",
      client_info: {
        name: "LogiStock Pro",
        verified: true,
        location: "Nantes, France"
      }
    },
    {
      title: "Intégration de système de paiement Stripe",
      description: "Ajout du paiement en ligne sur une boutique existante. Gestion des abonnements, webhooks, et interface d'administration.",
      budget: "1 500 € - 2 500 €",
      skills: ["Stripe", "JavaScript", "PHP", "Webhooks"],
      posted_date: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
      url: "https://codeur.com/projects/123459",
      client_info: {
        name: "E-Shop France",
        verified: true,
        location: "Marseille, France"
      }
    },
    {
      title: "Développement d'un dashboard analytique",
      description: "Création d'un tableau de bord pour visualiser les données de vente. Graphiques interactifs, exports PDF, système de notifications.",
      budget: "4 000 € - 6 000 €",
      skills: ["React", "D3.js", "Python", "Django", "PostgreSQL"],
      posted_date: new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000).toISOString(),
      url: "https://codeur.com/projects/123460",
      client_info: {
        name: "DataViz Solutions",
        verified: true,
        location: "Toulouse, France"
      }
    }
  ];

  // Filter based on criteria
  let filteredProjects = mockProjects;

  if (criteria.keywords) {
    const keywords = criteria.keywords.toLowerCase();
    filteredProjects = filteredProjects.filter(project => 
      project.title.toLowerCase().includes(keywords) ||
      project.description.toLowerCase().includes(keywords) ||
      project.skills.some(skill => skill.toLowerCase().includes(keywords))
    );
  }

  if (criteria.skills && criteria.skills.length > 0) {
    filteredProjects = filteredProjects.filter(project =>
      criteria.skills!.some(skill => 
        project.skills.some(projectSkill => 
          projectSkill.toLowerCase().includes(skill.toLowerCase())
        )
      )
    );
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  return filteredProjects;
}