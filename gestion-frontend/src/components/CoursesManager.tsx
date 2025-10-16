import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  BookOpen,
  Download,
  Upload,
  Star,
  Shield,
  BarChart3,
  RotateCcw,
  MoreVertical,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UE, UEType } from "../types/academic";
import { useUEStore } from "@/store/courseStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/components/ui/use-toast";
import ConfirmationModal from "./ui/ConfirmationModal";
import { SimpleSelect } from "./SimpleSelect";
import { cn } from "@/lib/utils";

interface UEFormData {
  code: string;
  title: string;
  credits: number;
  passingGrade: number;
  type: UEType;
  prerequisites: string[]; // ← Garder string[] pour le formulaire
  createdById: string;
  facultyId: string;
  level: string;
  description?: string;
  inCatalog: boolean;
}

// Composant de statistiques séparé
const StatsCards = ({ stats }: { stats: ReturnType<typeof useStats> }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[
      {
        label: "Total UEs",
        value: stats.total,
        icon: BookOpen,
        gradient: "from-blue-50 to-blue-100",
        border: "border-blue-200",
        iconBg: "bg-blue-200",
        iconColor: "text-blue-700",
        textColor: "text-blue-700",
      },
      {
        label: "Obligatoires",
        value: stats.obligatory,
        icon: Shield,
        gradient: "from-purple-50 to-purple-100",
        border: "border-purple-200",
        iconBg: "bg-purple-200",
        iconColor: "text-purple-700",
        textColor: "text-purple-700",
      },
      {
        label: "Optionnelles",
        value: stats.optional,
        icon: Star,
        gradient: "from-green-50 to-green-100",
        border: "border-green-200",
        iconBg: "bg-green-200",
        iconColor: "text-green-700",
        textColor: "text-green-700",
      },
      {
        label: "Moy. crédits",
        value: stats.averageCredits,
        icon: BarChart3,
        gradient: "from-amber-50 to-amber-100",
        border: "border-amber-200",
        iconBg: "bg-amber-200",
        iconColor: "text-amber-700",
        textColor: "text-amber-700",
      },
    ].map((stat) => (
      <Card
        key={stat.label}
        className={cn("bg-gradient-to-br", stat.gradient, stat.border)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={cn("text-sm font-medium", stat.textColor)}>
                {stat.label}
              </p>
              <p className={cn("text-2xl font-bold", stat.textColor)}>
                {stat.value}
              </p>
            </div>
            <div className={cn("p-3 rounded-full", stat.iconBg)}>
              <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Composant de carte UE séparé
const UECard = ({
  ue,
  onEdit,
  onDelete,
  allUEs,
}: {
  ue: UE;
  onEdit: (ue: UE) => void;
  onDelete: (id: string) => void;
  allUEs: UE[];
}) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-3 rounded-xl",
                ue.type === "Obligatoire"
                  ? "bg-gradient-to-br from-blue-500 to-purple-600"
                  : "bg-gradient-to-br from-green-500 to-teal-600"
              )}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <Badge
                variant={ue.type === "Obligatoire" ? "default" : "secondary"}
                className="mb-1"
              >
                {ue.type}
              </Badge>
              <h3 className="font-bold text-lg">{ue.code}</h3>
              <p className="text-sm text-muted-foreground">{ue.title}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(ue)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(ue.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {ue.description || "Aucune description disponible"}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span>{ue.credits} crédits</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <span>Seuil: {ue.passingGrade}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" />
            <span>{ue.prerequisites?.length || 0} prérequis</span>
          </div>
        </div>

        {ue.prerequisites && ue.prerequisites.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs font-medium mb-2 block">Prérequis</Label>
            <div className="flex flex-wrap gap-1">
              {ue.prerequisites.map((prereq) => {
                const prereqUE = allUEs.find(
                  (u) => u.id === prereq.prerequisiteId
                );
                return prereqUE ? (
                  <Badge key={prereq.id} variant="outline" className="text-xs">
                    {prereqUE.code}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge
            variant={ue.inCatalog ? "default" : "secondary"}
            className="text-xs"
          >
            {ue.inCatalog ? "📚 Au catalogue" : "📝 Brouillon"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => onEdit(ue)}>
            <Edit className="h-3 w-3 mr-1" />
            Modifier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant de tableau UE séparé
const UETable = ({
  ues,
  onEdit,
  onDelete,
  allUEs,
}: {
  ues: UE[];
  onEdit: (ue: UE) => void;
  onDelete: (id: string) => void;
  allUEs: UE[];
}) => (
  <div className="border rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Code</TableHead>
          <TableHead>Intitulé</TableHead>
          <TableHead className="text-center">Type</TableHead>
          <TableHead className="text-center">Crédits</TableHead>
          <TableHead className="text-center">Seuil</TableHead>
          <TableHead className="text-center">Prérequis</TableHead>
          <TableHead className="text-center">Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ues.map((ue) => (
          <TableRow key={ue.id} className="hover:bg-muted/50">
            <TableCell className="font-mono font-semibold">{ue.code}</TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{ue.title}</div>
                {ue.description && (
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {ue.description}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge
                variant={ue.type === "Obligatoire" ? "default" : "secondary"}
              >
                {ue.type}
              </Badge>
            </TableCell>
            <TableCell className="text-center font-medium">
              {ue.credits}
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline">{ue.passingGrade}%</Badge>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                {ue.prerequisites && ue.prerequisites.length > 0 ? (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {ue.prerequisites.slice(0, 2).map((prereq) => {
                      const prereqUE = allUEs.find(
                        (u) => u.id === prereq.prerequisiteId
                      );
                      return prereqUE ? (
                        <Badge
                          key={prereq.id}
                          variant="outline"
                          className="text-xs"
                          title={prereqUE.title}
                        >
                          {prereqUE.code}
                        </Badge>
                      ) : null;
                    })}
                    {ue.prerequisites.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{ue.prerequisites.length - 2}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={ue.inCatalog ? "default" : "secondary"}>
                {ue.inCatalog ? "Catalogue" : "Brouillon"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(ue)}
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(ue.id)}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// Composant de pagination séparé
const PaginationControls = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4 border-t">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Éléments par page:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="h-8 rounded border px-2"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
        <span>
          {startIndex + 1}-{endIndex} sur {totalItems}
        </span>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 hidden sm:flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-8 w-8 p-0 text-xs"
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 hidden sm:flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Composant de formulaire UE séparé
const UEFormDialog = ({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  selectedUE,
  allUEs,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: UEFormData;
  onFormDataChange: (data: UEFormData) => void;
  onSubmit: () => void;
  selectedUE: UE | null;
  allUEs: UE[];
  onReset: () => void;
}) => {
  const handleFieldChange = useCallback(
    (field: keyof UEFormData, value: any) => {
      onFormDataChange({ ...formData, [field]: value });
    },
    [formData, onFormDataChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {selectedUE ? "Modifier l'UE" : "Créer une nouvelle UE"}
          </DialogTitle>
          <DialogDescription>
            {selectedUE
              ? "Modifiez les détails de l'unité d'enseignement"
              : "Remplissez les informations pour créer une nouvelle unité d'enseignement"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code UE *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  handleFieldChange("code", e.target.value.toUpperCase())
                }
                placeholder="EX: INFO101"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Crédits ECTS *</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="30"
                value={formData.credits}
                onChange={(e) =>
                  handleFieldChange("credits", parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Intitulé du cours *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Ex: Algorithmique et programmation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Description détaillée du cours..."
              className="w-full min-h-[80px] p-2 border rounded-md resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passingGrade">Note de passage (%) *</Label>
              <Input
                id="passingGrade"
                type="number"
                min="0"
                max="100"
                value={formData.passingGrade}
                onChange={(e) =>
                  handleFieldChange(
                    "passingGrade",
                    parseInt(e.target.value) || 0
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Type d'UE *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    formData.type === "Obligatoire" ? "default" : "outline"
                  }
                  onClick={() => handleFieldChange("type", "Obligatoire")}
                  className="flex-1"
                >
                  Obligatoire
                </Button>
                <Button
                  type="button"
                  variant={
                    formData.type === "Optionnelle" ? "default" : "outline"
                  }
                  onClick={() => handleFieldChange("type", "Optionnelle")}
                  className="flex-1"
                >
                  Optionnelle
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prérequis</Label>

            <SimpleSelect
              options={allUEs.filter((u) => u.id !== selectedUE?.id)}
              selectedValues={formData.prerequisites}
              onSelect={(value) => {
                handleFieldChange("prerequisites", [
                  ...formData.prerequisites,
                  value,
                ]);
              }}
              onRemove={(value) => {
                handleFieldChange(
                  "prerequisites",
                  formData.prerequisites.filter((id) => id !== value)
                );
              }}
              placeholder="Sélectionner des prérequis..."

              // description="Sélectionnez les UEs qui doivent être validées avant de pouvoir suivre cette UE"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.inCatalog}
              onCheckedChange={(checked) =>
                handleFieldChange("inCatalog", checked)
              }
            />
            <Label htmlFor="catalog">Inclure dans le catalogue des cours</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onReset}>
              Annuler
            </Button>
            <Button onClick={onSubmit} className="gap-2">
              {selectedUE ? "💾 Modifier" : "✨ Créer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook personnalisé pour les statistiques
const useStats = (ues: UE[]) => {
  return useMemo(
    () => ({
      total: ues.length,
      obligatory: ues.filter((ue) => ue.type === "Obligatoire").length,
      optional: ues.filter((ue) => ue.type === "Optionnelle").length,
      inCatalog: ues.filter((ue) => ue.inCatalog).length,
      averageCredits:
        ues.length > 0
          ? Math.round(
              (ues.reduce((sum, ue) => sum + ue.credits, 0) / ues.length) * 10
            ) / 10
          : 0,
    }),
    [ues]
  );
};

// Hook personnalisé pour la gestion des UEs
const useUEManagement = () => {
  const {
    ues,
    fetchUEs,
    loading,
    error,
    createUE,
    updateUE,
    deleteUE,
    addPrerequisite,
    removePrerequisite,
  } = useUEStore();

  const { user, isAuthenticated } = useAuthStore();

  const safeUEs = useMemo(() => {
    if (!ues || !Array.isArray(ues)) return [];
    return ues.filter((ue) => ue && typeof ue === "object" && ue.id);
  }, [ues]);

  useEffect(() => {
    fetchUEs();
  }, [fetchUEs]);

  return {
    ues: safeUEs,
    loading,
    error,
    createUE,
    updateUE,
    deleteUE,
    addPrerequisite,
    removePrerequisite,
    user,
    isAuthenticated,
  };
};

export const CoursesManager = () => {
  const {
    ues,
    loading,
    error,
    createUE,
    updateUE,
    deleteUE,
    addPrerequisite,
    removePrerequisite,
    user,
    isAuthenticated,
  } = useUEManagement();

  // États
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUE, setSelectedUE] = useState<UE | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ueToDelete, setUeToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState<UEType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<UEFormData>({
    code: "",
    title: "",
    credits: 3,
    passingGrade: 70,
    type: "Obligatoire",
    prerequisites: [],
    createdById: "",
    facultyId: "",
    level: "",
    description: "",
    inCatalog: true,
  });

  // Initialisation de l'utilisateur
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setFormData((prev) => ({
        ...prev,
        createdById: user.id,
      }));
    }
  }, [isAuthenticated, user?.id]);

  // Statistiques
  const stats = useStats(ues);

  // Filtrage des UEs
  const filteredUEs = useMemo(() => {
    return ues.filter((ue) => {
      const matchesSearch =
        ue?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ue?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ue?.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || ue?.type === typeFilter;
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "catalog" && ue?.inCatalog) ||
        (activeTab === "draft" && !ue?.inCatalog);

      return matchesSearch && matchesType && matchesTab;
    });
  }, [ues, searchTerm, typeFilter, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredUEs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUEs = filteredUEs.slice(startIndex, startIndex + itemsPerPage);

  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, activeTab]);

  // Gestion du formulaire
  const resetForm = useCallback(() => {
    setIsFormOpen(false);
    setFormData({
      code: "",
      title: "",
      credits: 3,
      passingGrade: 70,
      type: "Obligatoire",
      prerequisites: [],
      createdById: user?.id || "",
      facultyId: "",
      level: "",
      description: "",
      inCatalog: true,
    });
    setSelectedUE(null);
  }, [user?.id]);

  const handleEdit = useCallback((ue: UE) => {
    setSelectedUE(ue);
    setFormData({
      code: ue.code,
      title: ue.title,
      credits: ue.credits,
      passingGrade: ue.passingGrade || 70,
      type: ue.type,
      prerequisites: ue.prerequisites.map((p) => p.prerequisiteId),
      createdById: ue.createdById,
      facultyId: ue.facultyId || "",
      level: ue.level || "",
      description: ue.description || "",
      inCatalog: ue.inCatalog ?? true,
    });
    setIsFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((ueId: string) => {
    setUeToDelete(ueId);
    setIsModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (ueToDelete) {
      try {
        await deleteUE(ueToDelete);
        toast({
          title: "🗑️ Suppression réussie",
          description: "L'UE a été supprimée avec succès",
        });
      } catch (error: any) {
        toast({
          title: "❌ Erreur",
          description: error.message || "Erreur lors de la suppression",
          variant: "destructive",
        });
      } finally {
        setIsModalOpen(false);
        setUeToDelete(null);
      }
    }
  }, [ueToDelete, deleteUE]);
  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour créer une UE",
        variant: "destructive",
      });
      return;
    }

    if (!formData.code || !formData.title || formData.credits <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedUE) {
        // Pour la mise à jour
        await updateUE(selectedUE.id, {
          code: formData.code,
          title: formData.title,
          credits: formData.credits,
          passingGrade: formData.passingGrade,
          type: formData.type,
          description: formData.description,
          inCatalog: formData.inCatalog,
          prerequisites: formData.prerequisites, // ← string[]
        });

        // Gestion des prérequis (logique existante)
        const currentPrereqIds = selectedUE.prerequisites.map(
          (p) => p.prerequisiteId
        );
        const newPrereqIds = formData.prerequisites;

        for (const prereqId of newPrereqIds) {
          if (!currentPrereqIds.includes(prereqId)) {
            await addPrerequisite(selectedUE.id, prereqId);
          }
        }

        for (const prereqId of currentPrereqIds) {
          if (!newPrereqIds.includes(prereqId)) {
            await removePrerequisite(selectedUE.id, prereqId);
          }
        }

        toast({
          title: "✅ UE mise à jour",
          description: `L'UE ${formData.code} a été modifiée avec succès`,
        });
      } else {
        // Pour la création - utiliser le bon type
        await createUE({
          code: formData.code,
          title: formData.title,
          credits: formData.credits,
          passingGrade: formData.passingGrade,
          type: formData.type,
          description: formData.description,
          inCatalog: formData.inCatalog,
          createdById: user.id,
          prerequisites: formData.prerequisites, // ← string[]
          facultyId: formData.facultyId,
          level: formData.level,
        });

        toast({
          title: "🎉 UE créée",
          description: `L'UE ${formData.code} a été ajoutée avec succès`,
        });
      }

      resetForm();
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  }, [
    formData,
    selectedUE,
    user?.id,
    updateUE,
    createUE,
    addPrerequisite,
    removePrerequisite,
    resetForm,
  ]);

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-lg max-w-md mx-auto">
          <p className="text-destructive font-medium">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-3"
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <StatsCards stats={stats} />

      {/* Carte principale */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <BookOpen className="h-6 w-6 text-primary" />
                Gestion des Unités d'Enseignement
              </CardTitle>
              <CardDescription>
                Créez et gérez le catalogue des cours de l'établissement
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setIsFormOpen(true)}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle UE
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtres et recherche */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, titre ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="catalog">Catalogue</TabsTrigger>
                  <TabsTrigger value="draft">Brouillons</TabsTrigger>
                </TabsList>
              </Tabs>

              <Tabs
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as any)}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">Types</TabsTrigger>
                  <TabsTrigger value="Obligatoire">Oblig.</TabsTrigger>
                  <TabsTrigger value="Optionnelle">Opt.</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                title="Vue grille"
              >
                <Grid className="h-4 w-4" />
              </Button>

              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                title="Vue tableau"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Résultats */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredUEs.length} UE{filteredUEs.length !== 1 ? "s" : ""}{" "}
              trouvée{filteredUEs.length !== 1 ? "s" : ""}
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </div>
            )}
          </div>

          {/* Contenu */}
          {filteredUEs.length > 0 ? (
            <div key={viewMode}>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                  {paginatedUEs.map((ue) => (
                    <UECard
                      key={ue.id}
                      ue={ue}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      allUEs={ues}
                    />
                  ))}
                </div>
              ) : (
                <UETable
                  ues={paginatedUEs}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  allUEs={ues}
                />
              )}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filteredUEs.length}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                Aucune UE trouvée
              </h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || typeFilter !== "all" || activeTab !== "all"
                  ? "Aucun résultat ne correspond à vos critères de recherche."
                  : "Commencez par créer votre première unité d'enseignement."}
              </p>
              {!searchTerm && typeFilter === "all" && activeTab === "all" && (
                <Button onClick={() => setIsFormOpen(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une UE
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <UEFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        selectedUE={selectedUE}
        allUEs={ues}
        onReset={resetForm}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette UE ? Cette action est irréversible et affectera tous les étudiants inscrits à ce cours."
        confirmLabel="Supprimer définitivement"
        cancelLabel="Annuler"
      />
    </div>
  );
};
