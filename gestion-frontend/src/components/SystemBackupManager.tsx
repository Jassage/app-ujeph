// components/SystemBackupManager.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Database,
  Download,
  Upload,
  Calendar,
  HardDrive,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Trash2,
  Archive,
  FileText,
  Server,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBackupStore } from "@/store/backupStore";
import { cn } from "@/lib/utils";

interface Backup {
  filename: string;
  size: number;
  timestamp: string;
  records: {
    students: number;
    professors: number;
    users: number;
    ues: number;
    enrollments: number;
    assignments: number;
    grades: number;
    payments: number;
    auditLogs: number;
  };
}

export const SystemBackupManager = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "students",
    "professors",
    "users",
    "academic",
    "enrollments",
    "grades",
  ]);
  const [backupName, setBackupName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const backupStore = useBackupStore();

  const availableModules = [
    {
      id: "students",
      label: "Étudiants",
      description: "Données des étudiants et tuteurs",
      default: true,
    },
    {
      id: "professors",
      label: "Professeurs",
      description: "Informations des enseignants",
      default: true,
    },
    {
      id: "users",
      label: "Utilisateurs",
      description: "Comptes utilisateurs système",
      default: true,
    },
    {
      id: "academic",
      label: "Données Académiques",
      description: "Années, facultés, UE",
      default: true,
    },
    {
      id: "enrollments",
      label: "Inscriptions",
      description: "Inscriptions étudiantes",
      default: true,
    },
    {
      id: "grades",
      label: "Notes",
      description: "Notes et évaluations",
      default: true,
    },
    {
      id: "payments",
      label: "Paiements",
      description: "Données financières",
      default: false,
    },
    {
      id: "audit",
      label: "Logs d'Audit",
      description: "Historique des actions",
      default: false,
    },
    {
      id: "config",
      label: "Configuration",
      description: "Paramètres système",
      default: false,
    },
  ];

  const loadBackups = async () => {
    setLoading(true);
    try {
      await backupStore.loadBackups();
      setBackups(backupStore.backups);
    } catch (error) {
      console.error("Erreur chargement sauvegardes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sauvegardes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const createBackup = async () => {
    if (!backupName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier un nom pour la sauvegarde",
        variant: "destructive",
      });
      return;
    }

    setCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Simulation de progression
      const progressInterval = setInterval(() => {
        setBackupProgress((prev) => {
          if (prev >= 90) {
            // S'arrête à 90% pour laisser la place à l'API
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const backup = await backupStore.createBackup(
        backupName,
        selectedModules
      );

      if (backup) {
        setBackups((prev) => [backup, ...prev]);
        setIsCreateDialogOpen(false);
        setBackupName("");
        setBackupProgress(100);

        setTimeout(() => {
          setBackupProgress(0);
        }, 1000);
      }

      clearInterval(progressInterval);
    } catch (error) {
      console.error("Erreur création sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Échec de la création de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadBackup = async (backup: Backup) => {
    try {
      await backupStore.downloadBackup(backup.filename);
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      toast({
        title: "Erreur",
        description: "Échec du téléchargement",
        variant: "destructive",
      });
    }
  };

  const deleteBackup = async (backup: Backup) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer la sauvegarde "${backup.filename}" ?`
      )
    ) {
      return;
    }

    try {
      await backupStore.deleteBackup(backup.filename);
      setBackups(backupStore.backups);
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression",
        variant: "destructive",
      });
    }
  };

  const exportData = async (format: "json" | "csv" | "sql") => {
    try {
      await backupStore.exportData(format, selectedModules.includes("audit"));
    } catch (error) {
      console.error("Erreur export:", error);
      toast({
        title: "Erreur",
        description: "Échec de l'export",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTotalRecords = (backup: Backup) => {
    return Object.values(backup.records).reduce((sum, count) => sum + count, 0);
  };

  const getStatusColor = (backup: Backup) => {
    const totalRecords = getTotalRecords(backup);
    if (totalRecords === 0) return "bg-red-100 text-red-800 border-red-200";
    if (totalRecords < 100)
      return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const selectAllModules = () => {
    setSelectedModules(availableModules.map((module) => module.id));
  };

  const deselectAllModules = () => {
    setSelectedModules([]);
  };

  const selectDefaultModules = () => {
    setSelectedModules(
      availableModules
        .filter((module) => module.default)
        .map((module) => module.id)
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Server className="h-6 w-6" />
            Gestion des Sauvegardes
          </h1>
          <p className="text-muted-foreground mt-1">
            Sauvegarde, restauration et export des données système
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={loadBackups}
            variant="outline"
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Database className="h-4 w-4" />
                Nouvelle Sauvegarde
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Créer une Sauvegarde
                </DialogTitle>
                <DialogDescription>
                  Sauvegarde complète du système académique avec les modules
                  sélectionnés
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="backupName">Nom de la sauvegarde *</Label>
                  <Input
                    id="backupName"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="ex: Backup avant maintenance novembre 2024"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Un timestamp sera automatiquement ajouté au nom du fichier
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Modules à inclure</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectDefaultModules}
                      >
                        Défaut
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllModules}
                      >
                        Tout
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={deselectAllModules}
                      >
                        Aucun
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                    {availableModules.map((module) => (
                      <div
                        key={module.id}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border transition-colors",
                          selectedModules.includes(module.id)
                            ? "bg-primary/5 border-primary/20"
                            : "bg-muted/20 border-muted"
                        )}
                      >
                        <Checkbox
                          id={module.id}
                          checked={selectedModules.includes(module.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedModules((prev) => [
                                ...prev,
                                module.id,
                              ]);
                            } else {
                              setSelectedModules((prev) =>
                                prev.filter((m) => m !== module.id)
                              );
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={module.id}
                            className="font-medium cursor-pointer truncate block"
                          >
                            {module.label}
                          </Label>
                          <p className="text-xs text-muted-foreground truncate">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedModules.length} module(s) sélectionné(s) sur{" "}
                    {availableModules.length}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex-col gap-3 sm:flex-row">
                {creatingBackup && (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Création en cours...
                      </span>
                      <span className="text-sm font-mono">
                        {backupProgress}%
                      </span>
                    </div>
                    <Progress value={backupProgress} className="w-full" />
                  </div>
                )}

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                    disabled={creatingBackup}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={createBackup}
                    disabled={
                      creatingBackup ||
                      !backupName.trim() ||
                      selectedModules.length === 0
                    }
                    className="flex-1 gap-2"
                  >
                    {creatingBackup ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    {creatingBackup ? "Création..." : "Créer"}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sauvegardes
                </p>
                <p className="text-2xl font-bold">{backups.length}</p>
              </div>
              <Archive className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Espace Total
                </p>
                <p className="text-2xl font-bold">
                  {formatFileSize(backups.reduce((sum, b) => sum + b.size, 0))}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dernière Sauvegarde
                </p>
                <p className="text-lg font-bold">
                  {backups.length > 0
                    ? new Date(backups[0].timestamp).toLocaleDateString("fr-FR")
                    : "Aucune"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Enregistrements
                </p>
                <p className="text-2xl font-bold">
                  {backups.length > 0
                    ? getTotalRecords(backups[0]).toLocaleString()
                    : "0"}
                </p>
              </div>
              <Database className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Rapide
          </CardTitle>
          <CardDescription>
            Exportez vos données dans différents formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => exportData("json")}
              variant="outline"
              className="gap-2"
              disabled={backupStore.exporting}
            >
              <Download className="h-4 w-4" />
              JSON
              {backupStore.exporting && (
                <RefreshCw className="h-3 w-3 animate-spin" />
              )}
            </Button>
            <Button
              onClick={() => exportData("csv")}
              variant="outline"
              className="gap-2"
              disabled={backupStore.exporting}
            >
              <Download className="h-4 w-4" />
              CSV
              {backupStore.exporting && (
                <RefreshCw className="h-3 w-3 animate-spin" />
              )}
            </Button>
            <Button
              onClick={() => exportData("sql")}
              variant="outline"
              className="gap-2"
              disabled={backupStore.exporting}
            >
              <Database className="h-4 w-4" />
              SQL
              {backupStore.exporting && (
                <RefreshCw className="h-3 w-3 animate-spin" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des sauvegardes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Sauvegardes Disponibles
          </CardTitle>
          <CardDescription>
            {backups.length} sauvegarde(s) disponible(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Sauvegarde</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[100px]">Taille</TableHead>
                    <TableHead className="w-[200px]">Enregistrements</TableHead>
                    <TableHead className="w-[120px]">Statut</TableHead>
                    <TableHead className="w-[180px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow
                      key={backup.filename}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Archive className="h-5 w-5 text-muted-foreground" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {backup.filename}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(backup.size)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {new Date(backup.timestamp).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(backup.timestamp).toLocaleTimeString(
                              "fr-FR"
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatFileSize(backup.size)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Étudiants:
                            </span>
                            <span className="font-medium">
                              {backup.records.students}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Notes:
                            </span>
                            <span className="font-medium">
                              {backup.records.grades}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total:
                            </span>
                            <span className="font-medium">
                              {getTotalRecords(backup).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(backup)}
                        >
                          {getTotalRecords(backup) === 0
                            ? "Vide"
                            : getTotalRecords(backup) < 100
                            ? "Partiel"
                            : "Complet"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadBackup(backup)}
                            className="gap-1 h-8"
                          >
                            <Download className="h-3 w-3" />
                            Télécharger
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBackup(backup)}
                            className="gap-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {backups.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    Aucune sauvegarde disponible
                  </h3>
                  <p className="text-muted-foreground mt-1 mb-4">
                    Créez votre première sauvegarde pour protéger vos données.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Database className="h-4 w-4 mr-2" />
                    Créer une sauvegarde
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertes de sécurité */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <strong>Recommandations de sécurité:</strong> Conservez au moins 3
          sauvegardes récentes dans des emplacements différents. Testez
          régulièrement la procédure de restauration.
        </AlertDescription>
      </Alert>
    </div>
  );
};
