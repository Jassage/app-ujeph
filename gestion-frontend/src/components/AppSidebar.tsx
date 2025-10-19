import {
  Home,
  Users,
  BookOpen,
  FileText,
  RotateCcw,
  GraduationCap,
  Building2,
  UserCog,
  Calendar,
  UserCheck,
  DollarSign,
  Book,
  MessageSquare,
  CalendarDays,
  Megaphone,
  BarChart3,
  Award,
  MapPin,
  CreditCard,
  ScrollText,
  UserPlus,
  Settings,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAcademicYearStore } from "@/store/academicYearStore";
import { Badge } from "./ui/badge";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: "Admin" | "Professeur" | "Secrétaire" | "Directeur" | "Doyen";
  isDoyen?: boolean;
}

const menuItems = [
  { id: "dashboard", label: "Accueil", icon: Home },
  { id: "students", label: "Étudiants", icon: Users },
  { id: "enrollments", label: "Immatriculations", icon: UserPlus },
  { id: "courses", label: "Les cours", icon: BookOpen },
  { id: "grades", label: "Notes", icon: FileText },
  { id: "retakes", label: "Catalogues", icon: RotateCcw },
  { id: "professeurs", label: "Professeurs", icon: Users },
  { id: "guardians", label: "Tuteurs", icon: Users },
];

const academicItems = [
  { id: "schedules", label: "Emplois du temps", icon: Calendar },
  { id: "attendance", label: "Présences", icon: UserCheck },
  { id: "payments", label: "Paiements", icon: DollarSign },
  { id: "expenses", label: "Dépenses", icon: DollarSign },
  { id: "fees", label: "Frais Scolarite", icon: DollarSign },
  { id: "library", label: "Bibliothèque", icon: Book },
];

const documentItems = [
  { id: "student-cards", label: "Cartes Étudiants", icon: CreditCard },
  { id: "transcripts", label: "Bulletins", icon: ScrollText },
];

const communicationItems = [
  { id: "messaging", label: "Messagerie", icon: MessageSquare },
  { id: "events", label: "Événements", icon: CalendarDays },
  { id: "announcements", label: "Annonces", icon: Megaphone },
];

const analyticsItems = [
  { id: "analytics", label: "Analyses", icon: BarChart3 },
  { id: "scholarships", label: "Bourses", icon: Award },
  { id: "rooms", label: "Salles", icon: MapPin },
];

const adminItems = [
  { id: "users", label: "Utilisateurs", icon: UserCog },
  { id: "faculties", label: "Les Facultés", icon: Building2 },
  { id: "settings", label: "Paramètres", icon: Settings },
  { id: "audit-logs", label: "Journal d'Audit", icon: FileText },
  { id: "backup", label: "Sauvegardes", icon: Shield },
];

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { academicYears, currentAcademicYear } = useAcademicYearStore();

  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="p-4 ujeph-header">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white">
            {/* <GraduationCap className="h-6 w-6" /> */}
            <img
              src="../../../logo.png"
              alt="UJEPH Logo"
              className="h-10 w-10 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col text-white">
              <span className="text-lg font-bold">UJEPH</span>
              <span className="text-xs opacity-90">Université Jerusalem</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Navigation Principale
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      tooltip={isCollapsed ? item.label : undefined}
                      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Gestion Académique
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {academicItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      tooltip={isCollapsed ? item.label : undefined}
                      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Documents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {documentItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      tooltip={isCollapsed ? item.label : undefined}
                      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Communication
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communicationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      tooltip={isCollapsed ? item.label : undefined}
                      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Analyses & Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      tooltip={isCollapsed ? item.label : undefined}
                      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      tooltip={isCollapsed ? item.label : undefined}
                      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-sidebar border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="text-xs text-sidebar-foreground/70">
            <div className="font-medium">Année Académique</div>
            <div>
              {currentAcademicYear && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-100 text-green-800"
                >
                  {currentAcademicYear.year}
                </Badge>
              )}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
