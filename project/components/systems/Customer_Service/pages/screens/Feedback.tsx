import React, { useState, useEffect } from 'react';
import {
  Star, MessageSquare, Calendar, Filter, Search, Smile,
  Frown, Meh, MoreHorizontal, Flag, Archive, Download, RefreshCw
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  comments: string;
  date: string;
  category: 'service';
  status: 'reviewed';
}

const Feedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch feedback from API
  useEffect(() => {
    const loadFeedback = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://ipasystem.bymsystem.com/api/feedback');
        if (!response.ok) {
          throw new Error('Failed to fetch feedback');
        }
        const data = await response.json();
        setFeedbacks(data);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        // Set empty array on error
        setFeedbacks([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedback();
  }, []);

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesCategory = filterCategory === 'all' || feedback.category === filterCategory;
    const matchesSentiment = filterSentiment === 'all' || 
      (filterSentiment === 'positive' && feedback.rating >= 4) ||
      (filterSentiment === 'negative' && feedback.rating <= 2) ||
      (filterSentiment === 'neutral' && feedback.rating > 2 && feedback.rating < 4);
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      feedback.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.comments.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSentiment && matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: feedbacks.length,
    averageRating: feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0,
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getSentimentIcon = (rating: number) => {
    if (rating >= 4) return <Smile className="w-5 h-5 text-green-500" />;
    if (rating <= 2) return <Frown className="w-5 h-5 text-red-500" />;
    return <Meh className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'service': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-purple-100 text-purple-800';
      case 'facility': return 'bg-green-100 text-green-800';
      case 'pricing': return 'bg-orange-100 text-orange-800';
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

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
              <div>
                <div className="h-5 w-32 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 w-16 bg-slate-200 rounded"></div>
              <div className="h-6 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-4 w-full bg-slate-200 rounded"></div>
            <div className="h-4 w-full bg-slate-200 rounded"></div>
            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Customer Feedback
              </h1>
              <p className="text-slate-600 mt-2 text-lg">Monitor and respond to customer experiences</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => {
                  // Refetch data
                  window.location.reload();
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Only showing Total and Average Rating */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Feedback</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Average Rating</p>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold text-slate-900">{stats.averageRating.toFixed(1)}</p>
                  <div className="flex">{getRatingStars(Math.round(stats.averageRating))}</div>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="service">Service</option>
              </select>
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
            <div className="text-sm text-slate-600">
              Showing {filteredFeedbacks.length} of {feedbacks.length} feedback items
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredFeedbacks.length > 0 ? (
          <div className="space-y-6">
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {feedback.customer_name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getSentimentIcon(feedback.rating)}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{feedback.customer_name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(feedback.date)}</span>
                          <span>•</span>
                          <span>Ticket: {feedback.ticket_number}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(feedback.category)}`}>
                        {feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                        {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                      </span>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  {/* Rating and Title */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-1">
                        {getRatingStars(feedback.rating)}
                      </div>
                      <span className="text-sm font-medium text-slate-600">{feedback.rating}/5</span>
                    </div>
                  </div>
                  {/* Message */}
                  <div className="mb-4">
                    <p className="text-slate-700 leading-relaxed">{feedback.comments}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-end pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Flag className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Archive className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 opacity-5 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-200 rounded-full"></div>
              <div className="absolute top-1/2 -left-10 w-32 h-32 bg-purple-200 rounded-full"></div>
              <div className="absolute -bottom-10 right-1/3 w-24 h-24 bg-indigo-200 rounded-full"></div>
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-6 shadow-inner">
                <MessageSquare className="w-10 h-10 text-blue-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">No Feedback Found</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
                {searchTerm || filterCategory !== 'all' || filterSentiment !== 'all' || filterStatus !== 'all'
                  ? 'Your filters removed all results. Try resetting them to see all feedback.'
                  : "Your customers haven't submitted any feedback just yet. Promote your review system or check back later!"}
              </p>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6 text-left inline-block max-w-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-amber-800">
                    <strong>Pro Tip:</strong> Send a follow-up email after service with a link to leave feedback!
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(searchTerm || filterCategory !== 'all' || filterSentiment !== 'all' || filterStatus !== 'all') ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategory('all');
                      setFilterSentiment('all');
                      setFilterStatus('all');
                    }}
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset Filters</span>
                  </button>
                ) : (
                  <>
                    
                  </>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-8 animate-fade-in">
                ⏳ Real feedback will appear here once collected!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;