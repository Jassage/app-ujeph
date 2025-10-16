import React, { useState, useEffect, useRef } from "react";
import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "../components/AppSidebar";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Shield,
  Mail,
  Info,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SearchResults } from "../components/SearchResults";
import { NotificationPanel } from "../components/NotificationPanel";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { SettingsPage } from "./SettingsPage";

import { StudentsManager } from "../components/StudentsManager";
import { CoursesManager } from "../components/CoursesManager";
import { GradesBulkEditor } from "../components/grades/GradesBulkEditor";
import { RetakesManager } from "../components/RetakesManager";
import { RetakeScheduler } from "../components/RetakeScheduler";
import { UsersManager } from "../components/UsersManager";
import { FacultiesManager } from "../components/FacultiesManager";
import { GuardiansManager } from "../components/GuardiansManager";
import { Dashboard } from "../components/Dashboard";
import { ScheduleManager } from "../components/ScheduleManager";
import { AttendanceManager } from "../components/AttendanceManager";
import { PaymentManager } from "../components/PaymentManager";
import { LibraryManager } from "../components/LibraryManager";
import { MessagingSystem } from "../components/MessagingSystem";
import { EventManager } from "../components/EventManager";
import { AnnouncementSystem } from "../components/AnnouncementSystem";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { StudentCardGenerator } from "../components/StudentCardGenerator";
import { TranscriptGenerator } from "../components/TranscriptGenerator";
import { EnrollmentManager } from "../components/students/EnrollmentManager";
import { CourseAssignmentManager } from "@/components/CourseAssignmentManager";
import { ProfesseurManager } from "@/components/ProfesseurManager";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { useAuthUser } from "@/hooks/useAuthUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { ExpenseManager } from "@/components/ExpenseManager";
import { FeeStructureManager } from "@/components/FeeStructureManager";
import { AuditLogsManager } from "@/components/AuditLogsManager";
import { SystemBackupManager } from "@/components/SystemBackupManager";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DeanGradesView } from "@/components/GradesManager";
// import { AdminGradesManager } from "@/components/GradesManager";

type ActiveTab =
  | "dashboard"
  | "students"
  | "enrollments"
  | "courses"
  | "professeurs"
  | "grades"
  | "bulk-grades"
  | "retakes"
  | "scheduler"
  | "users"
  | "faculties"
  | "guardians"
  | "schedules"
  | "attendance"
  | "payments"
  | "expenses"
  | "library"
  | "messaging"
  | "events"
  | "announcements"
  | "analytics"
  | "scholarships"
  | "rooms"
  | "student-cards"
  | "transcripts"
  | "login"
  | "settings"
  | "audit-logs"
  | "backup"
  | "fees";

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuthStore();
  const { hasPermission, getAccessibleModules, faculty, isDoyen } =
    usePermissions();

  // Gestion du thème avec persistance
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Mise à jour du thème
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Gestion des clics à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Vérifier les permissions lors du changement d'onglet
  useEffect(() => {
    if (user && !hasPermission(`view_${activeTab}`)) {
      toast({
        title: "Accès non autorisé",
        description:
          "Vous n'avez pas les permissions pour accéder à cette section",
        variant: "destructive",
      });
      setActiveTab("dashboard");
    }
  }, [activeTab, user, hasPermission, toast]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const handleSelectStudent = (studentId: string) => {
    if (!hasPermission("view_students")) {
      toast({
        title: "Accès non autorisé",
        description:
          "Vous n'avez pas les permissions pour accéder aux étudiants",
        variant: "destructive",
      });
      return;
    }

    setSelectedStudentId(studentId);
    setActiveTab("students");
    setIsMobileMenuOpen(false); // Fermer le menu mobile après sélection
    toast({
      title: "Étudiant sélectionné",
      description: "Redirection vers la page des étudiants",
    });
  };

  const handleSettingsClick = () => {
    setActiveTab("settings");
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    toast({
      title: "Profil",
      description: "Page de profil en développement",
    });
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
    navigate("/login");
  };

  const handleOpenScheduler = (studentId?: string) => {
    if (!hasPermission("manage_schedules")) {
      toast({
        title: "Accès non autorisé",
        description:
          "Vous n'avez pas les permissions pour gérer les emplois du temps",
        variant: "destructive",
      });
      return;
    }

    setSelectedStudentId(studentId || null);
    setIsSchedulerOpen(true);
  };

  const handleCloseScheduler = () => {
    setIsSchedulerOpen(false);
    setSelectedStudentId(null);
  };

  // Fonction pour vérifier si un onglet est accessible
  const isTabAccessible = (tab: ActiveTab): boolean => {
    const accessibleModules = getAccessibleModules();
    return accessibleModules.includes(tab);
  };

  // Fonction pour gérer le changement d'onglet avec vérification des permissions
  const handleTabChange = (tab: ActiveTab) => {
    if (!isTabAccessible(tab)) {
      toast({
        title: "Accès non autorisé",
        description:
          "Vous n'avez pas les permissions pour accéder à cette section",
        variant: "destructive",
      });
      // return;
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Fermer le menu mobile sur mobile
  };

  const renderContent = () => {
    // Vérifier les permissions avant de rendre le contenu
    if (!isTabAccessible(activeTab)) {
      return (
        <div className="p-4 md:p-6">
          <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-bold text-destructive mb-2">
                Accès non autorisé
              </h2>
              <p className="text-muted-foreground">
                Vous n'avez pas les permissions nécessaires pour accéder à cette
                section.
              </p>
              <Button
                onClick={() => setActiveTab("dashboard")}
                className="mt-4"
              >
                Retour au tableau de bord
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "students":
        return hasPermission("view_students") ? (
          <StudentsManager />
        ) : (
          <UnauthorizedView />
        );
      case "enrollments":
        return hasPermission("manage_enrollments") ? (
          <EnrollmentManager />
        ) : (
          <UnauthorizedView />
        );
      case "courses":
        return hasPermission("view_courses") ? (
          <CoursesManager />
        ) : (
          <UnauthorizedView />
        );
      case "professeurs":
        return hasPermission("view_professeurs") ? (
          <ProfesseurManager />
        ) : (
          <UnauthorizedView />
        );
      case "grades":
        return hasPermission("manage_grades") ? (
          <GradesBulkEditor />
        ) : (
          <DeanGradesView />
        );
      case "retakes":
        return hasPermission("manage_retakes") ? (
          <CourseAssignmentManager />
        ) : (
          <UnauthorizedView />
        );
      case "guardians":
        return hasPermission("view_guardians") ? (
          <GuardiansManager />
        ) : (
          <UnauthorizedView />
        );
      case "schedules":
        return hasPermission("view_schedules") ? (
          <ScheduleManager />
        ) : (
          <UnauthorizedView />
        );
      case "attendance":
        return hasPermission("manage_attendance") ? (
          <AttendanceManager />
        ) : (
          <UnauthorizedView />
        );
      case "payments":
        return hasPermission("view_payments") ? (
          <PaymentManager />
        ) : (
          <UnauthorizedView />
        );
      case "expenses":
        return hasPermission("view_expenses") ? (
          <ExpenseManager />
        ) : (
          <UnauthorizedView />
        );
      case "library":
        return hasPermission("view_library") ? (
          <LibraryManager />
        ) : (
          <UnauthorizedView />
        );
      case "messaging":
        return hasPermission("use_messaging") ? (
          <MessagingSystem />
        ) : (
          <UnauthorizedView />
        );
      case "events":
        return hasPermission("manage_events") ? (
          <EventManager />
        ) : (
          <UnauthorizedView />
        );
      case "announcements":
        return hasPermission("manage_announcements") ? (
          <AnnouncementSystem />
        ) : (
          <UnauthorizedView />
        );
      case "analytics":
        return hasPermission("view_analytics") ? (
          <AnalyticsDashboard />
        ) : (
          <UnauthorizedView />
        );
      case "users":
        return hasPermission("view_users") ? (
          <UsersManager />
        ) : (
          <UnauthorizedView />
        );
      case "faculties":
        return hasPermission("view_faculties") ? (
          <FacultiesManager />
        ) : (
          <UnauthorizedView />
        );
      case "fees":
        return hasPermission("manage_fees") ? (
          <FeeStructureManager />
        ) : (
          <UnauthorizedView />
        );
      case "scholarships":
        return hasPermission("manage_scholarships") ? (
          <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Gestion des Bourses
            </h1>
            <p className="text-muted-foreground">
              Module de gestion des bourses en développement...
            </p>
          </div>
        ) : (
          <UnauthorizedView />
        );
      case "rooms":
        return hasPermission("manage_rooms") ? (
          <div className="p-4 md:p-6">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Gestion des Salles
            </h1>
            <p className="text-muted-foreground">
              Module de gestion des salles en développement...
            </p>
          </div>
        ) : (
          <UnauthorizedView />
        );
      case "student-cards":
        return hasPermission("generate_cards") ? (
          <StudentCardGenerator />
        ) : (
          <UnauthorizedView />
        );
      case "transcripts":
        return hasPermission("generate_transcripts") ? (
          <TranscriptGenerator />
        ) : (
          <UnauthorizedView />
        );
      case "settings":
        return <SettingsPage />;
      case "audit-logs":
        return hasPermission("view_audit_logs") ? (
          <AuditLogsManager />
        ) : (
          <UnauthorizedView />
        );
      case "backup":
        return hasPermission("manage_backup") ? (
          <SystemBackupManager />
        ) : (
          <UnauthorizedView />
        );
      default:
        return <Dashboard />;
    }
  };

  // Composant pour les vues non autorisées
  const UnauthorizedView = () => (
    <div className="p-4 md:p-6">
      <Card className="border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold text-destructive mb-2">
            Accès non autorisé
          </h2>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            section.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Fonction pour obtenir l'icône du rôle
  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return <Shield className="h-3 w-3 text-red-500" />;
      case "doyen":
        return <GraduationCap className="h-3 w-3 text-purple-500" />;
      case "professeur":
        return <GraduationCap className="h-3 w-3 text-blue-500" />;
      case "secretaire":
        return <User className="h-3 w-3 text-green-500" />;
      case "directeur":
        return <Shield className="h-3 w-3 text-orange-500" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  // Fonction pour obtenir les initiales du nom
  const getInitials = (name?: string) => {
    if (!name || typeof name !== "string") return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .join("");
  };

  // Afficher un indicateur pour les doyens
  const DeanIndicator = () => {
    if (!isDoyen || !faculty) return null;

    return (
      <Card className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Vue limitée à la faculté: <strong>{faculty.name}</strong>
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Menu utilisateur pour mobile
  const MobileUserMenu = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[350px]">
        <div className="flex flex-col h-full">
          {/* En-tête du menu mobile */}
          <div className="flex items-center gap-3 p-4 border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user ? (
                  getInitials(user.firstName)
                ) : (
                  <User className="h-4 w-4" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {user?.role}
                {isDoyen && faculty && ` - ${faculty.name}`}
              </span>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleProfileClick}
            >
              <User className="mr-2 h-4 w-4" />
              Mon Profil
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSettingsClick}
            >
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {isDarkMode ? "Mode clair" : "Mode sombre"}
            </Button>
          </div>

          {/* Indicateur de statut */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className={`h-2 w-2 rounded-full ${
                  isAuthenticated ? "bg-green-500" : "bg-gray-500"
                }`}
              />
              {isAuthenticated ? "Connecté" : "Non connecté"}
            </div>
          </div>

          {/* Déconnexion */}
          <div className="p-4 mt-auto border-t">
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground w-full">
      {/* Sidebar pour desktop */}
      <div className="hidden md:block">
        <AppSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userRole={user?.role}
          isDoyen={isDoyen}
        />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden w-full min-w-0">
        {/* Header responsive */}
        <header className="flex-shrink-0 z-40 flex h-16 items-center gap-2 md:gap-4 px-3 md:px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
          {/* Sidebar trigger pour desktop, menu mobile pour mobile */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 hidden md:flex" />
            <MobileUserMenu />
          </div>

          {/* Titre principal */}
          <div className="flex flex-col flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {activeTab === "settings"
                ? "Paramètres"
                : "Système de Gestion Universitaire"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {activeTab === "settings"
                ? "Configuration et préférences"
                : `Université Jerusalem de Pignon${
                    isDoyen && faculty ? ` - ${faculty.name}` : ""
                  }`}
            </p>
          </div>

          {/* Barre de recherche - cachée sur mobile petit et page settings */}
          {activeTab !== "settings" && hasPermission("use_search") && (
            <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des étudiants, cours..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() =>
                    searchQuery.trim() && setShowSearchResults(true)
                  }
                  className="pl-9 bg-background border-input"
                />
                {showSearchResults && (
                  <SearchResults
                    query={searchQuery}
                    onClose={() => setShowSearchResults(false)}
                    onSelectStudent={handleSelectStudent}
                  />
                )}
              </div>
            </div>
          )}

          {/* Actions côté droit - version desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Notifications */}
            {hasPermission("view_notifications") && (
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-4 w-4" />
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    3
                  </Badge>
                </Button>
                <NotificationPanel
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            )}

            {/* Thème */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Paramètres */}
            <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
              <Settings className="h-4 w-4" />
            </Button>

            {/* Menu utilisateur desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user ? (
                        getInitials(user.firstName)
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {user && (
                    <div className="hidden lg:flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {user.role}
                        {isDoyen && faculty && ` - ${faculty.name}`}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {user && (
                  <>
                    <DropdownMenuLabel className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.firstName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                            {isDoyen && faculty && ` (${faculty.name})`}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Mon Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <div className="px-2 py-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isAuthenticated ? "bg-green-500" : "bg-gray-500"
                      }`}
                    />
                    {isAuthenticated ? "Connecté" : "Non connecté"}
                  </div>
                </div>

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Version mobile simplifiée */}
          <div className="flex md:hidden items-center gap-1">
            {hasPermission("view_notifications") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        {/* Barre de recherche mobile */}
        {activeTab !== "settings" && hasPermission("use_search") && (
          <div className="sm:hidden p-2 border-b bg-background/80">
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                className="pl-9 bg-background border-input"
              />
              {showSearchResults && (
                <SearchResults
                  query={searchQuery}
                  onClose={() => setShowSearchResults(false)}
                  onSelectStudent={handleSelectStudent}
                />
              )}
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto p-3 md:p-4 lg:p-6 w-full bg-background">
          {/* Indicateur pour les doyens */}
          {isDoyen && <DeanIndicator />}
          {renderContent()}
        </main>
      </div>

      {/* Modal components */}
      <RetakeScheduler
        isOpen={isSchedulerOpen}
        onClose={handleCloseScheduler}
        selectedStudentId={selectedStudentId}
      />
    </div>
  );
};

export default Index;
