import React, { useState, useEffect, createContext, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Settings,
  Shield,
  Bell,
  Palette,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  Camera,
  Mail,
  Phone,
  ArrowLeft,
  Database,
  HardDrive,
  Server,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Contexte pour la gestion du thème
const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Récupérer le thème depuis le localStorage ou utiliser la préférence système
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;

    // Préférence système
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    // Appliquer le thème au document
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Sauvegarder le thème dans le localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Écouter les changements de préférence système
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Simulation d'un hook d'authentification
const useAuth = () => {
  return {
    user: {
      id: 1,
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@ujeph.edu.ht",
      phone: "+509 1234 5678",
      bio: "Administrateur système à l'Université Saint Joseph de Pétionville",
      address: "Pétion-Ville, Haïti",
      birthDate: "1985-06-15",
      department: "Administration Système",
      position: "Administrateur Principal",
      avatar: "/avatars/admin.png",
    },
    updateProfile: async (data) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("Profil mis à jour:", data);
          resolve({ success: true });
        }, 1000);
      });
    },
    changePassword: async (currentPassword, newPassword) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("Mot de passe changé");
          resolve({ success: true });
        }, 1000);
      });
    },
  };
};

// Composant ProfileSettings
const ProfileSettings = ({ profile, onProfileUpdate }) => {
  const [formData, setFormData] = useState(profile);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      onProfileUpdate(formData);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar} />
              <AvatarFallback>
                {formData.firstName?.[0]}
                {formData.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-medium">Photo de profil</h3>
            <p className="text-sm text-muted-foreground">
              JPG, GIF ou PNG. 1 Mo max.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Changer
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive">
                Supprimer
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              Email <Mail className="h-3 w-3" />
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              Téléphone <Phone className="h-3 w-3" />
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Date de naissance</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange("birthDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Département</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => handleChange("department", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Poste</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange("position", e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
      </CardContent>
    </Card>
  );
};

// Composant SecuritySettings
const SecuritySettings = ({ security, onSecurityUpdate }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { toast } = useToast();

  const handleSecurityChange = (field, value) => {
    onSecurityUpdate({ ...security, [field]: value });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      toast({
        title: "Succès",
        description: "Votre mot de passe a été modifié avec succès.",
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Le mot de passe actuel est incorrect.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sécurité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Changer le mot de passe</h3>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  handlePasswordChange("currentPassword", e.target.value)
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={passwordForm.newPassword}
              onChange={(e) =>
                handlePasswordChange("newPassword", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirmer le nouveau mot de passe
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                handlePasswordChange("confirmPassword", e.target.value)
              }
            />
          </div>

          <Button onClick={handlePasswordUpdate} disabled={isLoading}>
            {isLoading ? "Changement..." : "Changer le mot de passe"}
          </Button>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sécurité du compte</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Authentification à deux facteurs (2FA)</Label>
              <p className="text-sm text-muted-foreground">
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </p>
            </div>
            <Switch
              checked={security.twoFactorAuth}
              onCheckedChange={(checked) =>
                handleSecurityChange("twoFactorAuth", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertes de connexion</Label>
              <p className="text-sm text-muted-foreground">
                Recevez une alerte en cas de nouvelle connexion
              </p>
            </div>
            <Switch
              checked={security.loginAlerts}
              onCheckedChange={(checked) =>
                handleSecurityChange("loginAlerts", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Gestion des appareils</Label>
              <p className="text-sm text-muted-foreground">
                Voir et gérer les appareils connectés à votre compte
              </p>
            </div>
            <Switch
              checked={security.deviceManagement}
              onCheckedChange={(checked) =>
                handleSecurityChange("deviceManagement", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Délai d'expiration de session (minutes)</Label>
            <Select
              value={security.sessionTimeout.toString()}
              onValueChange={(value) =>
                handleSecurityChange("sessionTimeout", parseInt(value))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 heure</SelectItem>
                <SelectItem value="120">2 heures</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant AppearanceSettings pour la gestion de l'apparence
const AppearanceSettings = ({ appearance, onAppearanceUpdate }) => {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      onAppearanceUpdate({
        ...appearance,
        theme: theme, // Utiliser le thème actuel du contexte
      });
      toast({
        title: "Apparence mise à jour",
        description: "Vos préférences d'apparence ont été sauvegardées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Apparence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Thème</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" /> Clair
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" /> Sombre
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Système
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choisissez le thème de l'application.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Format de date</Label>
            <Select
              value={appearance.dateFormat}
              onValueChange={(value) =>
                onAppearanceUpdate({ ...appearance, dateFormat: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format d'heure</Label>
            <Select
              value={appearance.timeFormat}
              onValueChange={(value) =>
                onAppearanceUpdate({ ...appearance, timeFormat: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 heures</SelectItem>
                <SelectItem value="12h">12 heures (AM/PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Langue</Label>
            <Select
              value={appearance.language}
              onValueChange={(value) =>
                onAppearanceUpdate({ ...appearance, language: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Aperçu des thèmes */}
        <div className="space-y-4">
          <Label>Aperçu des thèmes</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer ${
                theme === "light" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setTheme("light")}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-4 w-4" />
                <span>Clair</span>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-6 rounded bg-[#f8fafc] border"></div>
                <div className="w-3 h-6 rounded bg-[#e2e8f0] border"></div>
                <div className="w-3 h-6 rounded bg-[#cbd5e1] border"></div>
                <div className="w-3 h-6 rounded bg-[#94a3b8] border"></div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 cursor-pointer ${
                theme === "dark" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setTheme("dark")}
            >
              <div className="flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4" />
                <span>Sombre</span>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-6 rounded bg-[#1e293b] border"></div>
                <div className="w-3 h-6 rounded bg-[#334155] border"></div>
                <div className="w-3 h-6 rounded bg-[#475569] border"></div>
                <div className="w-3 h-6 rounded bg-[#64748b] border"></div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 cursor-pointer ${
                theme === "system" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setTheme("system")}
            >
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="h-4 w-4" />
                <span>Système</span>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-6 rounded bg-[#f8fafc] dark:bg-[#1e293b] border"></div>
                <div className="w-3 h-6 rounded bg-[#e2e8f0] dark:bg-[#334155] border"></div>
                <div className="w-3 h-6 rounded bg-[#cbd5e1] dark:bg-[#475569] border"></div>
                <div className="w-3 h-6 rounded bg-[#94a3b8] dark:bg-[#64748b] border"></div>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Enregistrement..." : "Sauvegarder l'apparence"}
        </Button>
      </CardContent>
    </Card>
  );
};

export const SettingsPage = () => {
  const { toast } = useToast();
  const auth = useAuth();
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState({
    profile: { ...auth.user },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      academicAlerts: true,
      paymentReminders: true,
      systemUpdates: false,
    },
    appearance: {
      theme: theme,
      language: "fr",
      dateFormat: "dd/mm/yyyy",
      timeFormat: "24h",
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginAlerts: true,
      deviceManagement: true,
    },
    academic: {
      defaultAcademicYear: "2024-2025",
      defaultSemester: "Semestre 1",
      autoSaveInterval: 5,
    },
  });

  const handleSave = async (section) => {
    try {
      if (section === "profile") {
        await auth.updateProfile(settings.profile);
      }

      toast({
        title: "Paramètres sauvegardés",
        description: `Les paramètres de ${section} ont été mis à jour avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = (profile) => {
    setSettings((prev) => ({
      ...prev,
      profile,
    }));
  };

  const handleSecurityUpdate = (security) => {
    setSettings((prev) => ({
      ...prev,
      security,
    }));
  };

  const handleAppearanceUpdate = (appearance) => {
    setSettings((prev) => ({
      ...prev,
      appearance,
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apparence
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Système
          </TabsTrigger>
        </TabsList>

        {/* Profil */}
        <TabsContent value="profile">
          <ProfileSettings
            profile={settings.profile}
            onProfileUpdate={handleProfileUpdate}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => handleSave("profil")}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder le profil
            </Button>
          </div>
        </TabsContent>

        {/* Apparence */}
        <TabsContent value="appearance">
          <AppearanceSettings
            appearance={settings.appearance}
            onAppearanceUpdate={handleAppearanceUpdate}
          />
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security">
          <SecuritySettings
            security={settings.security}
            onSecurityUpdate={handleSecurityUpdate}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => handleSave("sécurité")}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder la sécurité
            </Button>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Préférences de notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les notifications importantes par email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          emailNotifications: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les notifications en temps réel
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          pushNotifications: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertes académiques</Label>
                    <p className="text-sm text-muted-foreground">
                      Notes, présences, échéances importantes
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.academicAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          academicAlerts: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rappels de paiement</Label>
                    <p className="text-sm text-muted-foreground">
                      Échéances de paiement et factures
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.paymentReminders}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          paymentReminders: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mises à jour système</Label>
                    <p className="text-sm text-muted-foreground">
                      Nouvelles fonctionnalités et maintenance
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemUpdates}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          systemUpdates: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSave("notifications")}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les notifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Préférences académiques */}
        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Paramètres système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Année académique par défaut</Label>
                  <Select
                    value={settings.academic.defaultAcademicYear}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        academic: {
                          ...settings.academic,
                          defaultAcademicYear: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Semestre par défaut</Label>
                  <Select
                    value={settings.academic.defaultSemester}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        academic: {
                          ...settings.academic,
                          defaultSemester: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semestre 1">Semestre 1</SelectItem>
                      <SelectItem value="Semestre 2">Semestre 2</SelectItem>
                      <SelectItem value="Semestre d'été">
                        Semestre d'été
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sauvegarde automatique (minutes)</Label>
                  <Select
                    value={settings.academic.autoSaveInterval.toString()}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        academic: {
                          ...settings.academic,
                          autoSaveInterval: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Taille du cache (MB)</Label>
                  <Select
                    defaultValue="100"
                    onValueChange={(value) => console.log("Cache size:", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 MB</SelectItem>
                      <SelectItem value="100">100 MB</SelectItem>
                      <SelectItem value="250">250 MB</SelectItem>
                      <SelectItem value="500">500 MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode maintenance</Label>
                    <p className="text-sm text-muted-foreground">
                      Activer le mode maintenance pour les autres utilisateurs
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Journalisation des erreurs</Label>
                    <p className="text-sm text-muted-foreground">
                      Enregistrer les erreurs système dans un journal
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mises à jour automatiques</Label>
                    <p className="text-sm text-muted-foreground">
                      Télécharger et installer les mises à jour automatiquement
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Button
                onClick={() => handleSave("système")}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les paramètres
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
