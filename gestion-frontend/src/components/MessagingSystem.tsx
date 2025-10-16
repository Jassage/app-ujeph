
import React, { useState } from 'react';
import { useAcademicStore } from '../store/academicStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, Inbox, PenSquare, AlertCircle, Clock, User } from 'lucide-react';
import { Message } from '../types/academic';

export const MessagingSystem = () => {
  const { messages, users, addMessage, markMessageAsRead, getUnreadMessages, getUserMessages } = useAcademicStore();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composing, setComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiverId: '',
    subject: '',
    content: '',
    priority: 'Normal' as Message['priority']
  });

  // Simuler l'utilisateur actuel (dans une vraie app, cela viendrait de l'authentification)
  const currentUserId = users.length > 0 ? users[0]?.id : 'user_1';
  const currentUser = users.find(u => u.id === currentUserId);

  const userMessages = getUserMessages(currentUserId);
  const unreadMessages = getUnreadMessages(currentUserId);

  const handleSendMessage = () => {
    if (!newMessage.receiverId || !newMessage.subject || !newMessage.content) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      receiverId: newMessage.receiverId,
      subject: newMessage.subject,
      content: newMessage.content,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: newMessage.priority
    };

    addMessage(message);
    setNewMessage({ receiverId: '', subject: '', content: '', priority: 'Normal' });
    setComposing(false);
  };

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead && message.receiverId === currentUserId) {
      markMessageAsRead(message.id);
    }
  };

  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'Urgent': return 'destructive';
      case 'Important': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: Message['priority']) => {
    switch (priority) {
      case 'Urgent': return <AlertCircle className="h-4 w-4" />;
      case 'Important': return <Clock className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Messagerie Interne</h1>
        <Button onClick={() => setComposing(true)} className="flex items-center gap-2">
          <PenSquare className="h-4 w-4" />
          Nouveau Message
        </Button>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Boîte de réception
            {unreadMessages.length > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadMessages.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Messages envoyés</TabsTrigger>
          <TabsTrigger value="compose">Rédiger</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages reçus</CardTitle>
                <CardDescription>
                  {unreadMessages.length} message(s) non lu(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userMessages
                    .filter(m => m.receiverId === currentUserId)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((message) => {
                      const sender = users.find(u => u.id === message.senderId);
                      return (
                        <div
                          key={message.id}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                            !message.isRead ? 'border-primary bg-primary/5' : 'border-border'
                          } ${selectedMessage?.id === message.id ? 'ring-2 ring-primary' : ''}`}
                          onClick={() => handleSelectMessage(message)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium text-sm">
                                {sender?.firstName} {sender?.lastName}
                              </span>
                              {!message.isRead && (
                                <Badge variant="secondary" className="text-xs">Nouveau</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(message.priority)}>
                                {getPriorityIcon(message.priority)}
                                {message.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="font-medium text-sm truncate">{message.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {selectedMessage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getPriorityIcon(selectedMessage.priority)}
                    {selectedMessage.subject}
                  </CardTitle>
                  <CardDescription>
                    De: {users.find(u => u.id === selectedMessage.senderId)?.firstName} {users.find(u => u.id === selectedMessage.senderId)?.lastName}
                    <br />
                    {new Date(selectedMessage.timestamp).toLocaleString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap">{selectedMessage.content}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages envoyés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userMessages
                  .filter(m => m.senderId === currentUserId)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((message) => {
                    const receiver = users.find(u => u.id === message.receiverId);
                    return (
                      <div key={message.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium text-sm">
                              À: {receiver?.firstName} {receiver?.lastName}
                            </span>
                          </div>
                          <Badge variant={getPriorityColor(message.priority)}>
                            {message.priority}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{message.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Destinataire</label>
                <Select value={newMessage.receiverId} onValueChange={(value) => 
                  setNewMessage(prev => ({ ...prev, receiverId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un destinataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user => user.id !== currentUserId)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.role}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priorité</label>
                <Select value={newMessage.priority} onValueChange={(value: Message['priority']) => 
                  setNewMessage(prev => ({ ...prev, priority: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Important">Important</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Objet</label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Objet du message"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Votre message..."
                  rows={6}
                />
              </div>

              <Button onClick={handleSendMessage} className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Envoyer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
