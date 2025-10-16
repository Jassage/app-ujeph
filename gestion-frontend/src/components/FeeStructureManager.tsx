import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFeeStructureStore } from "@/store/feeStructureStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { AcademicYear, FeeStructure } from "@/types/academic";
import {
  Plus,
  Save,
  Edit,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Download,
  MoreVertical,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useFacultyStore } from "@/store/facultyStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface FeeFormData {
  academicYear: string;
  name: string;
  faculty: string;
  level: string;
  tuitionFee: number;
  tshirtFee: number;
  cardIdFee: number;
  isActive: boolean;
}

export const FeeStructureManager: React.FC = () => {
  const {
    feeStructures,
    createFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
    getFeeStructures,
    loading,
  } = useFeeStructureStore();

  const { academicYears, fetchAcademicYears } = useAcademicYearStore();
  const { faculties, fetchFaculties } = useFacultyStore();

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [feeToDelete, setFeeToDelete] = useState<FeeStructure | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [formData, setFormData] = useState<FeeFormData>({
    academicYear: "",
    name: "",
    faculty: "",
    level: "",
    tuitionFee: 0,
    tshirtFee: 0,
    cardIdFee: 0,
    isActive: true,
  });

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchAcademicYears(),
          fetchFaculties(),
          getFeeStructures(),
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error("Erreur lors du chargement des données");
      }
    };
    loadData();
  }, []);

  // Mise à jour du formulaire lors de l'édition
  useEffect(() => {
    if (editingFee) {
      setFormData({
        academicYear: editingFee.academicYear,
        name: editingFee.name,
        faculty: editingFee.faculty,
        level: editingFee.level,
        tuitionFee: (editingFee as any).tuitionFee ?? 0,
        tshirtFee: (editingFee as any).tshirtFee ?? 0,
        cardIdFee: (editingFee as any).cardIdFee ?? 0,
        isActive: editingFee.isActive,
      });
    }
  }, [editingFee]);

  // Validation du formulaire
  const validateForm = useCallback((): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (!formData.name?.trim()) errors.push("Le nom est obligatoire");
    if (!formData.academicYear)
      errors.push("L'année académique est obligatoire");
    if (!formData.faculty) errors.push("La faculté est obligatoire");
    if (!formData.level) errors.push("Le niveau est obligatoire");
    if (formData.tuitionFee < 0)
      errors.push("Les frais de scolarité doivent être positifs");
    if (formData.tshirtFee < 0)
      errors.push("Les frais de maillot doivent être positifs");
    if (formData.cardIdFee < 0)
      errors.push("Les frais de badge doivent être positifs");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [formData]);

  // Calcul du total
  const calculateTotal = useCallback((): number => {
    return formData.tuitionFee + formData.tshirtFee + formData.cardIdFee;
  }, [formData.tuitionFee, formData.tshirtFee, formData.cardIdFee]);

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const validation = validateForm();
      if (!validation.isValid) {
        setError(validation.errors.join(", "));
        toast.error(validation.errors.join("\n"));
        return;
      }

      const feeData = {
        name: formData.name.trim(),
        academicYear: formData.academicYear,
        faculty: formData.faculty,
        level: formData.level,
        amount: calculateTotal(),
        isActive: formData.isActive,
      };

      if (editingFee) {
        await updateFeeStructure(editingFee.id, feeData);
        toast.success("Structure de frais modifiée avec succès!");
      } else {
        await createFeeStructure(feeData);
        toast.success("Structure de frais créée avec succès!");
      }

      setIsFormOpen(false);
      resetForm();
      // Recharger les données après un court délai
      setTimeout(() => getFeeStructures(), 300);
    } catch (error: any) {
      console.error("Erreur détaillée:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Erreur lors de l'opération";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Édition d'une structure
  const handleEdit = (fee: FeeStructure): void => {
    setEditingFee(fee);
    setIsFormOpen(true);
    setError(null);
  };

  // Demande de suppression
  const handleDeleteClick = (fee: FeeStructure): void => {
    setFeeToDelete(fee);
    setIsDeleteDialogOpen(true);
  };

  // Confirmation de suppression
  const confirmDelete = async (): Promise<void> => {
    if (feeToDelete) {
      setIsDeleting(true);
      try {
        await deleteFeeStructure(feeToDelete.id);
        toast.success("Structure de frais supprimée avec succès!");
        setIsDeleteDialogOpen(false);
        setFeeToDelete(null);
        getFeeStructures();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la suppression");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Réinitialisation du formulaire
  const resetForm = (): void => {
    setFormData({
      academicYear: "",
      name: "",
      faculty: "",
      level: "",
      tuitionFee: 0,
      tshirtFee: 0,
      cardIdFee: 0,
      isActive: true,
    });
    setEditingFee(null);
    setError(null);
  };

  // Gestion des changements de champs
  const handleInputChange = (
    field: keyof FeeFormData,
    value: string | number | boolean
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Filtrage des structures
  const filteredFeeStructures = useMemo(() => {
    return feeStructures.filter((fee) => {
      const matchesSearch =
        fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.faculty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFaculty =
        selectedFaculty === "all" || fee.faculty === selectedFaculty;
      const matchesYear =
        selectedYear === "all" || fee.academicYear === selectedYear;

      return matchesSearch && matchesFaculty && matchesYear;
    });
  }, [feeStructures, searchTerm, selectedFaculty, selectedYear]);

  // Statistiques
  const statistics = useMemo(
    () => ({
      total: feeStructures.length,
      active: feeStructures.filter((f) => f.isActive).length,
      faculties: new Set(feeStructures.map((f) => f.faculty)).size,
      average:
        feeStructures.length > 0
          ? Math.round(
              feeStructures.reduce((sum, f) => sum + f.amount, 0) /
                feeStructures.length
            )
          : 0,
    }),
    [feeStructures]
  );

  // Fonctions d'affichage
  const getAcademicYearDisplay = useCallback(
    (yearId: string): string => {
      const year = academicYears.find((y) => y.id === yearId);
      return year ? year.year : yearId;
    },
    [academicYears]
  );

  const getFacultyName = useCallback(
    (facultyId: string): string => {
      const faculty = faculties.find((f) => f.id === facultyId);
      return faculty ? faculty.name : facultyId;
    },
    [faculties]
  );

  const getLevelDisplay = useCallback((level: string): string => {
    const levels: { [key: string]: string } = {
      "1": "1ère Année",
      "2": "2ème Année",
      "3": "3ème Année",
      "4": "4ème Année",
      "5": "5ème Année",
    };
    return levels[level] || level;
  }, []);

  // Rechargement des données
  const handleRefresh = async (): Promise<void> => {
    try {
      await Promise.all([
        fetchAcademicYears(),
        fetchFaculties(),
        getFeeStructures(),
      ]);
      toast.success("Données actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    }
  };

  // Réinitialisation des filtres
  const resetFilters = useCallback((): void => {
    setSearchTerm("");
    setSelectedFaculty("all");
    setSelectedYear("all");
  }, []);

  // Composant pour les données vides
  const NoDataMessage = useCallback(
    () => (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-lg font-medium dark:text-gray-300">
          {searchTerm || selectedFaculty !== "all" || selectedYear !== "all"
            ? "Aucun résultat trouvé"
            : "Aucune structure de frais"}
        </p>
        <p className="text-sm mb-4 dark:text-gray-400">
          {searchTerm || selectedFaculty !== "all" || selectedYear !== "all"
            ? "Essayez de modifier vos critères de recherche"
            : "Commencez par créer votre première structure de frais"}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {(searchTerm ||
            selectedFaculty !== "all" ||
            selectedYear !== "all") && (
            <Button variant="outline" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une Structure
          </Button>
        </div>
      </div>
    ),
    [searchTerm, selectedFaculty, selectedYear, resetFilters]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">
            Gestion des Frais
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Configurez et gérez les structures de frais académiques
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
            aria-label="Créer une nouvelle structure de frais"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Nouvelle Structure
          </Button>
        </div>
      </div>

      {/* Filtres et contrôles */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher une structure..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={selectedFaculty}
                  onValueChange={setSelectedFaculty}
                >
                  <SelectTrigger className="w-full sm:w-[160px] dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Faculté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes facultés</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-[160px] dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes années</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filtres</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Structures
                </p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Structures Actives
                </p>
                <p className="text-2xl font-bold">{statistics.active}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Facultés
                </p>
                <p className="text-2xl font-bold">{statistics.faculties}</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Filter className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Frais Moyen
                </p>
                <p className="text-2xl font-bold">
                  {statistics.average.toLocaleString()} HTG
                </p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Save className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      {viewMode === "table" ? (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">
              Structures de Frais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-muted/20">
                    <TableHead className="min-w-[150px]">Nom</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Faculté
                    </TableHead>
                    <TableHead className="min-w-[100px]">Niveau</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Année
                    </TableHead>
                    <TableHead className="min-w-[120px]">Montant</TableHead>
                    <TableHead className="min-w-[100px]">Statut</TableHead>
                    <TableHead className="text-right min-w-[80px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeeStructures.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{fee.name}</div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            {getFacultyName(fee.faculty)} •{" "}
                            {getLevelDisplay(fee.level)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getFacultyName(fee.faculty)}
                      </TableCell>
                      <TableCell>{getLevelDisplay(fee.level)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {getAcademicYearDisplay(fee.academicYear)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {fee.amount?.toLocaleString()} HTG
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={fee.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {fee.isActive ? "🟢 Actif" : "🔴 Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(fee)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(fee)}
                              className="text-red-600 focus:text-red-600"
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

            {filteredFeeStructures.length === 0 && <NoDataMessage />}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredFeeStructures.map((fee) => (
            <Card
              key={fee.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-800"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="text-base sm:text-lg truncate"
                    title={fee.name}
                  >
                    {fee.name}
                  </CardTitle>
                  <Badge
                    variant={fee.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {fee.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {getFacultyName(fee.faculty)} • {getLevelDisplay(fee.level)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Année:
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs"
                    >
                      {getAcademicYearDisplay(fee.academicYear)}
                    </Badge>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 sm:p-4 rounded-lg">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {fee.amount?.toLocaleString()} HTG
                      </p>
                      <p className="text-xs sm:text-sm text-purple-500 dark:text-purple-300">
                        Total des frais
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(fee)}
                      className="flex-1 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(fee)}
                      className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredFeeStructures.length === 0 && <NoDataMessage />}
        </div>
      )}

      {/* Modal de formulaire */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingFee ? (
                <>
                  <Edit className="h-5 w-5" />
                  Modifier la Structure
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Nouvelle Structure
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingFee
                ? "Modifiez les informations de la structure de frais"
                : "Créez une nouvelle structure de frais académiques"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
              role="alert"
              aria-live="polite"
            >
              <strong className="font-medium">Erreur: </strong>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la Structure *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="ex: Frais Licence 1 Informatique"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Année Académique *</Label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(value) =>
                    handleInputChange("academicYear", value)
                  }
                  required
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Sélectionner une année" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faculty">Faculté *</Label>
                <Select
                  value={formData.faculty}
                  onValueChange={(value) => handleInputChange("faculty", value)}
                  required
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Sélectionner une faculté" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Niveau *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleInputChange("level", value)}
                  required
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1ère Année</SelectItem>
                    <SelectItem value="2">2ème Année</SelectItem>
                    <SelectItem value="3">3ème Année</SelectItem>
                    <SelectItem value="4">4ème Année</SelectItem>
                    <SelectItem value="5">5ème Année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tuitionFee">Frais de Scolarité (HTG) *</Label>
                <Input
                  id="tuitionFee"
                  type="number"
                  value={formData.tuitionFee}
                  onChange={(e) =>
                    handleInputChange("tuitionFee", Number(e.target.value))
                  }
                  required
                  min="0"
                  step="100"
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tshirtFee">Frais Maillot (HTG)</Label>
                <Input
                  id="tshirtFee"
                  type="number"
                  value={formData.tshirtFee}
                  onChange={(e) =>
                    handleInputChange("tshirtFee", Number(e.target.value))
                  }
                  min="0"
                  step="100"
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardIdFee">Frais Badge (HTG)</Label>
                <Input
                  id="cardIdFee"
                  type="number"
                  value={formData.cardIdFee}
                  onChange={(e) =>
                    handleInputChange("cardIdFee", Number(e.target.value))
                  }
                  min="0"
                  step="100"
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg dark:bg-gray-700">
                  <Switch
                    id="status"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleInputChange("isActive", checked)
                    }
                  />
                  <Label htmlFor="status" className="cursor-pointer">
                    {formData.isActive ? "Activée" : "Désactivée"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 sm:p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-semibold dark:text-gray-200">
                    Total des Frais
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Montant qui sera enregistré
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {calculateTotal().toLocaleString()} HTG
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto"
                aria-busy={isSubmitting || loading}
              >
                <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                {isSubmitting || loading
                  ? "Traitement..."
                  : editingFee
                  ? "Modifier"
                  : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la structure de frais "
              {feeToDelete?.name}" ? Cette action est irréversible et affectera
              tous les étudiants associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
