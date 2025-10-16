import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/store/userStore";
import { User } from "../types/academic";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";

// Schéma de validation avec Zod
const userSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "Le prénom doit contenir au moins 2 caractères" })
    .max(50, { message: "Le prénom ne peut pas dépasser 50 caractères" })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
      message: "Le prénom contient des caractères invalides",
    }),
  lastName: z
    .string()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères" })
    .max(50, { message: "Le nom ne peut pas dépasser 50 caractères" })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
      message: "Le nom contient des caractères invalides",
    }),
  email: z.string().email({ message: "Adresse email invalide" }),
  phone: z
    .string()
    .regex(/^(\+\d{1,3})?[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/, {
      message: "Numéro de téléphone invalide",
    })
    .optional()
    .or(z.literal("")),
  role: z.enum(["Admin", "Professeur", "Secrétaire", "Directeur", "Doyen"]),
  status: z.enum(["Actif", "Inactif"]),
  password: z
    .string()
    .min(8, {
      message: "Le mot de passe doit contenir au moins 8 caractères",
    })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message:
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
    })
    .optional()
    .or(z.literal("")),
});

type UserFormData = z.infer<typeof userSchema>;

export const UsersManager = () => {
  const {
    users,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    loading,
    error,
  } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: "asc" | "desc";
  } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Initialisation du formulaire avec react-hook-form et zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "Admin",
      status: "Actif",
      password: "",
    },
  });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getAvailableRoles = () => {
    // Cast to any to avoid TypeScript error when "Doyen" is not part of the declared role union
    if ((currentUser?.role as any) === "Doyen") {
      return ["Professeur", "Secrétaire"]; // Les doyens ne peuvent créer que ces rôles
    }
    return ["Admin", "Professeur", "Secrétaire", "Directeur", "Doyen"];
  };

  // Cacher le bouton de suppression pour certains rôles
  const canDeleteUser = (targetUser: User) => {
    if (currentUser?.role === "Doyen") {
      // Les doyens ne peuvent pas supprimer d'admins ou d'autres doyens
      return !["Admin", "Doyen"].includes(targetUser.role);
    }
    return true;
  };

  // Fonction pour ouvrir le formulaire d'édition
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setValue("firstName", user.firstName);
    setValue("lastName", user.lastName);
    setValue("email", user.email);
    setValue("phone", user.phone || "");
    setValue("role", user.role);
    setValue("status", user.status);
    setValue("password", ""); // On ne remplit pas le mot de passe pour l'édition
    setIsFormOpen(true);
  };

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setEditingUser(null);
    reset({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "Admin",
      status: "Actif",
      password: "",
    });
  };

  // Soumission du formulaire
  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        // Mise à jour d'un utilisateur existant
        await updateUser(editingUser.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          status: data.status,
        });

        toast({
          title: "Utilisateur mis à jour",
          description: `L'utilisateur ${data.firstName} ${data.lastName} a été modifié avec succès`,
        });
      } else {
        // Création d'un nouvel utilisateur
        await createUser({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          status: data.status,
          password: data.password as string,
          lastLogin: "",
          avatar: "",
        });

        toast({
          title: "Utilisateur créé",
          description: `L'utilisateur ${data.firstName} ${data.lastName} a été ajouté avec succès`,
        });
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (
      confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userName} ?`)
    ) {
      try {
        await deleteUser(userId);
        toast({
          title: "Suppression réussie",
          description: "L'utilisateur a été supprimé avec succès",
        });
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "Actif" ? "Inactif" : "Actif";
    const action = newStatus === "Actif" ? "activer" : "désactiver";

    if (
      confirm(
        `Êtes-vous sûr de vouloir ${action} l'utilisateur ${user.firstName} ${user.lastName} ?`
      )
    ) {
      try {
        // Utilisez directement les données de l'utilisateur
        await updateUser(user.id, {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          status: newStatus,
        });

        toast({
          title: "Statut modifié",
          description: `L'utilisateur a été ${
            newStatus === "Actif" ? "activé" : "désactivé"
          } avec succès`,
        });
      } catch (error: any) {
        toast({
          title: "Erreur",
          description:
            error.message || "Erreur lors de la modification du statut",
          variant: "destructive",
        });
      }
    }
  };

  const handleSort = (key: keyof User) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Trier les utilisateurs
  const sortedUsers = [...filteredUsers];
  if (sortConfig !== null) {
    sortedUsers.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Professeur":
        return "bg-green-100 text-green-800";
      case "Directeur":
        return "bg-yellow-100 text-yellow-800";
      case "Secrétaire":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "Actif" ? "default" : "secondary";
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof User }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronDown className="h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (loading)
    return <div className="flex justify-center p-8">Chargement...</div>;
  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Erreur de chargement des utilisateurs</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser
                  ? "Modifier Utilisateur"
                  : "Ajouter un utilisateur"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder="Prénom"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder="Nom"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Téléphone"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder="Mot de passe"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={watch("role")}
                  onValueChange={(value: User["role"]) =>
                    setValue("role", value)
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value: User["status"]) =>
                    setValue("status", value)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actif">Actif</SelectItem>
                    <SelectItem value="Inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Traitement..."
                    : editingUser
                    ? "Modifier"
                    : "Ajouter"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Professeur">Professeur</SelectItem>
              <SelectItem value="Secrétaire">Secrétaire</SelectItem>
              <SelectItem value="Directeur">Directeur</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Actif">Actif</SelectItem>
              <SelectItem value="Inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-sm ujeph-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("firstName")}
                  >
                    <div className="flex items-center">
                      <span>Utilisateur</span>
                      <SortIcon columnKey="firstName" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center">
                      <span>Email</span>
                      <SortIcon columnKey="email" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center">
                      <span>Rôle</span>
                      <SortIcon columnKey="role" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      <span>Statut</span>
                      <SortIcon columnKey="status" />
                    </div>
                  </TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.phone || "Non renseigné"}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user)}
                            className={
                              user.status === "Actif"
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {user.status === "Actif" ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          // Dans les actions du dropdown
                          {canDeleteUser(user) && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleDelete(
                                  user.id,
                                  `${user.firstName} ${user.lastName}`
                                )
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {sortedUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
