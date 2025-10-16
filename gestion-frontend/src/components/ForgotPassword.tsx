// src/components/ForgotPassword.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

interface ForgotPasswordProps {
  disabled?: boolean;
}

export const ForgotPassword = ({ disabled = false }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simuler l'envoi d'email (à remplacer par votre API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Ici, vous appellerez votre API de réinitialisation de mot de passe
      await api.post("/auth/forgot-password", { email });

      setIsSent(true);
      toast.success("Email de réinitialisation envoyé !");

      // Fermer automatiquement après 3 secondes
      setTimeout(() => {
        setIsOpen(false);
        setIsSent(false);
        setEmail("");
      }, 3000);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'envoi de l'email"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Réinitialiser l'état quand le dialogue se ferme
      setIsSent(false);
      setEmail("");
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="px-0 text-blue-600 hover:text-blue-700 text-sm"
          disabled={disabled}
        >
          Mot de passe oublié ?
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Réinitialisation du mot de passe</DialogTitle>
          <DialogDescription>
            {isSent
              ? "Un email de réinitialisation a été envoyé à votre adresse."
              : "Entrez votre adresse email pour recevoir un lien de réinitialisation."}
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Vérifiez votre boîte mail et suivez les instructions pour
              réinitialiser votre mot de passe.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le lien de réinitialisation"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
