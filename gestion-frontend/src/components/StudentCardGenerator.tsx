import { useState, useRef, useEffect } from "react";
import {
  User,
  Download,
  Printer,
  QrCode,
  Calendar,
  GraduationCap,
  Shield,
  MapPin,
  BookOpen,
  Sparkles,
  Camera,
  Mail,
  Phone,
  IdCard,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcademicStore } from "../store/studentStore";
import { Student } from "../types/academic";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useFacultyStore } from "@/store/facultyStore";
import { useAcademicYearStore } from "@/store/academicYearStore"; // Import du store des années académiques

export const StudentCardGenerator = () => {
  const { students } = useAcademicStore();
  const { faculties } = useFacultyStore();
  const { academicYears } = useAcademicYearStore(); // Récupération des années académiques
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [cardStyle, setCardStyle] = useState<"modern" | "classic" | "premium">(
    "modern"
  );
  const [expandedView, setExpandedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fonction pour récupérer la faculté depuis les enrollments
  const getStudentFaculty = (student: Student) => {
    if (student.enrollments && student.enrollments.length > 0) {
      const latestEnrollment =
        student.enrollments[student.enrollments.length - 1];
      const faculty = faculties.find(
        (f) => f.id === latestEnrollment.facultyId
      );
      return faculty ? faculty.name : "Non assigné";
    }
    return "Non assigné";
  };

  // Fonction pour récupérer le niveau depuis les enrollments
  const getStudentLevel = (student: Student) => {
    if (student.enrollments && student.enrollments.length > 0) {
      const latestEnrollment =
        student.enrollments[student.enrollments.length - 1];
      return latestEnrollment.level || "Non assigné";
    }
    return "Non assigné";
  };

  // Fonction pour récupérer l'année académique depuis les enrollments
  const getStudentAcademicYear = (student: Student) => {
    if (student.enrollments && student.enrollments.length > 0) {
      const latestEnrollment =
        student.enrollments[student.enrollments.length - 1];
      const academicYear = academicYears.find(
        (ay) => ay.id === latestEnrollment.academicYearId
      );
      return academicYear ? academicYear.year : "Non assigné";
    }
    return "Non assigné";
  };

  // Fonction pour récupérer l'ID de faculté pour le filtrage
  const getStudentFacultyId = (student: Student) => {
    if (student.enrollments && student.enrollments.length > 0) {
      const latestEnrollment =
        student.enrollments[student.enrollments.length - 1];
      return latestEnrollment.facultyId || "";
    }
    return "";
  };

  const getLevelText = (level: string) => {
    return level === "1" ? "1ère Année" : `${level}ème Année`;
  };

  // Filtrer les étudiants selon la faculté sélectionnée et le terme de recherche
  const filteredStudents = students.filter(
    (student) =>
      (selectedFaculty === "" ||
        selectedFaculty === "ALL_FACULTIES" ||
        getStudentFacultyId(student) === selectedFaculty) &&
      student.status === "Active" &&
      (searchTerm === "" ||
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Précharger les images pour éviter les problèmes d'export
  useEffect(() => {
    if (selectedStudentData) {
      const preloadImages = () => {
        const images = [
          "../../public/ID_CARD.png",
          "../../public/logo.png",
          generateQRCode(selectedStudentData),
        ];

        images.forEach((src) => {
          const img = new Image();
          img.src = src;
        });
      };

      preloadImages();
    }
  }, [selectedStudent]);

  const handlePrint = () => {
    if (frontCardRef.current && backCardRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        // Styles d'impression optimisés
        const printStyles = `
          <style>
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                background: white !important;
              }
              .print-container {
                display: flex;
                gap: 20px;
                justify-content: center;
                padding: 10mm;
                page-break-inside: avoid;
              }
              .card-front, .card-back {
                width: 300px !important;
                height: 477px !important;
                box-shadow: none !important;
                border: 1px solid #ccc !important;
                page-break-inside: avoid;
              }
            }
          </style>
        `;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Carte d'Étudiant - ${selectedStudentData?.firstName} ${selectedStudentData?.lastName}</title>
              ${printStyles}
            </head>
            <body>
              <div class="print-container">
                <div class="card-front">${frontCardRef.current.innerHTML}</div>
                <div class="card-back">${backCardRef.current.innerHTML}</div>
              </div>
            </body>
          </html>
        `);

        printWindow.document.close();

        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          setTimeout(() => printWindow.close(), 100);
        }, 1000);
      }
    }
  };

  const exportAsPNG = async () => {
    if (frontCardRef.current && backCardRef.current && !isExporting) {
      setIsExporting(true);
      try {
        // Options optimisées pour html2canvas
        const options = {
          backgroundColor: null,
          scale: 3,
          useCORS: true,
          allowTaint: false,
          logging: false,
          width: 300,
          height: 477,
          windowWidth: 300,
          windowHeight: 477,
          onclone: (clonedDoc) => {
            // S'assurer que tous les styles sont corrects dans le clone
            const cards = clonedDoc.querySelectorAll(".export-card");
            cards.forEach((card) => {
              card.style.transform = "none";
              card.style.opacity = "1";
            });
          },
        };

        // Exporter la carte avant
        const frontCanvas = await html2canvas(frontCardRef.current, options);

        // Exporter la carte arrière
        const backCanvas = await html2canvas(backCardRef.current, options);

        // Créer un lien de téléchargement pour chaque carte
        const frontLink = document.createElement("a");
        frontLink.download = `carte-etudiant-${selectedStudentData?.studentId}-avant.png`;
        frontLink.href = frontCanvas.toDataURL("image/png", 1.0);
        document.body.appendChild(frontLink);
        frontLink.click();
        document.body.removeChild(frontLink);

        const backLink = document.createElement("a");
        backLink.download = `carte-etudiant-${selectedStudentData?.studentId}-arriere.png`;
        backLink.href = backCanvas.toDataURL("image/png", 1.0);
        document.body.appendChild(backLink);
        backLink.click();
        document.body.removeChild(backLink);
      } catch (error) {
        console.error("Erreur lors de l'export PNG:", error);
        alert("Erreur lors de l'export. Veuillez réessayer.");
      } finally {
        setIsExporting(false);
      }
    }
  };

  const exportAsPDF = async () => {
    if (frontCardRef.current && backCardRef.current && !isExporting) {
      setIsExporting(true);
      try {
        const options = {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
        };

        // Exporter la carte avant
        const frontCanvas = await html2canvas(frontCardRef.current, options);

        // Exporter la carte arrière
        const backCanvas = await html2canvas(backCardRef.current, options);

        // Créer un PDF
        const pdf = new jsPDF("landscape", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Calculer les dimensions pour afficher les deux côte à côte
        const cardWidth = 300 / 3.78;
        const cardHeight = 477 / 3.78;
        const margin = (pdfWidth - cardWidth * 2) / 3;

        // Ajouter la carte avant
        const frontImgData = frontCanvas.toDataURL("image/png", 1.0);
        pdf.addImage(
          frontImgData,
          "PNG",
          margin,
          (pdfHeight - cardHeight) / 2,
          cardWidth,
          cardHeight
        );

        // Ajouter la carte arrière
        const backImgData = backCanvas.toDataURL("image/png", 1.0);
        pdf.addImage(
          backImgData,
          "PNG",
          margin * 2 + cardWidth,
          (pdfHeight - cardHeight) / 2,
          cardWidth,
          cardHeight
        );

        // Télécharger le PDF
        pdf.save(`carte-etudiant-${selectedStudentData?.firstName}.pdf`);
      } catch (error) {
        console.error("Erreur lors de l'export PDF:", error);
        alert("Erreur lors de l'export PDF. Veuillez réessayer.");
      } finally {
        setIsExporting(false);
      }
    }
  };

  const generateQRCode = (studentData: Student) => {
    const faculty = getStudentFaculty(studentData);
    const level = getStudentLevel(studentData);
    const academicYear = getStudentAcademicYear(studentData);
    const data = `${studentData.studentId}|${studentData.firstName}|${studentData.lastName}|${faculty}|${level}|${academicYear}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      data
    )}&bgcolor=ffffff&color=000000&format=svg`;
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  // Fonction pour générer une couleur basée sur la faculté
  const getFacultyColor = (student: Student) => {
    const facultyName = getStudentFaculty(student);
    const facultyColors: Record<string, string> = {
      Sciences: "bg-blue-600",
      Médecine: "bg-red-600",
      Droit: "bg-purple-600",
      Économie: "bg-green-600",
      Lettres: "bg-amber-600",
      Informatique: "bg-indigo-600",
      Ingénierie: "bg-teal-600",
      default: "bg-gray-600",
    };

    return facultyColors[facultyName] || facultyColors.default;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            Génération de Cartes d'Étudiant
          </h2>
          <p className="text-muted-foreground">
            Créez et imprimez les cartes d'identité des étudiants
          </p>
        </div>
      </div>

      {/* Sélection et options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Sélection d'Étudiant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Faculté</Label>
                <Select
                  value={selectedFaculty}
                  onValueChange={setSelectedFaculty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les facultés" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_FACULTIES">
                      Toutes les facultés
                    </SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Étudiant</Label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un étudiant" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {getStudentFaculty(student)} - {student.lastName} -{" "}
                        {student.studentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="space-y-2">
              <Label>Rechercher un étudiant</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, ID ou email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handlePrint}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={isExporting}
            >
              <Printer className="h-4 w-4" />
              {isExporting ? "Traitement..." : "Imprimer la carte"}
            </Button>
            <Button
              onClick={exportAsPDF}
              variant="outline"
              className="w-full gap-2"
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Génération..." : "Télécharger PDF"}
            </Button>
            <Button
              onClick={exportAsPNG}
              variant="outline"
              className="w-full gap-2"
              disabled={isExporting}
            >
              <Camera className="h-4 w-4" />
              {isExporting ? "Export..." : "Exporter PNG"}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setExpandedView(!expandedView)}
              disabled={isExporting}
            >
              {expandedView ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Vue réduite
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Vue détaillée
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Aperçu de la carte */}
      {selectedStudentData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Aperçu de la Carte d'Étudiant</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Carte Officielle
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <motion.div
                ref={cardRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex gap-6 transition-all duration-300 export-container",
                  expandedView ? "flex-row" : "flex-col"
                )}
              >
                {/* Carte avant - Style UJEPH */}
                <div
                  ref={frontCardRef}
                  className="w-[300px] h-[477px] rounded-2xl shadow-2xl overflow-hidden relative mt-1 p-4"
                  style={{
                    backgroundImage: "url('./ID_CARD.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* En-tête avec logo */}
                  <div className="flex items-center justify-center border border-orange-500 rounded-tl-xl rounded-br-xl mx-1 mt-3 px-0 py-1 pt-1 backdrop-blur-sm">
                    <div className="w-14 h-10 flex items-center justify-center mr-0 pl-1">
                      <img
                        src="./logo.png"
                        alt="Logo UJEPH"
                        className="w-full object-contain"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="text-center text-white">
                      <p className="text-xs font-bold leading-tight">
                        Université Jérusalem de Pignon d'Haïti (UJEPH)
                      </p>
                      <p className="text-[9px]">
                        83, Avenue Toussaint Louverture, Pignon, Haïti
                      </p>
                      <p className="text-[9px]">(+509) 33367148 / 44375351</p>
                    </div>
                  </div>

                  {/* Photo circulaire */}
                  <div className="w-32 h-32 rounded-full bg-white mx-auto mt-4 flex items-center justify-center overflow-hidden border-2 border-orange-500">
                    {/* <User className="h-20 w-20 text-gray-400" /> */}
                    {/* photo de l'etudiant */}
                    <img
                      src={`http://localhost:4000${selectedStudentData.photo}`}
                      alt={`${selectedStudentData.firstName} ${selectedStudentData.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Informations verticales (faculté, année) */}
                  <div className="flex flex-col items-center justify-center text-center w-24 absolute left-[-18px] top-1/2 transform -translate-y-1/2 space-y-4">
                    <div className="rotate-90 transform origin-center whitespace-nowrap mb-[-20px] px-[-10px]">
                      <p className="text-[16px] text-sky-950 font-extrabold">
                        {getStudentFaculty(selectedStudentData)}
                      </p>
                    </div>

                    <div className="rotate-90 transform origin-center whitespace-nowrap mb-0 ml-9">
                      <p className="text-[12px] font-bold text-blue-800">
                        {getStudentAcademicYear(selectedStudentData)}
                      </p>
                    </div>
                  </div>

                  {/* Nom de l'étudiant */}
                  <div className="text-center mt-2">
                    <p className="text-black font-bold text-lg">
                      {selectedStudentData.firstName}{" "}
                      {selectedStudentData.lastName}
                    </p>
                  </div>

                  {/* Type de carte */}
                  <div className="text-center">
                    <p className="text-yellow-600 font-bold text-md">
                      Étudiant
                    </p>
                  </div>

                  {/* Informations de l'étudiant */}
                  <div className="mt-4 mx-10 font-semibold text-black text-[14px] space-y-1 leading-3 mb-4">
                    <p className="mb-0 ">
                      <strong>Code: </strong> {selectedStudentData.studentId}
                    </p>
                    <p className="mb-0 leading-3">
                      <strong>CIN/NIF:</strong> {selectedStudentData.cin}
                    </p>
                    <p className="mb-0 leading-3">
                      <strong>Tel:</strong> {selectedStudentData.phone}
                    </p>
                    <p className="mb-0 leading-3">
                      <strong>G.S:</strong>{" "}
                      {selectedStudentData.bloodGroup || "A+"}
                    </p>
                    <p className="mb-16 leading-3">
                      <strong>Niveau:</strong>{" "}
                      {getLevelText(getStudentLevel(selectedStudentData))}
                    </p>
                  </div>
                  {/* Signature après le niveau */}
                  <div className="mt-4 ml-8 mr-16 pt-2">
                    <img src="../../public/signature.png" alt="Signature" />
                    <p className="text-xs text-center border-t  border-gray-300">
                      Signature autorisée
                    </p>
                  </div>

                  {/* QR Code en bas à droite */}
                  <div className="absolute bottom-14 right-4 bg-white p-1 rounded">
                    <img
                      src={generateQRCode(selectedStudentData)}
                      alt="QR Code"
                      className="w-12 h-12"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                {/* Carte arrière */}
                <div
                  ref={backCardRef}
                  className="w-[300px] h-[477px] rounded-2xl shadow-2xl overflow-hidden relative bg-gradient-to-b from-slate-800 to-slate-900 text-white p-4 export-card"
                >
                  <h4 className="font-bold text-center mb-4 text-sm uppercase tracking-wider border-b border-white/20 pb-2">
                    Informations Complémentaires
                  </h4>

                  <div className="flex h-64 mb-0">
                    {/* Informations principales */}
                    <div className="flex-1 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{selectedStudentData.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{selectedStudentData.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>Né(e) à: {selectedStudentData.placeOfBirth}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IdCard className="h-3 w-3" />
                        <span>Status: {selectedStudentData.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Né(e) le:{" "}
                          {new Date(
                            selectedStudentData.dateOfBirth
                          ).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3" />
                        <span>
                          Faculté: {getStudentFaculty(selectedStudentData)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3 w-3" />
                        <span>
                          Niveau:{" "}
                          {getLevelText(getStudentLevel(selectedStudentData))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Année Académique:{" "}
                          {getStudentAcademicYear(selectedStudentData)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className=" ml-8 mr-8">
                    <img src="../../public/signature.png" alt="Signature" />
                    <p className="text-xs text-center border-t  border-gray-300">
                      Signature autorisée
                    </p>
                  </div>
                  <div className="mt-2 pr-3 pt-4 pl-3 bg-black/20 rounded-lg">
                    <p className="text-xs text-center">
                      Cette carte est la propriété de l'Université Jérusalem de
                      Pignon d'Haïti. Toute falsification est passible de
                      poursuites.
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-4 text-xs opacity-70">
                    <span>© 2025 UJEPH</span>
                    <span>ID: {selectedStudentData.studentId}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des étudiants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Étudiants Actifs ({filteredStudents.length})
          </CardTitle>
          <CardDescription>
            Sélectionnez un étudiant pour générer sa carte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {filteredStudents.map((student) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                  selectedStudent === student.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
                onClick={() => setSelectedStudent(student.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white",
                        getFacultyColor(student)
                      )}
                    >
                      <span className="font-bold text-xs">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.studentId} • {getStudentFaculty(student)} •
                        Niveau {getStudentLevel(student)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Année: {getStudentAcademicYear(student)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {student.status}
                  </Badge>
                </div>
              </motion.div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun étudiant trouvé</p>
                <p className="text-sm">Modifiez vos filtres de recherche</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
