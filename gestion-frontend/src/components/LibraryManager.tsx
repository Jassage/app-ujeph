
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicStore } from '../store/academicStore';
import { Book, BookLoan } from '../types/academic';
import { BookOpen, Plus, Edit2, Trash2, User, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const LibraryManager = () => {
  const { 
    books, 
    bookLoans, 
    addBook, 
    updateBook, 
    deleteBook, 
    addBookLoan, 
    updateBookLoan,
    students, 
    faculties 
  } = useAcademicStore();
  
  const [showBookForm, setShowBookForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editingLoan, setEditingLoan] = useState<BookLoan | null>(null);

  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    faculty: '',
    quantity: 1,
    available: 1,
    location: '',
    status: 'Disponible' as Book['status']
  });

  const [loanFormData, setLoanFormData] = useState({
    bookId: '',
    studentId: '',
    loanDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'En cours' as BookLoan['status'],
    renewalCount: 0,
    fine: 0
  });

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const book: Book = {
      id: editingBook?.id || `book_${Date.now()}`,
      ...bookFormData
    };

    if (editingBook) {
      updateBook(editingBook.id, book);
    } else {
      addBook(book);
    }

    resetBookForm();
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loan: BookLoan = {
      id: editingLoan?.id || `loan_${Date.now()}`,
      ...loanFormData
    };

    if (editingLoan) {
      updateBookLoan(editingLoan.id, loan);
    } else {
      addBookLoan(loan);
      // Diminuer la disponibilité du livre
      const book = books.find(b => b.id === loan.bookId);
      if (book && book.available > 0) {
        updateBook(book.id, { available: book.available - 1 });
      }
    }

    resetLoanForm();
  };

  const resetBookForm = () => {
    setBookFormData({
      title: '',
      author: '',
      isbn: '',
      category: '',
      faculty: '',
      quantity: 1,
      available: 1,
      location: '',
      status: 'Disponible'
    });
    setEditingBook(null);
    setShowBookForm(false);
  };

  const resetLoanForm = () => {
    setLoanFormData({
      bookId: '',
      studentId: '',
      loanDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'En cours',
      renewalCount: 0,
      fine: 0
    });
    setEditingLoan(null);
    setShowLoanForm(false);
  };

  const handleBookEdit = (book: Book) => {
    setBookFormData(book);
    setEditingBook(book);
    setShowBookForm(true);
  };

  const handleLoanEdit = (loan: BookLoan) => {
    setLoanFormData({
      bookId: loan.bookId,
      studentId: loan.studentId,
      loanDate: loan.loanDate,
      dueDate: loan.dueDate,
      status: loan.status,
      renewalCount: loan.renewalCount,
      fine: loan.fine || 0
    });
    setEditingLoan(loan);
    setShowLoanForm(true);
  };

  const handleBookDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
      deleteBook(id);
    }
  };

  const handleReturnBook = (loanId: string) => {
    const loan = bookLoans.find(l => l.id === loanId);
    if (loan) {
      updateBookLoan(loanId, { 
        status: 'Retourné', 
        returnDate: new Date().toISOString().split('T')[0] 
      });
      
      // Augmenter la disponibilité du livre
      const book = books.find(b => b.id === loan.bookId);
      if (book) {
        updateBook(book.id, { available: book.available + 1 });
      }
    }
  };

  const getBookTitle = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.title : 'Livre non trouvé';
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Étudiant non trouvé';
  };

  const getStatusBadge = (status: Book['status'] | BookLoan['status']) => {
    switch (status) {
      case 'Disponible':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'Épuisé':
        return <Badge className="bg-red-100 text-red-800">Épuisé</Badge>;
      case 'En commande':
        return <Badge className="bg-blue-100 text-blue-800">En commande</Badge>;
      case 'En cours':
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>;
      case 'Retourné':
        return <Badge className="bg-green-100 text-green-800">Retourné</Badge>;
      case 'En retard':
        return <Badge className="bg-red-100 text-red-800">En retard</Badge>;
      case 'Perdu':
        return <Badge className="bg-gray-100 text-gray-800">Perdu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOverdueLoans = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookLoans.filter(loan => 
      loan.status === 'En cours' && loan.dueDate < today
    );
  };

  const getLibraryStats = () => {
    const totalBooks = books.reduce((sum, book) => sum + book.quantity, 0);
    const availableBooks = books.reduce((sum, book) => sum + book.available, 0);
    const activeLoans = bookLoans.filter(loan => loan.status === 'En cours').length;
    const overdueLoans = getOverdueLoans().length;
    
    return { totalBooks, availableBooks, activeLoans, overdueLoans };
  };

  const stats = getLibraryStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion de la Bibliothèque</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowBookForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Livre
          </Button>
          <Button onClick={() => setShowLoanForm(true)} variant="outline" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nouveau Prêt
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total des livres</p>
                <p className="text-2xl font-bold">{stats.totalBooks}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableBooks}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prêts actifs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeLoans}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En retard</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueLoans}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="books" className="space-y-4">
        <TabsList>
          <TabsTrigger value="books">Livres</TabsTrigger>
          <TabsTrigger value="loans">Prêts</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4">
          {/* Formulaire de livre */}
          {showBookForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingBook ? 'Modifier' : 'Ajouter'} un Livre</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Titre *</Label>
                      <Input
                        value={bookFormData.title}
                        onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auteur *</Label>
                      <Input
                        value={bookFormData.author}
                        onChange={(e) => setBookFormData({...bookFormData, author: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>ISBN</Label>
                      <Input
                        value={bookFormData.isbn}
                        onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Input
                        value={bookFormData.category}
                        onChange={(e) => setBookFormData({...bookFormData, category: e.target.value})}
                        placeholder="Ex: Informatique, Littérature..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Faculté</Label>
                      <Select value={bookFormData.faculty} onValueChange={(value) => setBookFormData({...bookFormData, faculty: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une faculté" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GENERAL">Générale</SelectItem>
                          {faculties.map((faculty) => (
                            <SelectItem key={faculty.id} value={faculty.name}>
                              {faculty.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantité *</Label>
                      <Input
                        type="number"
                        value={bookFormData.quantity}
                        onChange={(e) => setBookFormData({...bookFormData, quantity: parseInt(e.target.value) || 0})}
                        min="1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disponible *</Label>
                      <Input
                        type="number"
                        value={bookFormData.available}
                        onChange={(e) => setBookFormData({...bookFormData, available: parseInt(e.target.value) || 0})}
                        min="0"
                        max={bookFormData.quantity}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emplacement</Label>
                      <Input
                        value={bookFormData.location}
                        onChange={(e) => setBookFormData({...bookFormData, location: e.target.value})}
                        placeholder="Ex: Étagère A1, Section Sciences..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{editingBook ? 'Modifier' : 'Ajouter'}</Button>
                    <Button type="button" variant="outline" onClick={resetBookForm}>Annuler</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Liste des livres */}
          <div className="grid gap-4">
            {books.map((book) => (
              <Card key={book.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{book.title}</h3>
                      <p className="text-muted-foreground">par {book.author}</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="outline">{book.category}</Badge>
                        <Badge variant="outline">{book.faculty || 'Générale'}</Badge>
                        {getStatusBadge(book.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><strong>ISBN:</strong> {book.isbn}</p>
                          <p><strong>Quantité:</strong> {book.quantity}</p>
                          <p><strong>Disponible:</strong> {book.available}</p>
                        </div>
                        <div>
                          <p><strong>Emplacement:</strong> {book.location}</p>
                          <p><strong>Statut:</strong> {book.status}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleBookEdit(book)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleBookDelete(book.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          {/* Formulaire de prêt */}
          {showLoanForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingLoan ? 'Modifier' : 'Nouveau'} Prêt</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLoanSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Livre *</Label>
                      <Select value={loanFormData.bookId} onValueChange={(value) => setLoanFormData({...loanFormData, bookId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un livre" />
                        </SelectTrigger>
                        <SelectContent>
                          {books.filter(book => book.available > 0).map((book) => (
                            <SelectItem key={book.id} value={book.id}>
                              {book.title} - {book.author} (Disponible: {book.available})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Étudiant *</Label>
                      <Select value={loanFormData.studentId} onValueChange={(value) => setLoanFormData({...loanFormData, studentId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un étudiant" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.firstName} {student.lastName} - {student.studentId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date de prêt</Label>
                      <Input
                        type="date"
                        value={loanFormData.loanDate}
                        onChange={(e) => setLoanFormData({...loanFormData, loanDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de retour prévue *</Label>
                      <Input
                        type="date"
                        value={loanFormData.dueDate}
                        onChange={(e) => setLoanFormData({...loanFormData, dueDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{editingLoan ? 'Modifier' : 'Créer le prêt'}</Button>
                    <Button type="button" variant="outline" onClick={resetLoanForm}>Annuler</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Liste des prêts */}
          <div className="space-y-4">
            {bookLoans.filter(loan => loan.status === 'En cours').map((loan) => (
              <Card key={loan.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{getBookTitle(loan.bookId)}</h3>
                      <p className="text-muted-foreground">Emprunté par {getStudentName(loan.studentId)}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Prêt: {new Date(loan.loanDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Retour: {new Date(loan.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(loan.status)}
                        {loan.renewalCount > 0 && (
                          <Badge variant="outline">Renouvelé {loan.renewalCount} fois</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleLoanEdit(loan)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReturnBook(loan.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Retourner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <div className="space-y-4">
            {getOverdueLoans().map((loan) => (
              <Card key={loan.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h3 className="font-semibold text-red-800">{getBookTitle(loan.bookId)}</h3>
                      </div>
                      <p className="text-muted-foreground">Emprunté par {getStudentName(loan.studentId)}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Retour prévu: {new Date(loan.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-red-600">
                          {Math.floor((new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24))} jours de retard
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleReturnBook(loan.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        Retourner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
