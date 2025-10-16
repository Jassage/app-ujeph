import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  Smartphone,
  Clock,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityData {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
  deviceManagement: boolean;
}

interface SecuritySettingsProps {
  security: SecurityData;
  onSecurityUpdate: (security: SecurityData) => void;
}

export const SecuritySettings = ({ security, onSecurityUpdate }: SecuritySettingsProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SecurityData>(security);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    if (field === 'new') {
      checkPasswordStrength(value);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSecurityChange = (field: keyof SecurityData, value: boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordSave = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (passwordStrength < 3) {
      toast({
        title: "Mot de passe faible",
        description: "Le mot de passe doit être plus sécurisé",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPasswords({ current: '', new: '', confirm: '' });
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été changé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de changer le mot de passe",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onSecurityUpdate(formData);
      toast({
        title: "Paramètres de sécurité mis à jour",
        description: "Vos préférences de sécurité ont été sauvegardées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      handleSecurityChange('twoFactorAuth', true);
      toast({
        title: "2FA activé",
        description: "L'authentification à deux facteurs est maintenant active.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'activer la 2FA",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return { text: "Très faible", color: "text-red-500" };
      case 2: return { text: "Faible", color: "text-orange-500" };
      case 3: return { text: "Moyen", color: "text-yellow-500" };
      case 4: return { text: "Fort", color: "text-green-500" };
      case 5: return { text: "Très fort", color: "text-green-600" };
      default: return { text: "", color: "" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Changement de mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Changement de mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => handlePasswordChange('current', e.target.value)}
                  placeholder="Mot de passe actuel"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => handlePasswordChange('new', e.target.value)}
                  placeholder="Nouveau mot de passe"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwords.new && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          passwordStrength <= 1 ? 'bg-red-500' :
                          passwordStrength <= 2 ? 'bg-orange-500' :
                          passwordStrength <= 3 ? 'bg-yellow-500' :
                          passwordStrength <= 4 ? 'bg-green-500' : 'bg-green-600'
                        }`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs ${getPasswordStrengthText().color}`}>
                      {getPasswordStrengthText().text}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                  placeholder="Confirmer le mot de passe"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Votre mot de passe doit contenir au moins 8 caractères avec des majuscules, minuscules, chiffres et symboles.
            </AlertDescription>
          </Alert>

          <Button onClick={handlePasswordSave} disabled={isLoading} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Changement...' : 'Changer le mot de passe'}
          </Button>
        </CardContent>
      </Card>

      {/* Authentification à deux facteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentification à deux facteurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Authentification à deux facteurs (2FA)</Label>
              <p className="text-sm text-muted-foreground">
                Sécurisez votre compte avec un code à usage unique
              </p>
            </div>
            <div className="flex items-center gap-2">
              {formData.twoFactorAuth && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Activé
                </Badge>
              )}
              <Switch
                checked={formData.twoFactorAuth}
                onCheckedChange={(checked) => {
                  if (checked) {
                    enable2FA();
                  } else {
                    handleSecurityChange('twoFactorAuth', false);
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          {formData.twoFactorAuth && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                La 2FA est active. Utilisez votre application d'authentification pour générer des codes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Autres paramètres de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Paramètres de sécurité avancés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertes de connexion</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir une notification lors de nouvelles connexions
                </p>
              </div>
              <Switch
                checked={formData.loginAlerts}
                onCheckedChange={(checked) => handleSecurityChange('loginAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gestion des appareils</Label>
                <p className="text-sm text-muted-foreground">
                  Autoriser la gestion des appareils connectés
                </p>
              </div>
              <Switch
                checked={formData.deviceManagement}
                onCheckedChange={(checked) => handleSecurityChange('deviceManagement', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Délai d'expiration de session</Label>
              <div className="flex items-center gap-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="5"
                  max="480"
                  value={formData.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Délai après lequel vous serez automatiquement déconnecté (5-480 minutes)
              </p>
            </div>
          </div>

          <Button onClick={handleSecuritySave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};