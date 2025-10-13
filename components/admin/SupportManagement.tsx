'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { SupportTicket, SupportMessage, SupportCategory } from '@/types/database';
import { 
  Search,
  Filter,
  Eye,
  Edit,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Tag,
  Star,
  Plus,
  RefreshCw,
  MoreVertical,
  Send,
  Paperclip
} from 'lucide-react';
import Pagination from './Pagination';

export default function SupportManagement() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stats, setStats] = useState<any>(null);

  // Check for mock admin session
  const [mockProfile, setMockProfile] = useState<any>(null);
  
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    const adminProfile = localStorage.getItem('admin_profile');
    
    if (adminSession === 'true' && adminProfile) {
      setMockProfile(JSON.parse(adminProfile));
    }
  }, []);

  const currentUser = mockProfile ? { id: mockProfile.id } : user;
  const currentProfile = mockProfile || profile;

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [currentPage, itemsPerPage, searchTerm, selectedStatus, selectedPriority, selectedCategory]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(first_name, last_name, email),
          assigned_user:profiles!support_tickets_assigned_to_fkey(first_name, last_name),
          category:support_categories(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`subject.ilike.%${searchTerm}%,ticket_number.ilike.%${searchTerm}%`);
      }

      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      if (selectedPriority) {
        query = query.eq('priority', selectedPriority);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, is_urgent, resolved_at, created_at, customer_satisfaction');
      
      if (error) throw error;
      
      // Calculate stats manually
      const stats = {
        total_tickets: data?.length || 0,
        open_tickets: data?.filter(t => t.status === 'open').length || 0,
        in_progress_tickets: data?.filter(t => t.status === 'in_progress').length || 0,
        resolved_tickets: data?.filter(t => t.status === 'resolved').length || 0,
        closed_tickets: data?.filter(t => t.status === 'closed').length || 0,
        urgent_tickets: data?.filter(t => t.is_urgent).length || 0,
        avg_resolution_time: 0, // Calculate if needed
        customer_satisfaction: 0 // Calculate if needed
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      
      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: status as any } : ticket
      ));
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: status as any } : null);
      }
      
      fetchStats();
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      console.log('User info:', {
        user_id: currentUser?.id,
        user_email: user?.email,
        profile_role: currentProfile?.role,
        is_admin: currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin' || currentProfile?.role === 'staff'
      });

      console.log('Sending message:', {
        ticket_id: selectedTicket.id,
        message: newMessage,
        user_id: currentUser?.id,
        is_internal: isInternal
      });

      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          message: newMessage,
          user_id: currentUser?.id,
          is_internal: isInternal
        })
        .select();

      if (error) {
        console.error('Error inserting message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);
      
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
      alert('Failed to send message: ' + (error as any).message);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Management</h1>
          <p className="text-gray-600">Manage customer support tickets and messages</p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.open_tickets || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.in_progress_tickets || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved_tickets || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent_tickets || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting Customer</option>
                  <option value="waiting_staff">Waiting Staff</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading tickets...
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedTicket?.id === ticket.id ? 'bg-orange-50' : ''}`}
                        onClick={() => handleTicketClick(ticket)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {ticket.ticket_number}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {ticket.subject}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ticket.user?.first_name} {ticket.user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.user?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(ticket.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTicketClick(ticket);
                              }}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil((tickets.length || 0) / itemsPerPage)}
                totalItems={tickets.length || 0}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
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
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-medium">{selectedTicket.user?.first_name} {selectedTicket.user?.last_name}</p>
                    <p className="text-gray-600">{selectedTicket.user?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="font-medium">{formatDate(selectedTicket.created_at)}</p>
                  </div>
                </div>

                {/* Status Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {['open', 'in_progress', 'waiting_customer', 'waiting_staff', 'resolved', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateTicketStatus(selectedTicket.id, status)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedTicket.status === status
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
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
                        message.is_internal
                          ? 'bg-yellow-50 border border-yellow-200'
                          : 'bg-gray-50'
                      }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {message.user?.first_name} {message.user?.last_name}
                            </span>
                          {message.is_internal && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Internal
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
              <div className="p-6 border-t border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="internal" className="text-sm text-gray-700">
                      Internal note (not visible to customer)
                    </label>
                  </div>
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
