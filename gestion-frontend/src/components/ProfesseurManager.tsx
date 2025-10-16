// ProfesseurManager.tsx - VERSION COMPLÈTEMENT CORRIGÉE
import { useState, useEffect, useMemo } from "react"; // AJOUT: useMemo
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
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Filter,
  Calendar,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  UserPlus,
  Shield,
  Moon,
  Sun,
  Laptop,
  FileUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useProfessorStore } from "../store/professorStore";
import { Professeur } from "../types/academic";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { ProfessorDetails } from "./professorDetails";
import { useTheme } from "next-themes";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const ProfesseurManager = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const {
    professors,
    assignments,
    loading,
    error,
    fetchProfessors,
    fetchProfessorAssignments,
    addProfessor,
    updateProfessor,
    deleteProfessor,
    bulkUpdateStatus,
    bulkImportProfessors,
    clearError,
  } = useProfessorStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProfessor, setSelectedProfessor] = useState<Professeur | null>(
    null
  );
  const [isProfessorFormOpen, setIsProfessorFormOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    speciality: "",
    status: "Actif" as "Actif" | "Inactif",
  });
  const [selectedProfessors, setSelectedProfessors] = useState<Set<string>>(
    new Set()
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Professeur;
    direction: "asc" | "desc";
  }>({ key: "lastName", direction: "asc" });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: any[];
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  useEffect(() => {
    if (selectedProfessor && viewMode === "details") {
      fetchProfessorAssignments(selectedProfessor.id);
    }
  }, [selectedProfessor, fetchProfessorAssignments, viewMode]);

  // CORRECTION: Fonction de filtrage SÉCURISÉE avec useMemo
  const filteredProfessors = useMemo(() => {
    console.log("🔄 Filtrage des professeurs...");

    // CORRECTION CRITIQUE: S'assurer que professors est toujours un tableau
    const professorsArray = Array.isArray(professors) ? professors : [];
    console.log(`📊 ${professorsArray.length} professeurs à filtrer`);

    const filtered = professorsArray
      .filter((professor) => {
        // Validation de chaque professeur
        if (!professor || typeof professor !== "object") {
          console.warn("❌ Professeur invalide filtré:", professor);
          return false;
        }

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (professor.firstName?.toLowerCase() || "").includes(searchLower) ||
          (professor.lastName?.toLowerCase() || "").includes(searchLower) ||
          (professor.email?.toLowerCase() || "").includes(searchLower);

        const matchesStatus =
          statusFilter === "all" || professor.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });

    console.log(`✅ ${filtered.length} professeurs après filtrage`);
    return filtered;
  }, [professors, searchTerm, statusFilter, sortConfig]);

  // CORRECTION: Calculs statistiques SÉCURISÉS
  const statistics = useMemo(() => {
    const professorsArray = Array.isArray(professors) ? professors : [];

    return {
      total: professorsArray.length,
      active: professorsArray.filter((p) => p?.status === "Actif").length,
      inactive: professorsArray.filter((p) => p?.status === "Inactif").length,
      assignments: Array.isArray(assignments) ? assignments.length : 0,
    };
  }, [professors, assignments]);

  const handleSubmitProfessor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedProfessor) {
        await updateProfessor(selectedProfessor.id, formData);
        toast({
          title: "✅ Succès",
          description: "Professeur modifié avec succès",
        });
      } else {
        await addProfessor(formData);
        toast({
          title: "✅ Succès",
          description: "Professeur ajouté avec succès",
        });
      }
      setIsProfessorFormOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      speciality: "",
      status: "Actif",
    });
    setSelectedProfessor(null);
  };

  const handleEdit = (professor: Professeur) => {
    setSelectedProfessor(professor);
    setFormData({
      firstName: professor.firstName,
      lastName: professor.lastName,
      email: professor.email,
      phone: professor.phone || "",
      speciality: professor.speciality || "",
      status: professor.status,
    });
    setIsProfessorFormOpen(true);
  };

  const handleViewDetails = (professor: Professeur) => {
    setSelectedProfessor(professor);
    setViewMode("details");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedProfessor(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce professeur ?")) {
      try {
        await deleteProfessor(id);
        toast({
          title: "✅ Succès",
          description: "Professeur supprimé avec succès",
        });
        if (viewMode === "details") {
          handleBackToList();
        }
      } catch (error: any) {
        console.error("Erreur:", error);
        toast({
          title: "❌ Erreur",
          description: error.message || "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
    }
  };

  const handleBulkStatusChange = async (status: "Actif" | "Inactif") => {
    if (selectedProfessors.size === 0) {
      toast({
        title: "⚠️ Attention",
        description: "Veuillez sélectionner au moins un professeur",
        variant: "destructive",
      });
      return;
    }

    try {
      await bulkUpdateStatus(Array.from(selectedProfessors), status);
      toast({
        title: "✅ Succès",
        description: `Statut de ${selectedProfessors.size} professeur(s) modifié(s)`,
      });
      setSelectedProfessors(new Set());
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({
        title: "❌ Erreur",
        description: error.message || "Erreur lors de la modification",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (
      selectedProfessors.size === filteredProfessors.length &&
      filteredProfessors.length > 0
    ) {
      setSelectedProfessors(new Set());
    } else {
      setSelectedProfessors(new Set(filteredProfessors.map((prof) => prof.id)));
    }
  };

  const handleSelectProfessor = (id: string) => {
    const newSelected = new Set(selectedProfessors);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProfessors(newSelected);
  };

  const handleSort = (key: keyof Professeur) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive",
      });
      return;
    }

    setImportLoading(true);
    setImportResults(null);

    try {
      const data = await readExcelFile(importFile);
      const professorsToImport = data.map((row: any) => ({
        firstName: row.Prénom || row.firstName || "",
        lastName: row.Nom || row.lastName || "",
        email: row.Email || row.email || "",
        phone: row.Téléphone || row.phone || "",
        speciality: row.Spécialité || row.speciality || "",
        status: (row.Statut || row.status || "Actif") as "Actif" | "Inactif",
      }));

      const result = await bulkImportProfessors(professorsToImport);
      setImportResults(result);

      if (result.errors.length === 0) {
        toast({
          title: "✅ Import réussi",
          description: `${result.success} professeur(s) importé(s) avec succès`,
        });
        setIsImportDialogOpen(false);
        setImportFile(null);
      } else {
        toast({
          title: "⚠️ Import partiel",
          description: `${result.success} importé(s), ${result.errors.length} erreur(s)`,
          variant: result.success > 0 ? "default" : "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erreur import:", error);
      toast({
        title: "❌ Erreur d'import",
        description: error.message || "Erreur lors de l'import",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error("Format de fichier invalide"));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        Prénom: "Jean",
        Nom: "Dupont",
        Email: "jean.dupont@email.com",
        Téléphone: "+33 1 23 45 67 89",
        Spécialité: "Informatique",
        Statut: "Actif",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "template-import-professeurs.xlsx");

    toast({
      title: "📥 Template téléchargé",
      description: "Le template d'import a été téléchargé",
    });
  };

  const exportToExcel = () => {
    const data = filteredProfessors.map((professor) => ({
      ID: professor.id,
      Prénom: professor.firstName,
      Nom: professor.lastName,
      Email: professor.email,
      Téléphone: professor.phone || "",
      Spécialité: professor.speciality || "",
      Statut: professor.status,
      "Date de création": professor.createdAt
        ? new Date(professor.createdAt).toLocaleDateString()
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Professeurs");
    XLSX.writeFile(
      workbook,
      `professeurs-${new Date().toISOString().split("T")[0]}.xlsx`
    );

    toast({
      title: "📤 Export réussi",
      description: `${filteredProfessors.length} professeur(s) exporté(s)`,
    });
  };

  const cardClassName = "border-0 shadow-lg bg-card";
  const statCardClassName = "border-0 shadow-md bg-gradient-to-br";

  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Affichage des détails du professeur
  if (viewMode === "details" && selectedProfessor) {
    return (
      <div className="space-y-6">
        <ProfessorDetails
          professor={selectedProfessor}
          onClose={handleBackToList}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <Dialog
          open={isProfessorFormOpen}
          onOpenChange={setIsProfessorFormOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedProfessor
                  ? "Modifier le Professeur"
                  : "Ajouter un Professeur"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitProfessor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spécialité</Label>
                  <Input
                    value={formData.speciality}
                    onChange={(e) =>
                      setFormData({ ...formData, speciality: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as "Actif" | "Inactif",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProfessorFormOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {selectedProfessor ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span>Chargement des professeurs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Button
            onClick={() => {
              clearError();
              fetchProfessors();
            }}
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Gestion des Professeurs
          </h1>
          <p className="text-muted-foreground">
            Administration des professeurs et de leurs affectations
          </p>
        </div>

        <div className="flex gap-2">
          {/* Sélecteur de thème */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Changer le thème</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="h-4 w-4 mr-2" />
                Clair
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="h-4 w-4 mr-2" />
                Sombre
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Laptop className="h-4 w-4 mr-2" />
                Système
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>

          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>

          <Dialog
            open={isProfessorFormOpen}
            onOpenChange={setIsProfessorFormOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Professeur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedProfessor
                    ? "Modifier le Professeur"
                    : "Ajouter un Professeur"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitProfessor} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prénom *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Spécialité</Label>
                    <Input
                      value={formData.speciality}
                      onChange={(e) =>
                        setFormData({ ...formData, speciality: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as "Actif" | "Inactif",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProfessorFormOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {selectedProfessor ? "Modifier" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques - CORRIGÉ avec données sécurisées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={cn(
            statCardClassName,
            "from-blue-50 to-blue-100 border-blue-200",
            "dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {statistics.total}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-200 dark:bg-blue-800">
                <User className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            statCardClassName,
            "from-green-50 to-green-100 border-green-200",
            "dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Actifs
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {statistics.active}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-200 dark:bg-green-800">
                <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            statCardClassName,
            "from-gray-50 to-gray-100 border-gray-200",
            "dark:from-gray-800 dark:to-gray-900 dark:border-gray-700"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Inactifs
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {statistics.inactive}
                </p>
              </div>
              <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
                <XCircle className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            statCardClassName,
            "from-purple-50 to-purple-100 border-purple-200",
            "dark:from-purple-950/20 dark:to-purple-900/20 dark:border-purple-800"
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Affectations
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {statistics.assignments}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-200 dark:bg-purple-800">
                <Shield className="h-6 w-6 text-purple-700 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters and Search */}
      <Card className={cardClassName}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un professeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="Actif">Actifs</SelectItem>
                  <SelectItem value="Inactif">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedProfessors.size > 0 && (
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange("Actif")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Activer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange("Inactif")}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Désactiver
                </Button>
                <Badge variant="secondary" className="ml-2">
                  {selectedProfessors.size} sélectionné(s)
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professors Table */}
      <Card className={cardClassName}>
        <CardHeader>
          <CardTitle>Liste des professeurs</CardTitle>
          <CardDescription>
            {filteredProfessors.length} professeur(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedProfessors.size === filteredProfessors.length &&
                        filteredProfessors.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("lastName")}
                  >
                    <div className="flex items-center gap-1">
                      Nom
                      {sortConfig.key === "lastName" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("firstName")}
                  >
                    <div className="flex items-center gap-1">
                      Prénom
                      {sortConfig.key === "firstName" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Statut
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessors.map((professor) => (
                  <TableRow
                    key={professor.id}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedProfessors.has(professor.id)}
                        onCheckedChange={() =>
                          handleSelectProfessor(professor.id)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {professor.lastName}
                    </TableCell>
                    <TableCell>{professor.firstName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">
                          {professor.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {professor.phone || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {professor.speciality || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          professor.status === "Actif" ? "default" : "secondary"
                        }
                        className={cn(
                          professor.status === "Actif"
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                            : "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                        )}
                      >
                        {professor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(professor)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(professor)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(professor.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProfessors.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg mt-4">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun professeur trouvé</p>
              {searchTerm || statusFilter !== "all" ? (
                <p className="text-sm mt-2">
                  Essayez de modifier vos critères de recherche
                </p>
              ) : (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsProfessorFormOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter le premier professeur
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'import */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Importer des professeurs
            </DialogTitle>
            <DialogDescription>
              Importez un fichier Excel contenant la liste des professeurs
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {importFile
                    ? importFile.name
                    : "Glissez-déposez un fichier Excel ou cliquez pour parcourir"}
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-file"
                />
                <Label htmlFor="import-file">
                  <Button variant="outline" asChild>
                    <span>Choisir un fichier</span>
                  </Button>
                </Label>
              </div>

              {importResults && importResults.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {importResults.errors.length} erreur(s) lors de l'import
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Format attendu:</Label>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    • Colonnes: Prénom, Nom, Email, Téléphone, Spécialité,
                    Statut
                  </p>
                  <p>• Formats supportés: .xlsx, .xls</p>
                  <p>• Taille maximale: 10MB</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Structure du fichier:</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Prénom:</strong> Prénom du professeur (requis)
                  </p>
                  <p>
                    <strong>Nom:</strong> Nom du professeur (requis)
                  </p>
                  <p>
                    <strong>Email:</strong> Adresse email (requis, unique)
                  </p>
                  <p>
                    <strong>Téléphone:</strong> Numéro de téléphone (optionnel)
                  </p>
                  <p>
                    <strong>Spécialité:</strong> Domaine d'expertise (optionnel)
                  </p>
                  <p>
                    <strong>Statut:</strong> "Actif" ou "Inactif" (défaut:
                    "Actif")
                  </p>
                </div>
              </div>

              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le template
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportFile(null);
                setImportResults(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importLoading}
            >
              {importLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
