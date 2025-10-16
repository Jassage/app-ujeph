// src/pages/LoginPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  GraduationCap,
  AlertCircle,
  University,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { ForgotPassword } from "./ForgotPassword";
import { Toast } from "./ui/toast";

export const LoginPage = () => {
  const { login, isAuthenticated, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirection UNIQUEMENT si authentifié
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Effacer l'erreur quand le composant est monté
  // useEffect(() => {
  //   clearError();
  // }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    setIsSubmitting(true);
    clearError();

    if (!formData.email || !formData.password) {
      toast.error("Veuillez remplir tous les champs");
      // setIsSubmitting(false);
      return;
    }

    try {
      await login(formData.email, formData.password);

      // La redirection se fera via le useEffect
    } catch (err: any) {
      // L'erreur est gérée par le store, on reste sur la page
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // if (error) {
    //   clearError();
    // }
  };

  const isLoading = loading || isSubmitting;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-400/5"></div>
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-lg z-10">
        {/* En-tête avec logo */}
        {/* // Alternative avec layout horizontal pour le logo */}

        {/* Carte de connexion */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 relative overflow-hidden">
          {/* Effet de bordure gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>

          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Connexion au Portail
            </CardTitle>
            <CardDescription className="text-gray-600">
              Accédez à votre espace personnel
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 relative z-10">
            {error && (
              <Alert
                variant="destructive"
                className="animate-in fade-in-50 border-l-4 border-l-red-500"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {error === "Invalid credentials"
                    ? "Email ou mot de passe incorrect"
                    : error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Adresse email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ex: etudiant@ujeph.edu.ht"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-11 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200"
                    required
                    disabled={isLoading}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-gray-700 font-medium flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-11 pr-12 py-3 border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200"
                    required
                    disabled={isLoading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 py-3 text-lg font-semibold"
                disabled={isLoading || !formData.email || !formData.password}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <GraduationCap className="h-5 w-5" />
                    <span>Se connecter</span>
                  </span>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-100">
              <div className="space-y-4">
                <ForgotPassword />

                {/* Informations de contact */}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Université Jérusalem de Pignon d'Haïti.
            Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
};
