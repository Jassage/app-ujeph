
import React, { useState, useEffect } from 'react';
import { useAcademicStore } from '../store/academicStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, BookOpen, DollarSign, Calendar, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Analytics } from '../types/academic';

export const AnalyticsDashboard = () => {
  const { 
    students, grades, payments, attendances, 
    generateAnalytics, getAnalytics 
  } = useAcademicStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [analytics, setAnalytics] = useState<Analytics[]>([]);

  useEffect(() => {
    // Générer les analyses au chargement
    const performanceAnalytics = generateAnalytics('Performance', { period: selectedPeriod });
    const attendanceAnalytics = generateAnalytics('Présence', { period: selectedPeriod });
    const paymentAnalytics = generateAnalytics('Paiements', { period: selectedPeriod });
    
    setAnalytics([performanceAnalytics, attendanceAnalytics, paymentAnalytics]);
  }, [selectedPeriod, generateAnalytics]);

  // Données pour les graphiques
  const gradeDistribution = [
    { range: '0-5', count: grades.filter(g => g.grade < 5).length },
    { range: '5-8', count: grades.filter(g => g.grade >= 5 && g.grade < 8).length },
    { range: '8-12', count: grades.filter(g => g.grade >= 8 && g.grade < 12).length },
    { range: '12-16', count: grades.filter(g => g.grade >= 12 && g.grade < 16).length },
    { range: '16-20', count: grades.filter(g => g.grade >= 16).length },
  ];

  const attendanceData = [
    { status: 'Présent', count: attendances.filter(a => a.status === 'Présent').length, color: '#10B981' },
    { status: 'Absent', count: attendances.filter(a => a.status === 'Absent').length, color: '#EF4444' },
    { status: 'Retard', count: attendances.filter(a => a.status === 'Retard').length, color: '#F59E0B' },
    { status: 'Excusé', count: attendances.filter(a => a.status === 'Excusé').length, color: '#6B7280' },
  ];

  const paymentStatusData = [
    { status: 'Payé', count: payments.filter(p => p.status === 'Payé').length, color: '#10B981' },
    { status: 'En attente', count: payments.filter(p => p.status === 'En attente').length, color: '#F59E0B' },
    { status: 'Retard', count: payments.filter(p => p.status === 'Retard').length, color: '#EF4444' },
    { status: 'Annulé', count: payments.filter(p => p.status === 'Annulé').length, color: '#6B7280' },
  ];

  // Statistiques générales
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Active').length;
  const averageGrade = grades.length > 0 ? grades.reduce((sum, g) => sum + g.grade, 0) / grades.length : 0;
  const totalRevenue = payments.filter(p => p.status === 'Payé').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Tableau de Bord Analytique</h1>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Période actuelle</SelectItem>
            <SelectItem value="semester">Ce semestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
            <SelectItem value="all">Toutes les données</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="ujeph-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Étudiants Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              sur {totalStudents} étudiants au total
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">
                {((activeStudents / totalStudents) * 100).toFixed(1)}% actifs
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="ujeph-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade.toFixed(2)}/20</div>
            <p className="text-xs text-muted-foreground">
              Sur {grades.length} notes enregistrées
            </p>
            <div className="flex items-center mt-2">
              {averageGrade >= 10 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${averageGrade >= 10 ? 'text-green-500' : 'text-red-500'}`}>
                {averageGrade >= 10 ? 'Au-dessus' : 'En-dessous'} de la moyenne
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="ujeph-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} HTG</div>
            <p className="text-xs text-muted-foreground">
              {payments.filter(p => p.status === 'Payé').length} paiements effectués
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">
                {((payments.filter(p => p.status === 'Payé').length / payments.length) * 100).toFixed(1)}% collecté
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="ujeph-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendances.length > 0 ? 
                ((attendances.filter(a => a.status === 'Présent').length / attendances.length) * 100).toFixed(1) : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {attendances.length} sessions enregistrées
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">Bon taux de présence</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution des notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribution des Notes
            </CardTitle>
            <CardDescription>Répartition des notes par tranche</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des présences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Répartition des Présences
            </CardTitle>
            <CardDescription>Statut de présence des étudiants</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Statut des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Statut des Paiements</CardTitle>
          <CardDescription>Répartition des paiements par statut</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {paymentStatusData.map((item) => (
              <div key={item.status} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold" style={{ color: item.color }}>
                  {item.count}
                </div>
                <div className="text-sm text-muted-foreground">{item.status}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={paymentStatusData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="status" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Analyses récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Analyses Récentes</CardTitle>
          <CardDescription>Dernières analyses générées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.map((analysis) => (
              <div key={analysis.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{analysis.type}</h3>
                  <Badge variant="outline">
                    {new Date(analysis.generatedDate).toLocaleDateString('fr-FR')}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(analysis.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-medium">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
