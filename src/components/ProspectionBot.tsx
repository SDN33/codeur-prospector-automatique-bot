import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Search, MessageSquare, Users, Settings, Plus, Copy, Play, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  title: string;
  description: string;
  budget: string;
  skills: string[];
  posted_date: string;
  url: string;
  client_info?: any;
}

interface Prospect {
  id: string;
  project_id: string;
  status: 'new' | 'contacted' | 'responded' | 'rejected';
  contact_date?: string;
  message_sent?: string;
  notes?: string;
  project?: Project;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
}

interface SearchCriteria {
  keywords: string;
  budget_min: string;
  budget_max: string;
  skills: string;
  posted_days: string;
}

export const ProspectionBot = () => {
  const [activeTab, setActiveTab] = useState("search");
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    keywords: "",
    budget_min: "",
    budget_max: "",
    skills: "",
    posted_days: "7",
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    content: "",
    category: "general"
  });

  const { toast } = useToast();

  // Load data on component mount
  useEffect(() => {
    loadProjects();
    loadProspects();
    loadTemplates();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('posted_date', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadProspects = async () => {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select(`
          *,
          project:projects(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Cast the status to ensure type safety
      const typedProspects = (data || []).map(prospect => ({
        ...prospect,
        status: prospect.status as 'new' | 'contacted' | 'responded' | 'rejected'
      }));
      
      setProspects(typedProspects);
    } catch (error) {
      console.error('Error loading prospects:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await supabase.functions.invoke('scrape-codeur', {
        body: {
          searchCriteria: {
            keywords: searchCriteria.keywords || undefined,
            budget_min: searchCriteria.budget_min ? parseInt(searchCriteria.budget_min) : undefined,
            budget_max: searchCriteria.budget_max ? parseInt(searchCriteria.budget_max) : undefined,
            skills: searchCriteria.skills ? searchCriteria.skills.split(',').map(s => s.trim()) : undefined,
            posted_days: parseInt(searchCriteria.posted_days)
          }
        }
      });

      if (response.error) {
        throw response.error;
      }

      const { projectsFound } = response.data;
      
      toast({
        title: "Recherche terminée",
        description: `${projectsFound} nouveaux projets trouvés !`,
      });

      // Reload projects to show new data
      await loadProjects();
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche de projets",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addToProspects = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('prospects')
        .insert({
          project_id: project.id,
          status: 'new'
        });

      if (error) throw error;

      toast({
        title: "Prospect ajouté",
        description: "Le projet a été ajouté à vos prospects",
      });

      await loadProspects();
    } catch (error) {
      console.error('Error adding prospect:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du prospect",
        variant: "destructive",
      });
    }
  };

  const updateProspectStatus = async (prospectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('prospects')
        .update({ 
          status: newStatus,
          contact_date: newStatus === 'contacted' ? new Date().toISOString() : undefined
        })
        .eq('id', prospectId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Statut changé vers: ${getStatusText(newStatus)}`,
      });

      await loadProspects();
    } catch (error) {
      console.error('Error updating prospect:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const addTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('message_templates')
        .insert(newTemplate);

      if (error) throw error;

      toast({
        title: "Template ajouté",
        description: "Le template a été créé avec succès",
      });

      setNewTemplate({ name: "", subject: "", content: "", category: "general" });
      await loadTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du template",
        variant: "destructive",
      });
    }
  };

  const copyTemplate = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copié !",
      description: "Le contenu du template a été copié dans le presse-papier",
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "new": return "bg-blue-500";
      case "contacted": return "bg-yellow-500";
      case "responded": return "bg-green-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "new": return "Nouveau";
      case "contacted": return "Contacté";
      case "responded": return "Répondu";
      case "rejected": return "Rejeté";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            CodeurBOT Pro
          </h1>
          <p className="text-muted-foreground text-lg">
            Automatisez votre prospection sur Codeur.com
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Recherche
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="prospects" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Prospects ({prospects.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Critères de recherche</CardTitle>
                  <CardDescription>
                    Définissez vos critères pour trouver les projets qui vous intéressent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="keywords">Mots-clés</Label>
                    <Input
                      id="keywords"
                      placeholder="React, Node.js, WordPress..."
                      value={searchCriteria.keywords}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, keywords: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget_min">Budget minimum (€)</Label>
                      <Input
                        id="budget_min"
                        type="number"
                        placeholder="1000"
                        value={searchCriteria.budget_min}
                        onChange={(e) => setSearchCriteria(prev => ({ ...prev, budget_min: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget_max">Budget maximum (€)</Label>
                      <Input
                        id="budget_max"
                        type="number"
                        placeholder="5000"
                        value={searchCriteria.budget_max}
                        onChange={(e) => setSearchCriteria(prev => ({ ...prev, budget_max: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
                    <Input
                      id="skills"
                      placeholder="JavaScript, PHP, CSS"
                      value={searchCriteria.skills}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, skills: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="posted_days">Projets postés dans les derniers (jours)</Label>
                    <Input
                      id="posted_days"
                      type="number"
                      placeholder="7"
                      value={searchCriteria.posted_days}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, posted_days: e.target.value }))}
                    />
                  </div>

                  <Button 
                    onClick={handleSearch} 
                    className="w-full"
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Play className="mr-2 h-4 w-4 animate-spin" />
                        Recherche en cours...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Lancer la recherche
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projets trouvés ({projects.length})</CardTitle>
                  <CardDescription>
                    Derniers projets correspondant à vos critères
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {projects.map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm">{project.title}</h3>
                          <Badge variant="outline">{project.budget}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {project.skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {project.skills.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {new Date(project.posted_date).toLocaleDateString('fr-FR')}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => addToProspects(project)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun projet trouvé. Lancez une recherche pour voir les résultats.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Créer un template</CardTitle>
                  <CardDescription>
                    Créez des templates de messages réutilisables
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template_name">Nom du template</Label>
                    <Input
                      id="template_name"
                      placeholder="Mon template de présentation"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template_subject">Sujet</Label>
                    <Input
                      id="template_subject"
                      placeholder="Proposition pour votre projet"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="template_content">Contenu du message</Label>
                    <Textarea
                      id="template_content"
                      placeholder="Bonjour, j'ai vu votre projet et..."
                      className="min-h-32"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="template_category">Catégorie</Label>
                    <Input
                      id="template_category"
                      placeholder="general"
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>

                  <Button onClick={addTemplate} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer le template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mes templates ({templates.length})</CardTitle>
                  <CardDescription>
                    Gérez vos templates existants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {templates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {template.subject}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {template.content}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyTemplate(template)}
                          className="w-full"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copier
                        </Button>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun template créé. Créez votre premier template.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="prospects">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des prospects</CardTitle>
                <CardDescription>
                  Suivez l'état de vos prospects et gérez vos contacts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prospects.map((prospect) => (
                    <div key={prospect.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{prospect.project?.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {prospect.project?.description}
                          </p>
                        </div>
                        <Badge className={getStatusColor(prospect.status)}>
                          {getStatusText(prospect.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {prospect.project?.skills.slice(0, 5).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Budget: {prospect.project?.budget}
                        </span>
                        <div className="flex gap-2">
                          {prospect.status === 'new' && (
                            <Button
                              size="sm"
                              onClick={() => updateProspectStatus(prospect.id, 'contacted')}
                            >
                              Marquer comme contacté
                            </Button>
                          )}
                          {prospect.status === 'contacted' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProspectStatus(prospect.id, 'responded')}
                              >
                                Répondu
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateProspectStatus(prospect.id, 'rejected')}
                              >
                                Rejeté
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {prospects.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun prospect encore. Ajoutez des projets depuis l'onglet Recherche.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projects.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Prospects Actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{prospects.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Réponse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {prospects.length > 0 
                      ? Math.round((prospects.filter(p => p.status === 'responded').length / prospects.filter(p => p.status === 'contacted').length) * 100) || 0
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['new', 'contacted', 'responded', 'rejected'].map(status => {
                    const count = prospects.filter(p => p.status === status).length;
                    const percentage = prospects.length > 0 ? (count / prospects.length) * 100 : 0;
                    
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                          <span className="text-sm">{getStatusText(status)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getStatusColor(status)}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};