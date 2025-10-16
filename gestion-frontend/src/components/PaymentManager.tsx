import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  DollarSign,
  Plus,
  Edit2,
  Check,
  X,
  CreditCard,
  Loader2,
  Wallet,
  BookOpen,
  FileText,
  RefreshCw,
  MoreHorizontal,
  ChevronsUpDown,
  Table as TableIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  FileDown,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  User,
  BarChart3,
  History,
  Download,
  Eye,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAcademicStore } from "@/store/studentStore";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { useFeeStructureStore } from "@/store/feeStructureStore";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface FeePayment {
  description: string;
  id: string;
  studentFeeId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  recordedBy: string;
  createdAt: string;
}

export const PaymentManager = () => {
  const { students, fetchStudents } = useAcademicStore();
  const { academicYears, fetchAcademicYears } = useAcademicYearStore();
  const {
    studentFees,
    getStudentFees,
    recordPayment,
    updateStudentFee,
    deleteStudenFeePayment,
    getPaymentHistory,
    getAllStudentFees,
    loading,
  } = useFeeStructureStore();

  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("ALL_STUDENTS");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("ALL_YEARS");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [selectedFee, setSelectedFee] = useState("");
  const [paymentHistory, setPaymentHistory] = useState<FeePayment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingPayment, setEditingPayment] = useState<FeePayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<FeePayment | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    studentFeeId: "",
    amount: 0,
    paymentMethod: "cash" as const,
    reference: "",
    paymentDate: new Date().toISOString().split("T")[0],
    description: "",
  });

  useEffect(() => {
    fetchStudents();
    fetchAcademicYears();
  }, [fetchStudents, fetchAcademicYears]);

  useEffect(() => {
    if (selectedStudent && selectedStudent !== "ALL_STUDENTS") {
      loadStudentFees(selectedStudent);
    } else {
      getAllStudentFees();
    }
  }, [selectedStudent, selectedAcademicYear]);

  const loadStudentFees = async (studentId: string) => {
    try {
      await getStudentFees(studentId);
    } catch (error) {
      console.error("Error loading student fees:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les frais de l'étudiant",
        variant: "destructive",
      });
    }
  };

  const loadPaymentHistory = async (feeId: string) => {
    try {
      const history = await getPaymentHistory(feeId);
      setPaymentHistory(history);
      setShowHistory(true);
    } catch (error) {
      console.error("Error loading payment history:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des paiements",
        variant: "destructive",
      });
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter((student) =>
      `${student.firstName} ${student.lastName} ${student.studentId}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!formData.studentFeeId)
      errors.push("Les frais doivent être sélectionnés");
    if (!formData.amount || formData.amount <= 0)
      errors.push("Le montant doit être positif");
    if (formData.amount > 1000000) errors.push("Le montant semble trop élevé");
    if (!formData.description.trim())
      errors.push("La description est obligatoire");
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingPayment) {
        // Mise à jour d'un paiement existant
        const updatePayload: any = {
          amount: formData.amount,
          paymentMethod: formData.paymentMethod,
          reference: formData.reference,
          paymentDate: formData.paymentDate,
          description: formData.description,
        };
        await updateStudentFee(editingPayment.id, updatePayload);
        toast({
          title: "Succès",
          description: "Paiement mis à jour avec succès",
        });
      } else {
        // Création d'un nouveau paiement
        await recordPayment(formData.studentFeeId, {
          amount: formData.amount,
          paymentMethod: formData.paymentMethod,
          reference: formData.reference,
          paymentDate: formData.paymentDate,
          description: formData.description,
        });
        toast({
          title: "Succès",
          description: "Paiement enregistré avec succès",
        });
      }

      resetForm();
      setShowForm(false);
      setEditingPayment(null);

      // Recharger les données
      if (selectedStudent && selectedStudent !== "ALL_STUDENTS") {
        await loadStudentFees(selectedStudent);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPayment = (payment: FeePayment) => {
    // Trouver les frais étudiants associés à ce paiement
    const fee = studentFees.find((f) => f.id === payment.studentFeeId);
    if (fee) {
      setSelectedStudent(fee.studentId);
      setFormData({
        studentFeeId: payment.studentFeeId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod as any,
        reference: payment.reference || "",
        paymentDate: payment.paymentDate.split("T")[0],
        description: payment.description,
      });
      setEditingPayment(payment);
      setShowForm(true);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;

    setIsSubmitting(true);
    try {
      await deleteStudenFeePayment(deletingPayment.id);
      toast({
        title: "Succès",
        description: "Paiement supprimé avec succès",
      });

      // Recharger les données
      if (selectedStudent && selectedStudent !== "ALL_STUDENTS") {
        await loadStudentFees(selectedStudent);
      }

      // Recharger l'historique si ouvert
      if (showHistory) {
        const history = await getPaymentHistory(deletingPayment.studentFeeId);
        setPaymentHistory(history);
      }

      setDeletingPayment(null);
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le paiement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentFeeId: "",
      amount: 0,
      paymentMethod: "cash",
      reference: "",
      paymentDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setFormErrors([]);
    setEditingPayment(null);
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student
      ? `${student.firstName} ${student.lastName}`
      : "Sélectionner un étudiant...";
  };

  const getStatusBadge = (paidAmount: number, totalAmount: number) => {
    if (paidAmount >= totalAmount) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Payé
        </Badge>
      );
    } else if (paidAmount > 0) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          Partiel
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          En attente
        </Badge>
      );
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      cash: "bg-blue-100 text-blue-800 border-blue-200",
      transfer: "bg-purple-100 text-purple-800 border-purple-200",
      card: "bg-orange-100 text-orange-800 border-orange-200",
      check: "bg-green-100 text-green-800 border-green-200",
    };

    return (
      <Badge
        variant="outline"
        className={cn("text-xs", colors[method as keyof typeof colors])}
      >
        {method === "cash" && "Espèces"}
        {method === "transfer" && "Virement"}
        {method === "card" && "Carte"}
        {method === "check" && "Chèque"}
      </Badge>
    );
  };

  const filteredPayments = useMemo(() => {
    let filtered = studentFees;

    // Filtrer par étudiant
    if (selectedStudent !== "ALL_STUDENTS") {
      filtered = filtered.filter((fee) => fee.studentId === selectedStudent);
    }

    // Filtrer par année académique
    if (selectedAcademicYear !== "ALL_YEARS") {
      filtered = filtered.filter(
        (fee) => fee.academicYearId === selectedAcademicYear
      );
    }

    // Filtrer par statut
    if (activeTab !== "all") {
      filtered = filtered.filter((fee) => {
        if (activeTab === "paid") return fee.paidAmount >= fee.totalAmount;
        if (activeTab === "partial")
          return fee.paidAmount > 0 && fee.paidAmount < fee.totalAmount;
        if (activeTab === "pending") return fee.paidAmount === 0;
        return true;
      });
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter((fee) => {
        const student = students.find((s) => s.id === fee.studentId);
        if (!student) return false;

        return `${student.firstName} ${student.lastName} ${student.studentId}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  }, [
    studentFees,
    selectedStudent,
    selectedAcademicYear,
    activeTab,
    searchTerm,
    students,
  ]);

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const getPaymentStats = () => {
    const total = filteredPayments.length;
    const paid = filteredPayments.filter(
      (f) => f.paidAmount >= f.totalAmount
    ).length;
    const partial = filteredPayments.filter(
      (f) => f.paidAmount > 0 && f.paidAmount < f.totalAmount
    ).length;
    const pending = filteredPayments.filter((f) => f.paidAmount === 0).length;
    const totalAmount = filteredPayments.reduce(
      (sum, f) => sum + f.totalAmount,
      0
    );
    const paidAmount = filteredPayments.reduce(
      (sum, f) => sum + f.paidAmount,
      0
    );

    return { total, paid, partial, pending, totalAmount, paidAmount };
  };

  const getAcademicYearDisplay = (yearId: string): string => {
    const year = academicYears.find((y) => y.id === yearId);
    return year ? year.year : yearId;
  };

  const stats = getPaymentStats();

  return (
    <div className="space-y-6">
      {/* Header avec titre et bouton d'action */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" />
            Gestion des Paiements
          </h2>
          <p className="text-muted-foreground">
            Gérez les paiements des frais académiques des étudiants
          </p>
        </div>

        <Button
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouveau Paiement
        </Button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total des frais
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-200">
                <CreditCard className="h-5 w-5 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Montant total
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.totalAmount.toLocaleString()} HTG
                </p>
              </div>
              <div className="p-2 rounded-full bg-green-200">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">
                  Montant payé
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {stats.paidAmount.toLocaleString()} HTG
                </p>
              </div>
              <div className="p-2 rounded-full bg-amber-200">
                <Check className="h-5 w-5 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Solde restant
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {(stats.totalAmount - stats.paidAmount).toLocaleString()} HTG
                </p>
              </div>
              <div className="p-2 rounded-full bg-purple-200">
                <Wallet className="h-5 w-5 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de filtres et recherche */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un étudiant..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Étudiant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_STUDENTS">Tous les étudiants</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedAcademicYear}
              onValueChange={setSelectedAcademicYear}
            >
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Année académique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_YEARS">Toutes les années</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <Label>Période</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Sélectionner une période</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 w-full"
                onClick={() => {
                  // Réinitialiser les filtres
                  setDateRange(undefined);
                  setSelectedStudent("ALL_STUDENTS");
                  setSelectedAcademicYear("ALL_YEARS");
                  setSearchTerm("");
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  Tous ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="paid" className="flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Payés ({stats.paid})
                </TabsTrigger>
                <TabsTrigger
                  value="partial"
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Partiels ({stats.partial})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="flex items-center gap-1"
                >
                  <AlertCircle className="h-4 w-4" />
                  En attente ({stats.pending})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Liste des frais */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle>Frais des étudiants</CardTitle>
              <CardDescription>
                {filteredPayments.length} résultat(s) trouvé(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-9 w-9 p-0"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-9 w-9 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun frais trouvé</p>
              <p className="text-sm mt-2">
                Ajustez vos filtres ou ajoutez de nouveaux frais
              </p>
            </div>
          ) : viewMode === "table" ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Étudiant</TableHead>
                      <TableHead>Frais</TableHead>
                      <TableHead>Année</TableHead>
                      <TableHead className="text-right">
                        Montant total
                      </TableHead>
                      <TableHead className="text-right">Montant payé</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{getStudentName(fee.studentId)}</div>
                            <div className="text-xs text-muted-foreground">
                              {
                                students.find((s) => s.id === fee.studentId)
                                  ?.studentId
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{fee.feeStructure.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getAcademicYearDisplay(fee.academicYearId)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {fee.totalAmount.toLocaleString()} HTG
                        </TableCell>
                        <TableCell className="text-right">
                          {fee.paidAmount.toLocaleString()} HTG
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(fee.paidAmount, fee.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent(fee.studentId);
                                setFormData({
                                  ...formData,
                                  studentFeeId: fee.id,
                                  amount: fee.totalAmount - fee.paidAmount,
                                  description: `Paiement pour ${fee.feeStructure.name}`,
                                });
                                setShowForm(true);
                              }}
                              disabled={fee.paidAmount >= fee.totalAmount}
                            >
                              Payer
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadPaymentHistory(fee.id)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredPayments.length
                    )}{" "}
                    sur {filteredPayments.length} entrées
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={currentPage === pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            // Vue cartes
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPayments.map((fee) => (
                <Card key={fee.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {fee.feeStructure.name}
                        </CardTitle>
                        <CardDescription>
                          {getStudentName(fee.studentId)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(fee.paidAmount, fee.totalAmount)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="font-bold">
                          {fee.totalAmount.toLocaleString()} HTG
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Payé:</span>
                        <span className="text-green-600">
                          {fee.paidAmount.toLocaleString()} HTG
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Restant:</span>
                        <span className="text-amber-600">
                          {(fee.totalAmount - fee.paidAmount).toLocaleString()}{" "}
                          HTG
                        </span>
                      </div>

                      <Progress
                        value={(fee.paidAmount / fee.totalAmount) * 100}
                        className="h-2"
                      />

                      <div className="flex justify-between items-center pt-2">
                        <Badge variant="outline">
                          {getAcademicYearDisplay(fee.academicYearId)}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(fee.studentId);
                              setFormData({
                                ...formData,
                                studentFeeId: fee.id,
                                amount: fee.totalAmount - fee.paidAmount,
                                description: `Paiement pour ${fee.feeStructure.name}`,
                              });
                              setShowForm(true);
                            }}
                            disabled={fee.paidAmount >= fee.totalAmount}
                          >
                            Payer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadPaymentHistory(fee.id)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de paiement */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          }
          setShowForm(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {editingPayment
                ? "Modifier le Paiement"
                : "Enregistrer un Paiement"}
            </DialogTitle>
            <DialogDescription>
              {editingPayment
                ? "Modifiez les informations du paiement existant"
                : "Remplissez les informations pour enregistrer un nouveau paiement"}
            </DialogDescription>
          </DialogHeader>

          {formErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {formErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student">Étudiant *</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedStudent
                        ? getStudentName(selectedStudent)
                        : "Sélectionner un étudiant..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Rechercher un étudiant..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>Aucun étudiant trouvé</CommandEmpty>
                        <CommandGroup>
                          {filteredStudents.map((student) => (
                            <CommandItem
                              key={student.id}
                              value={student.id}
                              onSelect={() => {
                                setSelectedStudent(student.id);
                                setOpen(false);
                                setSearchTerm("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStudent === student.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {student.firstName} {student.lastName} (
                              {student.studentId})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedStudent && selectedStudent !== "ALL_STUDENTS" && (
                <div className="space-y-2">
                  <Label htmlFor="fee">Frais à payer *</Label>
                  <Select
                    value={formData.studentFeeId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, studentFeeId: value })
                    }
                    disabled={!!editingPayment}
                  >
                    <SelectTrigger id="fee">
                      <SelectValue placeholder="Sélectionner les frais" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentFees
                        .filter((fee) => fee.studentId === selectedStudent)
                        .map((fee) => (
                          <SelectItem key={fee.id} value={fee.id}>
                            {fee.feeStructure.name} - Restant:{" "}
                            {(
                              fee.totalAmount - fee.paidAmount
                            ).toLocaleString()}{" "}
                            HTG
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (HTG) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: Number(e.target.value),
                    })
                  }
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Méthode de paiement *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value as any })
                  }
                >
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Sélectionner une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="transfer">Virement</SelectItem>
                    <SelectItem value="card">Carte</SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date du paiement</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Référence (optionnel)</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  placeholder="Numéro de référence"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du paiement..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Décrivez le motif de ce paiement
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingPayment
                  ? "Modifier le paiement"
                  : "Enregistrer le paiement"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal d'historique des paiements */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des Paiements
            </DialogTitle>
            <DialogDescription>
              Détails des paiements effectués pour ces frais
            </DialogDescription>
          </DialogHeader>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun historique de paiement trouvé</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodBadge(payment.paymentMethod)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {payment.amount.toLocaleString()} HTG
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {payment.description}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.reference || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditPayment(payment)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeletingPayment(payment)}
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
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog
        open={!!deletingPayment}
        onOpenChange={(open) => !open && setDeletingPayment(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Supprimer le paiement
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>

          {deletingPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Montant:</Label>
                <div className="col-span-3 font-medium">
                  {deletingPayment.amount.toLocaleString()} HTG
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Date:</Label>
                <div className="col-span-3">
                  {new Date(deletingPayment.paymentDate).toLocaleDateString()}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Méthode:</Label>
                <div className="col-span-3">
                  {getPaymentMethodBadge(deletingPayment.paymentMethod)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Description:</Label>
                <div className="col-span-3 text-sm">
                  {deletingPayment.description}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingPayment(null)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePayment}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
