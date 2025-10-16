// src/components/LogoutButton.tsx
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export const LogoutButton = () => {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Optionnel: rediriger vers la page de login
    window.location.href = "/login";
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Déconnexion
    </Button>
  );
};
