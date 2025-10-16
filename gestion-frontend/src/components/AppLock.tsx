// components/AppLock.tsx - Version mise à jour
import { useAuth } from "@/contexts/AuthContext";
import { useAuthStore } from "@/store/authStore";
import { ArrowRightSquareIcon, LockIcon } from "lucide-react";
import React, { useState } from "react";

export const AppLock: React.FC = () => {
  const { unlock, logout, user } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { verifyPassword } = useAuthStore();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Appel API pour vérifier le mot de passe
      await verifyPassword(password);
      unlock();
    } catch (err: any) {
      setError(err.message || "Erreur de vérification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-100 rounded-full">
            <LockIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Application verrouillée
          </h2>
          <p className="mt-2 text-gray-600">
            Votre session a expiré due à l'inactivité
          </p>
          {user && (
            <p className="mt-1 text-sm text-gray-500">
              Connecté en tant que{" "}
              <span className="font-medium">{user.name}</span>
            </p>
          )}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleUnlock} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Mot de passe de déverrouillage
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center">
                <LockIcon className="h-4 w-4 mr-2" />
                {error}
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isLoading || !password}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vérification...
                </span>
              ) : (
                "Déverrouiller"
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-2 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              <ArrowRightSquareIcon className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </form>

        {/* Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            💡 Pour des raisons de sécurité, l'application se verrouille
            automatiquement après 30 minutes d'inactivité.
          </p>
        </div>
      </div>
    </div>
  );
};
