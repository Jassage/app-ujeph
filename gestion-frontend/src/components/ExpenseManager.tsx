import React, { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useExpenseStore } from "@/store/expenseStore";
import { Expense } from "@/types/academic";
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
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseFormData {
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
  status: "Pending" | "Approved" | "Rejected";
}

interface DateRange {
  from: string;
  to: string;
}

// Composant Pagination
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {currentPage} sur {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Composant DateRangeFilter
const DateRangeFilter: React.FC<{
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}> = ({ dateRange, onChange }) => {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-background">
      <Label className="text-sm font-medium">Période</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="dateFrom" className="text-xs">
            Du
          </Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateRange.from}
            onChange={(e) => onChange({ ...dateRange, from: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateTo" className="text-xs">
            Au
          </Label>
          <Input
            id="dateTo"
            type="date"
            value={dateRange.to}
            onChange={(e) => onChange({ ...dateRange, to: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export const ExpenseManager: React.FC = () => {
  // États modaux
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // États filtres
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Store
  const {
    expenses,
    loading,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenseStore();
  const { user } = useAuthStore();

  // Form data
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: "",
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Espèces",
    status: "Pending",
  });

  // Données statiques
  const categories = [
    "Salaires",
    "Équipement",
    "Maintenance",
    "Fournitures",
    "Services",
    "Loyer",
    "Utilities",
    "Autre",
  ];
  const paymentMethods = ["Espèces", "Virement", "Carte", "Chèque"];

  // Chargement initial - UNIQUEMENT au mount
  useEffect(() => {
    fetchExpenses();
  }, []); // Empty dependency array

  // Filtrage des données
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchSearch =
        !search ||
        expense.category?.toLowerCase().includes(search.toLowerCase()) ||
        expense.description?.toLowerCase().includes(search.toLowerCase());

      const matchCategory = category === "all" || expense.category === category;
      const matchStatus = status === "all" || expense.status === status;

      const matchDate =
        (!dateRange.from || expense.date >= dateRange.from) &&
        (!dateRange.to || expense.date <= dateRange.to);

      return matchSearch && matchCategory && matchStatus && matchDate;
    });
  }, [expenses, search, category, status, dateRange]);

  // Pagination
  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [search, category, status, dateRange, pageSize]);

  // Handlers MODAUX - SIMPLES et DIRECTS
  const handleAddClick = () => {
    setFormData({
      category: "",
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Espèces",
      status: "Pending",
    });
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (expense: Expense) => {
    setFormData({
      category: expense.category || "",
      amount: expense.amount || 0,
      description: expense.description || "",
      date: expense.date
        ? expense.date.split("T")[0]
        : new Date().toISOString().split("T")[0],
      paymentMethod: expense.paymentMethod || "Espèces",
      status: (expense.status ?? "Pending") as
        | "Pending"
        | "Approved"
        | "Rejected",
    });
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setDeletingExpense(expense);
    setIsDeleteOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Non authentifié", variant: "destructive" });
      return;
    }

    try {
      const expenseData = {
        ...formData,
        createdBy: user.id,
        amount: Number(formData.amount),
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        toast({ title: "Dépense modifiée" });
      } else {
        await addExpense(expenseData);
        toast({ title: "Dépense ajoutée" });
      }

      setIsFormOpen(false);
      setEditingExpense(null);
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;

    try {
      await deleteExpense(deletingExpense.id);
      toast({ title: "Dépense supprimée" });
      setIsDeleteOpen(false);
      setDeletingExpense(null);
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  // État de chargement
  if (loading && expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Dépenses
          </h1>
          <p className="text-muted-foreground">
            Gérez et suivez toutes les dépenses de l'établissement
          </p>
        </div>
        <Button onClick={handleAddClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Dépense
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Pending">En attente</SelectItem>
                  <SelectItem value="Approved">Approuvé</SelectItem>
                  <SelectItem value="Rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Items par page</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtre par date */}
          <DateRangeFilter dateRange={dateRange} onChange={setDateRange} />

          <div className="text-sm text-muted-foreground">
            {filteredExpenses.length} dépenses trouvées
          </div>
        </CardContent>
      </Card>

      {/* Liste des dépenses */}
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune dépense trouvée
              </h3>
              <p className="text-muted-foreground mb-4">
                {search ||
                category !== "all" ||
                status !== "all" ||
                dateRange.from ||
                dateRange.to
                  ? "Aucune dépense ne correspond à vos critères de recherche."
                  : "Commencez par ajouter votre première dépense."}
              </p>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une dépense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedExpenses.map((expense) => (
                <Card
                  key={expense.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">
                            {expense.category}
                          </h4>
                          <Badge
                            className={
                              expense.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : expense.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm mb-3">
                      {expense.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <span>
                        {new Date(expense.date).toLocaleDateString("fr-FR")}
                      </span>
                      <span>{expense.paymentMethod}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-red-600">
                        {expense.amount.toLocaleString()} HTG
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditClick(expense)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(expense)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modal de formulaire */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Modifier la Dépense" : "Nouvelle Dépense"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Modifiez les informations de la dépense"
                : "Remplissez les informations pour ajouter une nouvelle dépense"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant (HTG) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Moyen de Paiement *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                  required
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Sélectionner un moyen" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as "Pending" | "Approved" | "Rejected",
                  })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">En attente</SelectItem>
                  <SelectItem value="Approved">Approuvé</SelectItem>
                  <SelectItem value="Rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description de la dépense..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                {editingExpense ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la dépense "
              {deletingExpense?.category}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
