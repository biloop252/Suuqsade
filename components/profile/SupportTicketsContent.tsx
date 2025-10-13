'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { SupportTicket, SupportMessage, SupportCategory } from '@/types/database';
import { 
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Paperclip,
  Eye,
  Calendar,
  User,
  Tag
} from 'lucide-react';

export default function SupportTicketsContent() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchCategories();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          category:support_categories(name, slug)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('support_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          user:profiles(first_name, last_name, role)
        `)
        .eq('ticket_id', ticketId)
        .eq('is_internal', false) // Only show customer-visible messages
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleTicketClick = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    await fetchMessages(ticket.id);
  };

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          subject: newTicket.subject,
          description: newTicket.description,
          category_id: newTicket.category_id || null,
          priority: newTicket.priority,
          user_id: user?.id
        });

      if (error) throw error;

      // Reset form
      setNewTicket({
        subject: '',
        description: '',
        category_id: '',
        priority: 'medium'
      });
      setShowNewTicketForm(false);
      
      // Refresh tickets
      await fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          message: newMessage,
          user_id: user?.id,
          is_internal: false
        });

      if (error) throw error;
      
      setNewMessage('');
      await fetchMessages(selectedTicket.id);
      
      // Update last message time
      setTickets(prev => prev.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, last_message_at: new Date().toISOString() }
          : ticket
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'waiting_customer': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_staff': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'waiting_customer': return <Clock className="h-4 w-4" />;
      case 'waiting_staff': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-gray-600">Get help with your orders and account</p>
        </div>
        <button
          onClick={() => setShowNewTicketForm(true)}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </button>
      </div>

      {/* New Ticket Form Modal */}
      {showNewTicketForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Support Ticket</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newTicket.category_id}
                  onChange={(e) => setNewTicket({ ...newTicket, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewTicketForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTicket}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {tickets.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
                <p className="text-gray-600 mb-4">You haven't created any support tickets yet.</p>
                <button
                  onClick={() => setShowNewTicketForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-orange-50' : ''
                    }`}
                    onClick={() => handleTicketClick(ticket)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {ticket.ticket_number}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h4 className="text-base font-medium text-gray-900 mb-1">
                          {ticket.subject}
                        </h4>
                        {ticket.category && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Tag className="h-3 w-3 mr-1" />
                            {ticket.category.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center mb-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(ticket.created_at)}
                        </div>
                        {ticket.messages_count > 0 && (
                          <div className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {ticket.messages_count} message{ticket.messages_count !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-white rounded-lg shadow">
              {/* Ticket Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedTicket.ticket_number}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTicket.subject}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                  </div>
                  {selectedTicket.category && (
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <p className="font-medium">{selectedTicket.category.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Messages</h4>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.user.role === 'customer'
                          ? 'bg-orange-50 border border-orange-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {message.user.first_name} {message.user.last_name}
                          </span>
                          {message.user.role === 'customer' && (
                            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {message.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-6 border-t border-gray-200">
                  <div className="space-y-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
