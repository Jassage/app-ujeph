import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  HashRouter,
} from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LoadingScreen } from "./components/LoadingScreen";
import { useDataContext } from "./contexts/DataContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/protectedRoute";
import { AppInitializer } from "./components/AppInitializer";
// import { LoginPage } from "./components/login";
import { initializeAuthStore, useAuthStore } from "./store/authStore";
import { initializeFacultyStore, useFacultyStore } from "./store/facultyStore";
import { useEnrollmentStore } from "./store/enrollmentStore";
import { useCourseAssignmentStore } from "./store/courseAssignmentStore";
import { useAcademicStore } from "./store/studentStore";
import { usePaymentStore } from "./store/paymentStore";
import { useGradeStore } from "./store/gradeStore";
import { useAcademicYearStore } from "./store/academicYearStore";
import { useUEStore } from "./store/courseStore";
import { useExpenseStore } from "./store/expenseStore";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { ForgotPassword } from "./components/ForgotPassword";
import { useFeeStructureStore } from "./store/feeStructureStore";
import { useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/login";
import { useBackupStore } from "./store/backupStore";
// import LoginPage from "./components/login";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isLoading, error } = useDataContext();
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  // const { isLocked } = useAuth();

  // if (isLocked) {
  //   return <AppLock />;
  // }

  // Afficher le loading pendant le chargement initial
  if (authLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SidebarProvider forceOpen={true}>
      <div className="min-h-screen flex w-full">
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Routes protégées - Rediriger vers /login si non authentifié */}
          <Route
            path="/"
            element={
              isAuthenticated ? <Index /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Index /> : <Navigate to="/login" replace />
            }
          />

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Route 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </SidebarProvider>
  );
};

const cleanupAuth = () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    // Nettoyer les données obsolètes
    localStorage.removeItem("userData");
  }
};

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  // Initialisation des stores
  useEffect(() => {
    cleanupAuth();
    const initializeStores = async () => {
      try {
        // console.log("🚀 Initialisation de l'application...");

        // 1. D'abord initialiser l'auth pour avoir le token
        await initializeAuthStore();

        // 2. Attendre un peu pour laisser l'auth se terminer
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 3. Vérifier si l'utilisateur est authentifié avant de charger les données
        const { isAuthenticated, token } = useAuthStore.getState();

        // console.log("🔐 Statut authentification:", {
        //   isAuthenticated,
        //   token: !!token,
        // });

        if (isAuthenticated && token) {
          // console.log("📦 Chargement des données...");
          // Charger les stores seulement si authentifié
          await Promise.all([
            initializeFacultyStore().catch((err) =>
              console.warn("Erreur facultés:", err)
            ),
            useEnrollmentStore
              .getState()
              .fetchEnrollments()
              .catch((err) => console.warn("Erreur inscriptions:", err)),
            useAcademicStore
              .getState()
              .fetchStudents()
              .catch((err) => console.warn("Erreur étudiants:", err)),
            useUEStore
              .getState()
              .fetchUEs()
              .catch((err) => console.warn("Erreur UEs:", err)),
            useAcademicYearStore
              .getState()
              .fetchAcademicYears()
              .catch((err) => console.warn("Erreur années académiques:", err)),
            useBackupStore
              .getState()
              .loadBackups()
              .catch((err) => console.warn("Erreur sauvegardes:", err)),
          ]);
        } else {
          // console.log(
          //   "👤 Utilisateur non authentifié, chargement des données différé"
          // );
        }

        // console.log("✅ Initialisation terminée");
        setIsInitializing(false);
      } catch (error: any) {
        // console.error("❌ Erreur lors de l'initialisation:", error);
        setInitializationError(error.message);
        setIsInitializing(false);
      }
    };

    initializeStores();
  }, []);

  // Afficher l'écran de chargement pendant l'initialisation
  if (isInitializing) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LoadingScreen />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Afficher une erreur si l'initialisation a échoué
  if (initializationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Erreur de connexion
          </h1>
          <p className="text-muted-foreground mb-4">
            Impossible de se connecter au serveur. Vérifiez que le backend est
            démarré.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Erreur: {initializationError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppInitializer>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </AppInitializer>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
