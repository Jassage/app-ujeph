// components/AuditLogsManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  X,
  BarChart3,
  Shield,
  Clock,
  DownloadCloud,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// import { DatePicker } from "@/components/ui/date-picker";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  oldData?: any;
  newData?: any;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  status?: "SUCCESS" | "ERROR";
  errorMessage?: string;
  duration?: number;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats?: {
    total: number;
    success: number;
    error: number;
    today: number;
  };
}

// Composant de pagination séparé
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
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
  };

  return (
    <div
      className={cn("flex items-center justify-between px-2 py-4", className)}
    >
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>
          Page {currentPage} sur {totalPages}
        </span>
      </div>

      <div className="flex items-center space-x-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 hidden sm:flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Première page</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Page précédente</TooltipContent>
        </Tooltip>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-8 w-8 p-0 text-xs hidden sm:inline-flex"
            >
              {page}
            </Button>
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Page suivante</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 hidden sm:flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Dernière page</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

// Composant de statistiques
const StatsCards = ({ stats }: { stats?: AuditLogsResponse["stats"] }) => {
  if (!stats) return null;

  const statItems = [
    {
      label: "Total des logs",
      value: stats.total,
      icon: BarChart3,
      color:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    },
    {
      label: "Succès",
      value: stats.success,
      icon: CheckCircle,
      color:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    },
    {
      label: "Erreurs",
      value: stats.error,
      icon: AlertTriangle,
      color:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    },
    {
      label: "Aujourd'hui",
      value: stats.today,
      icon: Clock,
      color:
        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <Card key={stat.label} className={stat.color}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold">
                  {stat.value?.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-full bg-current bg-opacity-20">
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Composant de chargement
const LoadingSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-full" />
      </div>
    ))}
  </div>
);

export const AuditLogsManager = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [stats, setStats] = useState<AuditLogsResponse["stats"]>();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    action: "all",
    entity: "all",
    userId: "",
    startDate: "",
    endDate: "",
    status: "all",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Charger les logs avec useCallback pour éviter les re-rendus inutiles
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params.append(key, value.toString());
        }
      });

      const API_URL = "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/audit/audit-logs?${params}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data: AuditLogsResponse = await response.json();
      setLogs(data.logs || []);
      setPagination(
        data.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
      );
      setStats(data.stats);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les logs: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Export des logs
  const exportLogs = async (format: "csv" | "json" = "csv") => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          params.append(key, value.toString());
        }
      });
      params.append("format", format);

      const API_URL = "http://localhost:4000";
      const response = await fetch(
        `${API_URL}/api/audit-logs/export?${params}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: `Les logs ont été exportés en format ${format.toUpperCase()}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les logs",
        variant: "destructive",
      });
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      action: "all",
      entity: "all",
      userId: "",
      startDate: "",
      endDate: "",
      status: "all",
    });
  };

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.page === 1) {
        loadLogs();
      } else {
        setFilters((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search, filters.startDate, filters.endDate, filters.userId]);

  // Chargement initial et quand les filtres de page changent
  useEffect(() => {
    loadLogs();
  }, [
    filters.page,
    filters.limit,
    filters.action,
    filters.entity,
    filters.status,
    loadLogs,
  ]);

  // Fonctions utilitaires
  const getSeverityColor = (status?: string) => {
    switch (status) {
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      case "SUCCESS":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
    }
  };

  const getSeverityIcon = (status?: string) => {
    switch (status) {
      case "ERROR":
        return <AlertTriangle className="h-3 w-3" />;
      case "SUCCESS":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "LOGIN":
      case "LOGOUT":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const getUserName = (log: AuditLog) => {
    if (log.user) {
      return `${log.user.firstName} ${log.user.lastName}`;
    }
    return log.userId || "Système";
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === "page" || key === "limit") return false;
      return value && value !== "all" && value !== "";
    });
  }, [filters]);

  return (
    <TooltipProvider>
      <div className="p-4 lg:p-6 space-y-6">
        {/* En-tête avec statistiques */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Journal d'Audit
            </h1>
            <p className="text-muted-foreground mt-1">
              Suivi complet des activités système et de sécurité
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={loadLogs}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualiser les logs</TooltipContent>
            </Tooltip>

            <Button
              onClick={() => exportLogs("csv")}
              size="sm"
              className="gap-2"
            >
              <DownloadCloud className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter CSV</span>
            </Button>

            <Button
              onClick={() => exportLogs("json")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">JSON</span>
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <StatsCards stats={stats} />

        {/* Filtres */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filtres et Recherche
              </CardTitle>
              {hasActiveFilters && (
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans les logs..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, action: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="CREATE">Création</SelectItem>
                  <SelectItem value="UPDATE">Modification</SelectItem>
                  <SelectItem value="DELETE">Suppression</SelectItem>
                  <SelectItem value="LOGIN">Connexion</SelectItem>
                  <SelectItem value="LOGOUT">Déconnexion</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.entity}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, entity: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Entité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entités</SelectItem>
                  <SelectItem value="User">Utilisateur</SelectItem>
                  <SelectItem value="Student">Étudiant</SelectItem>
                  <SelectItem value="Professor">Professeur</SelectItem>
                  <SelectItem value="Course">Cours</SelectItem>
                  <SelectItem value="Grade">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="SUCCESS">Succès</SelectItem>
                  <SelectItem value="ERROR">Erreur</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    placeholder="Date de début"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="date"
                    placeholder="Date de fin"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Select
                value={filters.limit.toString()}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    limit: parseInt(value),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Logs par page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 logs</SelectItem>
                  <SelectItem value="20">20 logs</SelectItem>
                  <SelectItem value="50">50 logs</SelectItem>
                  <SelectItem value="100">100 logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {pagination.total > 0 ? (
                  <>
                    Affichage de {(filters.page - 1) * filters.limit + 1} à{" "}
                    {Math.min(filters.page * filters.limit, pagination.total)}{" "}
                    sur {pagination.total} log(s)
                  </>
                ) : (
                  "Aucun log trouvé"
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={loadLogs} className="gap-2" disabled={loading}>
                  <Search className="h-4 w-4" />
                  Appliquer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des logs */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des Actions</CardTitle>
            <CardDescription>
              {pagination.total} action(s) enregistrée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Date/Heure</TableHead>
                        <TableHead className="min-w-[150px]">
                          Utilisateur
                        </TableHead>
                        <TableHead className="min-w-[100px]">Action</TableHead>
                        <TableHead className="min-w-[120px]">Entité</TableHead>
                        <TableHead className="min-w-[200px]">
                          Description
                        </TableHead>
                        <TableHead className="w-[100px]">Statut</TableHead>
                        <TableHead className="w-[80px]">Durée</TableHead>
                        <TableHead className="w-[120px]">IP</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                              <span>
                                {new Date(log.createdAt).toLocaleTimeString(
                                  "fr-FR"
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">
                                  {getUserName(log)}
                                </div>
                                {log.user?.email && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {log.user.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                getActionColor(log.action)
                              )}
                            >
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{log.entity}</div>
                            {log.entityId && (
                              <div className="text-xs text-muted-foreground truncate">
                                ID: {log.entityId}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate">
                                  {log.description}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{log.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-xs",
                                getSeverityColor(log.status)
                              )}
                              variant="outline"
                            >
                              <div className="flex items-center gap-1">
                                {getSeverityIcon(log.status)}
                                <span className="hidden sm:inline">
                                  {log.status || "INFO"}
                                </span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatDuration(log.duration)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate block">
                                  {log.ipAddress}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{log.ipAddress}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedLog(log)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Voir les détails
                                </TooltipContent>
                              </Tooltip>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    Détails de l'Action d'Audit
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedLog && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <strong>ID:</strong> {selectedLog.id}
                                      </div>
                                      <div>
                                        <strong>Timestamp:</strong>{" "}
                                        {new Date(
                                          selectedLog.createdAt
                                        ).toLocaleString("fr-FR")}
                                      </div>
                                      <div>
                                        <strong>Utilisateur:</strong>{" "}
                                        {getUserName(selectedLog)}
                                      </div>
                                      <div>
                                        <strong>Action:</strong>{" "}
                                        {selectedLog.action}
                                      </div>
                                      <div>
                                        <strong>Entité:</strong>{" "}
                                        {selectedLog.entity}
                                      </div>
                                      <div>
                                        <strong>ID Entité:</strong>{" "}
                                        {selectedLog.entityId || "N/A"}
                                      </div>
                                      <div>
                                        <strong>Adresse IP:</strong>{" "}
                                        {selectedLog.ipAddress}
                                      </div>
                                      <div>
                                        <strong>User Agent:</strong>{" "}
                                        {selectedLog.userAgent}
                                      </div>
                                      <div>
                                        <strong>Durée:</strong>{" "}
                                        {formatDuration(selectedLog.duration)}
                                      </div>
                                      <div>
                                        <strong>Statut:</strong>{" "}
                                        {selectedLog.status || "SUCCESS"}
                                      </div>
                                    </div>

                                    <div>
                                      <strong>Description:</strong>
                                      <p className="mt-1 p-2 bg-muted rounded-lg">
                                        {selectedLog.description}
                                      </p>
                                    </div>

                                    {selectedLog.oldData && (
                                      <div>
                                        <strong>Anciennes Données:</strong>
                                        <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto max-h-40">
                                          {JSON.stringify(
                                            selectedLog.oldData,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}

                                    {selectedLog.newData && (
                                      <div>
                                        <strong>Nouvelles Données:</strong>
                                        <pre className="mt-1 p-3 bg-muted rounded-lg text-sm overflow-auto max-h-40">
                                          {JSON.stringify(
                                            selectedLog.newData,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}

                                    {selectedLog.errorMessage && (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <strong className="text-red-800">
                                          Message d'erreur:
                                        </strong>
                                        <p className="text-red-700 mt-1">
                                          {selectedLog.errorMessage}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {logs.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Aucun log d'audit trouvé
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {hasActiveFilters
                        ? "Aucun résultat ne correspond à vos critères de recherche."
                        : "Aucune action n'a été enregistrée pour le moment."}
                    </p>
                    {hasActiveFilters && (
                      <Button onClick={resetFilters} className="mt-4">
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {logs.length > 0 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={(page) =>
                      setFilters((prev) => ({ ...prev, page }))
                    }
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

// Helper function pour cn (si non disponible)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
