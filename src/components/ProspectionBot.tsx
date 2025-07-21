import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, MessageSquare, Users, Settings, Target, Send, Eye, Copy } from "lucide-react";

interface Prospect {
  id: string;
  title: string;
  budget: string;
  skills: string[];
  description: string;
  postedDate: string;
  status: 'new' | 'contacted' | 'responded' | 'rejected';
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
}

export const ProspectionBot = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("search");
  
  // Search criteria state
  const [searchCriteria, setSearchCriteria] = useState({
    keywords: "",
    budget_min: "",
    budget_max: "",
    skills: "",
    posted_within: "7"
  });

  // Message templates state
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: "1",
      name: "Présentation générale",
      subject: "Proposition pour votre projet {PROJECT_TITLE}",
      content: `Bonjour,

J'ai consulté votre projet "{PROJECT_TITLE}" et je suis très intéressé(e) par cette opportunité.

Avec {EXPERIENCE} années d'expérience en {SKILLS}, je peux vous proposer une solution adaptée à vos besoins spécifiques.

Mes points forts :
- {STRENGTH_1}
- {STRENGTH_2}
- {STRENGTH_3}

Je serais ravi(e) de discuter plus en détail de votre projet.

Cordialement,
{YOUR_NAME}`,
      category: "général"
    }
  ]);

  // Prospects state
  const [prospects, setProspects] = useState<Prospect[]>([
    {
      id: "1",
      title: "Développement d'une application mobile e-commerce",
      budget: "5000€ - 10000€",
      skills: ["React Native", "Node.js", "MongoDB"],
      description: "Recherche développeur pour créer une app mobile de vente en ligne...",
      postedDate: "2024-01-15",
      status: "new"
    },
    {
      id: "2",
      title: "Site web vitrine pour restaurant",
      budget: "1500€ - 3000€",
      skills: ["WordPress", "PHP", "CSS"],
      description: "Besoin d'un site web moderne pour présenter notre restaurant...",
      postedDate: "2024-01-14",
      status: "contacted"
    }
  ]);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    content: "",
    category: ""
  });

  const addTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom et le contenu du modèle",
        variant: "destructive"
      });
      return;
    }

    const template: MessageTemplate = {
      id: Date.now().toString(),
      ...newTemplate
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: "", subject: "", content: "", category: "" });
    
    toast({
      title: "Succès",
      description: "Modèle de message ajouté avec succès"
    });
  };

  const copyTemplate = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Copié",
      description: "Le modèle a été copié dans le presse-papiers"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'contacted': return 'Contacté';
      case 'responded': return 'Répondu';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Bot de Prospection Codeur.com
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez efficacement votre prospection sur la plateforme Codeur.com
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Recherche
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Modèles
            </TabsTrigger>
            <TabsTrigger value="prospects" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Prospects
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Critères de recherche
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keywords">Mots-clés</Label>
                  <Input
                    id="keywords"
                    placeholder="ex: développement web, mobile"
                    value={searchCriteria.keywords}
                    onChange={(e) => setSearchCriteria({...searchCriteria, keywords: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Budget minimum (€)</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    placeholder="1000"
                    value={searchCriteria.budget_min}
                    onChange={(e) => setSearchCriteria({...searchCriteria, budget_min: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Budget maximum (€)</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    placeholder="10000"
                    value={searchCriteria.budget_max}
                    onChange={(e) => setSearchCriteria({...searchCriteria, budget_max: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Compétences requises</Label>
                  <Input
                    id="skills"
                    placeholder="React, Node.js, PHP"
                    value={searchCriteria.skills}
                    onChange={(e) => setSearchCriteria({...searchCriteria, skills: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="posted_within">Publié dans les</Label>
                  <Select value={searchCriteria.posted_within} onValueChange={(value) => setSearchCriteria({...searchCriteria, posted_within: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">24 heures</SelectItem>
                      <SelectItem value="3">3 jours</SelectItem>
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="14">14 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6">
                <Button className="w-full md:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher des projets
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Créer un nouveau modèle</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_name">Nom du modèle</Label>
                    <Input
                      id="template_name"
                      placeholder="ex: Présentation développeur web"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template_subject">Sujet</Label>
                    <Input
                      id="template_subject"
                      placeholder="ex: Proposition pour votre projet"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template_category">Catégorie</Label>
                    <Input
                      id="template_category"
                      placeholder="ex: développement web"
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template_content">Contenu du message</Label>
                    <Textarea
                      id="template_content"
                      rows={8}
                      placeholder="Votre message... Utilisez {PROJECT_TITLE}, {SKILLS}, etc. pour personnaliser"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                    />
                  </div>
                  <Button onClick={addTemplate}>
                    Ajouter le modèle
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Modèles existants</h3>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => copyTemplate(template)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {template.category && (
                        <Badge variant="secondary" className="mb-2">{template.category}</Badge>
                      )}
                      <p className="text-sm text-muted-foreground mb-2">{template.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{template.content}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="prospects" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestion des prospects
              </h3>
              <div className="space-y-4">
                {prospects.map((prospect) => (
                  <div key={prospect.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{prospect.title}</h4>
                      <div className="flex gap-2 items-center">
                        <Badge className={getStatusColor(prospect.status)}>
                          {getStatusText(prospect.status)}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{prospect.budget}</p>
                    <div className="flex gap-2 mb-2">
                      {prospect.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{prospect.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">Publié le {prospect.postedDate}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Configuration</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="your_name">Votre nom</Label>
                  <Input id="your_name" placeholder="Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Années d'expérience</Label>
                  <Input id="experience" type="number" placeholder="5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="main_skills">Compétences principales</Label>
                  <Input id="main_skills" placeholder="React, Node.js, PHP" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Lien portfolio</Label>
                  <Input id="portfolio" placeholder="https://monportfolio.com" />
                </div>
                <Button>Sauvegarder la configuration</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};