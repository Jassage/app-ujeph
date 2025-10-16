import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Loader2,
  User,
  Users2,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";
import { useAcademicStore } from "../store/studentStore";
import { useGradeStore } from "../store/gradeStore";
import { useEnrollmentStore } from "../store/enrollmentStore";
import { useAcademicYearStore } from "../store/academicYearStore";
import { useState, useMemo, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types pour les données académiques
interface AcademicYearData {
  year: string;
  students: any[];
  ues: any[];
  grades: any[];
  retakes: any[];
  enrollments: any[];
  maleStudents: number;
  femaleStudents: number;
}

// Fonction pour vérifier si une date est dans l'année académique
const isInAcademicYear = (
  date: Date,
  startDate: string,
  endDate: string
): boolean => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date >= start && date <= end;
  } catch {
    return false;
  }
};

// Fonction pour filtrer les données par année académique
const filterByAcademicYear = (
  data: any[],
  startDate: string,
  endDate: string,
  dateField: string = "createdAt"
): any[] => {
  if (!Array.isArray(data) || !startDate || !endDate) {
    return [];
  }

  return data.filter((item) => {
    try {
      const itemDate = item[dateField] ? new Date(item[dateField]) : new Date();
      return isInAcademicYear(itemDate, startDate, endDate);
    } catch {
      return false;
    }
  });
};

// Composant de graphique en barres responsive
const BarChart = ({
  data,
  title,
  color = "#3b82f6",
}: {
  data: any[];
  title: string;
  color?: string;
}) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
        <div className="text-center text-muted-foreground text-sm py-4">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value || 0), 1);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-xs font-medium w-12 md:w-16 truncate text-foreground">
              {item.label}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-foreground">{item.value || 0}</span>
                <span className="text-muted-foreground">
                  {Math.round(((item.value || 0) / maxValue) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${((item.value || 0) / maxValue) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant de graphique circulaire responsive
const PieChartComponent = ({ data, title }: { data: any[]; title: string }) => {
  const validData = Array.isArray(data)
    ? data.filter((item) => item.value > 0)
    : [];
  const total = validData.reduce((sum, item) => sum + (item.value || 0), 0);
  const colors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
  ];

  if (total === 0 || validData.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
        <div className="text-center text-muted-foreground text-sm py-4">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  let cumulativePercentage = 0;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex justify-center md:justify-start">
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {validData.map((item, index) => {
                const percentage = ((item.value || 0) / total) * 100;
                const circumference = 2 * Math.PI * 45;
                const strokeDasharray = `${
                  (percentage / 100) * circumference
                } ${circumference}`;
                const rotation = cumulativePercentage * 3.6;
                const color = item.color || colors[index % colors.length];

                cumulativePercentage += percentage;

                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="10"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={circumference / 4}
                    transform={`rotate(${rotation} 50 50)`}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm md:text-lg font-bold text-foreground">
                  {total}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {validData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      item.color || colors[index % colors.length],
                  }}
                />
                <span className="truncate text-foreground">{item.label}</span>
              </div>
              <span className="font-medium text-foreground ml-2 flex-shrink-0">
                {Math.round(((item.value || 0) / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Composant pour l'indicateur de vue responsive
const ResponsiveViewIndicator = () => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getViewType = () => {
    if (windowWidth < 768)
      return { icon: Smartphone, label: "Mobile", color: "text-blue-500" };
    if (windowWidth < 1024)
      return { icon: Tablet, label: "Tablette", color: "text-green-500" };
    return { icon: Monitor, label: "Desktop", color: "text-purple-500" };
  };

  const viewType = getViewType();
  const Icon = viewType.icon;

  return (
    <Badge
      variant="outline"
      className="hidden sm:flex items-center gap-1 text-xs"
    >
      <Icon className={`h-3 w-3 ${viewType.color}`} />
      {viewType.label}
    </Badge>
  );
};

export const Dashboard = () => {
  const {
    students = [],
    ues = [],
    grades: academicGrades = [],
    loading: academicLoading,
    fetchStudents,
    fetchGrades,
    fetchUEs,
  } = useAcademicStore();

  const { grades: gradeStoreGrades = [], fetchGrades: fetchGradeStoreGrades } =
    useGradeStore();

  const { enrollments = [], fetchEnrollments } = useEnrollmentStore();
  const {
    academicYears = [],
    currentAcademicYear,
    fetchAcademicYears,
  } = useAcademicYearStore();

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );
  const [selectedChart, setSelectedChart] = useState("performance");
  const [loading, setLoading] = useState(true);

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAcademicYears(),
          fetchStudents(),
          fetchGrades(),
          fetchUEs(),
          fetchEnrollments(),
          fetchGradeStoreGrades(),
        ]);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Définir l'année académique par défaut
  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      setSelectedAcademicYear(currentAcademicYear || academicYears[0]);
    }
  }, [academicYears, currentAcademicYear, selectedAcademicYear]);

  // CORRECTION : Combiner les grades des deux stores avec vérification
  const allGrades = useMemo(() => {
    const academicGradesArray = Array.isArray(academicGrades)
      ? academicGrades
      : [];
    const gradeStoreGradesArray = Array.isArray(gradeStoreGrades)
      ? gradeStoreGrades
      : [];

    return [...academicGradesArray, ...gradeStoreGradesArray];
  }, [academicGrades, gradeStoreGrades]);

  // Filtrer les données par année académique sélectionnée
  const filteredData = useMemo(() => {
    if (
      !selectedAcademicYear ||
      !selectedAcademicYear.startDate ||
      !selectedAcademicYear.endDate
    ) {
      return {
        students: [],
        ues: [],
        grades: [],
        enrollments: [],
      };
    }

    return {
      students: filterByAcademicYear(
        students,
        selectedAcademicYear.startDate,
        selectedAcademicYear.endDate
      ),
      ues: filterByAcademicYear(
        ues,
        selectedAcademicYear.startDate,
        selectedAcademicYear.endDate
      ),
      grades: filterByAcademicYear(
        allGrades,
        selectedAcademicYear.startDate,
        selectedAcademicYear.endDate
      ),
      enrollments: filterByAcademicYear(
        enrollments,
        selectedAcademicYear.startDate,
        selectedAcademicYear.endDate
      ),
    };
  }, [students, ues, allGrades, enrollments, selectedAcademicYear]);

  // Données pour l'année académique sélectionnée
  const yearData: AcademicYearData = useMemo(() => {
    const studentsArray = Array.isArray(filteredData.students)
      ? filteredData.students
      : [];
    const gradesArray = Array.isArray(filteredData.grades)
      ? filteredData.grades
      : [];

    return {
      year: selectedAcademicYear?.year || "N/A",
      students: studentsArray,
      ues: Array.isArray(filteredData.ues) ? filteredData.ues : [],
      grades: gradesArray,
      retakes: gradesArray.filter(
        (grade) =>
          grade.status === "À_reprendre" || grade.status === "À reprendre"
      ),
      enrollments: Array.isArray(filteredData.enrollments)
        ? filteredData.enrollments
        : [],
      maleStudents: studentsArray.filter(
        (student) => student.sexe === "Masculin"
      ).length,
      femaleStudents: studentsArray.filter(
        (student) => student.sexe === "Feminin"
      ).length,
    };
  }, [selectedAcademicYear, filteredData]);

  // Calculs des statistiques avec vérifications
  const totalStudents = yearData.students.length;
  const activeStudents = yearData.students.filter(
    (s) => s.status === "Active"
  ).length;
  const graduatedStudents = yearData.students.filter(
    (s) => s.status === "Graduated"
  ).length;

  const studentsWithRetakes = yearData.students.filter((student) => {
    return yearData.grades.some(
      (grade) =>
        grade.studentId === student.id &&
        (grade.status === "À_reprendre" || grade.status === "À reprendre")
    );
  }).length;

  const totalUEs = yearData.ues.length;
  const totalGrades = yearData.grades.length;
  const passedGrades = yearData.grades.filter(
    (g) => g.status === "Validé"
  ).length;
  const failedGrades = yearData.grades.filter(
    (g) =>
      g.status === "Non_validé" ||
      g.status === "À_reprendre" ||
      g.status === "À reprendre"
  ).length;

  const successRate =
    totalGrades > 0 ? Math.round((passedGrades / totalGrades) * 100) : 0;
  const retakeRate =
    totalStudents > 0
      ? Math.round((studentsWithRetakes / totalStudents) * 100)
      : 0;

  const averageGrade =
    totalGrades > 0
      ? (
          yearData.grades.reduce(
            (sum: number, grade: any) => sum + (grade.score || 0),
            0
          ) / totalGrades
        ).toFixed(1)
      : "0.0";

  // Données pour les graphiques avec vérifications
  const uePerformanceData = useMemo(() => {
    if (!Array.isArray(yearData.grades) || !Array.isArray(yearData.ues)) {
      return [];
    }

    const ueStats: Record<string, { total: number; passed: number }> = {};

    yearData.grades.forEach((grade) => {
      const ueId = grade.ueId;
      if (!ueStats[ueId]) {
        ueStats[ueId] = { total: 0, passed: 0 };
      }
      ueStats[ueId].total++;
      if (grade.status === "Validé") {
        ueStats[ueId].passed++;
      }
    });

    return Object.entries(ueStats)
      .map(([ueId, stats]) => {
        const ue = yearData.ues.find((u) => u.id === ueId);
        return {
          label: ue?.title || ueId,
          value:
            stats.total > 0
              ? Math.round((stats.passed / stats.total) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [yearData.grades, yearData.ues]);

  const studentDistributionData = useMemo(() => {
    if (!Array.isArray(yearData.enrollments)) return [];

    const distribution: Record<string, number> = {};
    yearData.enrollments.forEach((enrollment) => {
      const level = enrollment.level || "Non spécifié";
      distribution[level] = (distribution[level] || 0) + 1;
    });

    return Object.entries(distribution).map(([label, value]) => ({
      label,
      value,
    }));
  }, [yearData.enrollments]);

  const genderDistributionData = useMemo(() => {
    const female = yearData.femaleStudents || 0;
    const male = yearData.maleStudents || 0;
    const unspecified = Math.max(0, totalStudents - female - male);

    return [
      {
        label: "Filles",
        value: female,
        color: "#ec4899",
      },
      {
        label: "Garçons",
        value: male,
        color: "#06b6d4",
      },
      {
        label: "Non spécifié",
        value: unspecified,
        color: "#6b7280",
      },
    ].filter((item) => item.value > 0);
  }, [yearData, totalStudents]);

  const gradeDistributionData = useMemo(() => {
    if (!Array.isArray(yearData.grades)) {
      return [
        { label: "0-25", value: 0 },
        { label: "26-50", value: 0 },
        { label: "51-75", value: 0 },
        { label: "76-100", value: 0 },
      ];
    }

    const distribution = [
      { label: "0-25", value: 0 },
      { label: "26-50", value: 0 },
      { label: "51-75", value: 0 },
      { label: "76-100", value: 0 },
    ];

    yearData.grades.forEach((grade) => {
      const score = grade.score || 0;
      if (score <= 25) distribution[0].value++;
      else if (score <= 50) distribution[1].value++;
      else if (score <= 75) distribution[2].value++;
      else distribution[3].value++;
    });

    return distribution;
  }, [yearData.grades]);

  const statusDistributionData = [
    { label: "Actifs", value: activeStudents },
    { label: "Diplômés", value: graduatedStudents },
    {
      label: "Inactifs",
      value: Math.max(0, totalStudents - activeStudents - graduatedStudents),
    },
  ].filter((item) => item.value > 0);

  // Formater les dates
  const formattedStartDate = selectedAcademicYear
    ? new Date(selectedAcademicYear.startDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const formattedEndDate = selectedAcademicYear
    ? new Date(selectedAcademicYear.endDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  // Calculer les jours restants
  const daysRemaining = selectedAcademicYear
    ? Math.ceil(
        (new Date(selectedAcademicYear.endDate).getTime() -
          new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Données pour les cartes de statistiques
  const quickStats = [
    {
      title: "Étudiants Actifs",
      value: activeStudents,
      total: totalStudents,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100/80 dark:bg-blue-900/30",
      trend: "+12%",
      change: "positive" as const,
      description: "Étudiants en cours de formation",
    },
    {
      title: "Filles",
      value: yearData.femaleStudents,
      total: totalStudents,
      icon: User,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100/80 dark:bg-pink-900/30",
      trend: "+8%",
      change: "positive" as const,
      description: "Étudiantes inscrites",
    },
    {
      title: "Garçons",
      value: yearData.maleStudents,
      total: totalStudents,
      icon: Users2,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100/80 dark:bg-cyan-900/30",
      trend: "+5%",
      change: "positive" as const,
      description: "Étudiants inscrits",
    },
    {
      title: "Unités d'Enseignement",
      value: totalUEs,
      icon: BookOpen,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100/80 dark:bg-green-900/30",
      trend: "+3%",
      change: "positive" as const,
      description: "Total des UE disponibles",
    },
    {
      title: "Diplômés",
      value: graduatedStudents,
      icon: GraduationCap,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100/80 dark:bg-purple-900/30",
      trend: "+8%",
      change: "positive" as const,
      description: "Étudiants ayant terminé",
    },
    {
      title: "Reprises",
      value: studentsWithRetakes,
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100/80 dark:bg-orange-900/30",
      trend: "-5%",
      change: "negative" as const,
      description: "Étudiants en rattrapage",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/20 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!selectedAcademicYear) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/20 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Aucune année académique
          </h2>
          <p className="text-muted-foreground">
            Veuillez configurer une année académique dans le système
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header avec navigation */}
        <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Tableau de Bord Académique
            </h1>
            <div className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Vue d'ensemble pour l'année académique {selectedAcademicYear.year}
              {selectedAcademicYear.isCurrent && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                >
                  En cours
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <ResponsiveViewIndicator />

            {/* Sélecteur d'année académique pour mobile */}
            <div className="md:hidden w-full">
              <Select
                value={selectedAcademicYear.id}
                onValueChange={(value) => {
                  const year = academicYears.find((y) => y.id === value);
                  if (year) setSelectedAcademicYear(year);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedAcademicYear.year}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{year.year}</span>
                        {year.isCurrent && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          >
                            Actuelle
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sélecteur d'année académique pour desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-2 hidden md:flex"
                >
                  <Calendar className="h-4 w-4" />
                  {selectedAcademicYear.year}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {academicYears.map((year) => (
                  <DropdownMenuItem
                    key={year.id}
                    onClick={() => setSelectedAcademicYear(year)}
                    className={
                      selectedAcademicYear.id === year.id
                        ? "bg-accent font-medium"
                        : ""
                    }
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{year.year}</span>
                      {year.isCurrent && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        >
                          Actuelle
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border-2 border-gray-200 dark:border-gray-700">
              {["week", "month", "year"].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range as any)}
                  className="text-xs transition-all duration-200 px-2 md:px-3"
                >
                  {range === "week"
                    ? "Sem."
                    : range === "month"
                    ? "Mois"
                    : "Année"}
                </Button>
              ))}
            </div>

            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hidden sm:flex"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Exporter</span>
            </Button>
          </div>
        </div>

        {/* Bannière d'année académique */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-white/20 rounded-lg md:rounded-xl backdrop-blur-sm">
                <Calendar className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-semibold truncate">
                  Année Académique {selectedAcademicYear.year}
                </h2>
                <p className="text-blue-100 text-sm md:text-base truncate">
                  Du {formattedStartDate} au {formattedEndDate}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="mt-3 md:mt-0 bg-white/20 text-white border-none self-start md:self-auto"
            >
              {daysRemaining} jours restants
            </Badge>
          </div>
        </div>

        {/* Cartes de statistiques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.title}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1 md:mb-2 truncate">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline space-x-1 md:space-x-2 mb-1">
                        <p className="text-xl md:text-2xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        {stat.total && (
                          <span className="text-xs md:text-sm text-muted-foreground">
                            / {stat.total}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 md:mb-2 line-clamp-2">
                        {stat.description}
                      </p>
                      <div className="flex items-center">
                        {stat.change === "positive" ? (
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            stat.change === "positive"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`p-2 md:p-3 rounded-lg md:rounded-xl ${stat.bgColor} flex-shrink-0 ml-2`}
                    >
                      <Icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation des graphiques */}
        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border-2 border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: "performance", label: "Performance", icon: BarChart3 },
            { id: "distribution", label: "Distribution", icon: PieChart },
            { id: "comparison", label: "Comparaison", icon: Activity },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={selectedChart === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedChart(item.id)}
                className="text-xs transition-all duration-200 gap-1 md:gap-2 whitespace-nowrap"
              >
                <Icon className="h-3 w-3" />
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* Grille principale des graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Graphique 1: Performance des UE */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Performance par Cours
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Moy: {averageGrade}
              </Badge>
            </CardHeader>
            <CardContent>
              <BarChart
                data={uePerformanceData}
                title="Taux de réussite par matière"
                color="#3b82f6"
              />
            </CardContent>
          </Card>

          {/* Graphique 2: Distribution des étudiants */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-green-600" />
                Distribution des Étudiants
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Total: {totalStudents}
              </Badge>
            </CardHeader>
            <CardContent>
              <PieChartComponent
                data={statusDistributionData}
                title="Répartition par statut"
              />
            </CardContent>
          </Card>

          {/* Graphique 3: Distribution des notes */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-600" />
                Distribution des Notes
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {totalGrades} notes
              </Badge>
            </CardHeader>
            <CardContent>
              <BarChart
                data={gradeDistributionData}
                title="Répartition des notes"
                color="#f59e0b"
              />
            </CardContent>
          </Card>

          {/* Graphique 4: Répartition par sexe */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-pink-600" />
                Répartition par Sexe
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Total: {totalStudents}
              </Badge>
            </CardHeader>
            <CardContent>
              <PieChartComponent
                data={genderDistributionData}
                title="Répartition des étudiants par sexe"
              />
            </CardContent>
          </Card>

          {/* Graphique 5: Par année d'étude */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                Effectif par Année
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Par promotion
              </Badge>
            </CardHeader>
            <CardContent>
              <BarChart
                data={studentDistributionData}
                title="Étudiants par année d'étude"
                color="#8b5cf6"
              />
            </CardContent>
          </Card>

          {/* Graphique 6: Taux de réussite */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 md:pb-4">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-red-600" />
                Taux de Réussite
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              >
                {successRate}% de réussite
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke="#e5e7eb"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${successRate} ${100 - successRate}`}
                      strokeDashoffset="25"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg md:text-2xl font-bold text-green-600">
                      {successRate}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-green-600">
                    {passedGrades} réussites
                  </span>
                  <span className="text-red-600">{failedGrades} échecs</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Résumé statistique */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {totalStudents}
                </div>
                <div className="text-xs md:text-sm text-blue-200">
                  Étudiants total
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {yearData.femaleStudents}
                </div>
                <div className="text-xs md:text-sm text-blue-200">Filles</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {yearData.maleStudents}
                </div>
                <div className="text-xs md:text-sm text-blue-200">Garçons</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">{totalUEs}</div>
                <div className="text-xs md:text-sm text-blue-200">
                  Unités d'enseignement
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {successRate}%
                </div>
                <div className="text-xs md:text-sm text-blue-200">
                  Taux de réussite
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {graduatedStudents}
                </div>
                <div className="text-xs md:text-sm text-blue-200">
                  Diplômés cette année
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
