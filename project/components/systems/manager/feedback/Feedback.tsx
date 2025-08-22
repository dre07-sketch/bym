import React, { useState, useEffect } from 'react';
import {
  Star, Send, MessageSquare, ThumbsUp, ThumbsDown, Heart, Award,
  User, Calendar, Filter, Search, TrendingUp, BarChart3, Smile,
  Frown, Meh, CheckCircle, AlertCircle, Clock, Car, Eye, X, Reply,
  MoreHorizontal, Flag, Archive, Trash2, Download, RefreshCw
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  message: string;
  category: 'service' | 'staff' | 'facility' | 'pricing' | 'general';
  sentiment: 'positive' | 'neutral' | 'negative';
  status: 'new' | 'reviewed' | 'responded' | 'archived';
  date: string;
  serviceType?: string;
  vehicleInfo?: string;
  isPublic: boolean;
  helpful: number;
  response?: {
    message: string;
    respondedBy: string;
    respondedAt: string;
  };
}

const Feedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Simulate loading from DB (optional)
  useEffect(() => {
    // Example: fetchFeedback().then(data => setFeedbacks(data));
    // For now, keeping it empty
  }, []);

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesCategory = filterCategory === 'all' || feedback.category === filterCategory;
    const matchesSentiment = filterSentiment === 'all' || feedback.sentiment === filterSentiment;
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      feedback.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSentiment && matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: feedbacks.length,
    positive: feedbacks.filter(f => f.sentiment === 'positive').length,
    neutral: feedbacks.filter(f => f.sentiment === 'neutral').length,
    negative: feedbacks.filter(f => f.sentiment === 'negative').length,
    averageRating: feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : '0.0',
    newFeedbacks: feedbacks.filter(f => f.status === 'new').length
  };

  const handleRespondToFeedback = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!selectedFeedback || !responseMessage.trim()) return;
    setIsSubmittingResponse(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updatedFeedbacks = feedbacks.map(feedback => 
      feedback.id === selectedFeedback.id 
        ? {
            ...feedback,
            status: 'responded' as const,
            response: {
              message: responseMessage,
              respondedBy: 'Manager Alex',
              respondedAt: new Date().toISOString()
            }
          }
        : feedback
    );
    setFeedbacks(updatedFeedbacks);
    setResponseMessage('');
    setShowResponseModal(false);
    setSelectedFeedback(null);
    setIsSubmittingResponse(false);
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-5 h-5 text-green-500" />;
      case 'negative': return <Frown className="w-5 h-5 text-red-500" />;
      default: return <Meh className="w-5 h-5 text-yellow-500" />;
    }
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
                onClick={() => {/* Refresh data */}}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
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
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Average Rating</p>
                <div className="flex items-center space-x-2">
                  <p className="text-3xl font-bold text-slate-900">{stats.averageRating}</p>
                  <div className="flex">{getRatingStars(Math.round(parseFloat(String(stats.averageRating))))}</div>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Positive</p>
                <p className="text-3xl font-bold text-green-600">{stats.positive}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Negative</p>
                <p className="text-3xl font-bold text-red-600">{stats.negative}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <ThumbsDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Needs Response</p>
                <p className="text-3xl font-bold text-orange-600">{stats.newFeedbacks}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
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
                <option value="staff">Staff</option>
                <option value="facility">Facility</option>
                <option value="pricing">Pricing</option>
                <option value="general">General</option>
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
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="responded">Responded</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="text-sm text-slate-600">
              Showing {filteredFeedbacks.length} of {feedbacks.length} feedback items
            </div>
          </div>
        </div>

        {/* Feedback List or Empty State */}
        {filteredFeedbacks.length > 0 ? (
          <div className="space-y-6">
            {filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {feedback.customerAvatar ? (
                          <img
                            src={feedback.customerAvatar}
                            alt={feedback.customerName}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {feedback.customerName.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1">
                          {getSentimentIcon(feedback.sentiment)}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg">{feedback.customerName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(feedback.date)}</span>
                          {feedback.serviceType && (
                            <>
                              <span>•</span>
                              <span>{feedback.serviceType}</span>
                            </>
                          )}
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
                    <h4 className="text-xl font-semibold text-slate-900 mb-2">{feedback.title}</h4>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <p className="text-slate-700 leading-relaxed">{feedback.message}</p>
                    {feedback.vehicleInfo && (
                      <div className="mt-3 flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                        <Car className="w-4 h-4" />
                        <span>Vehicle: {feedback.vehicleInfo}</span>
                      </div>
                    )}
                  </div>

                  {/* Response */}
                  {feedback.response && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Reply className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Response from {feedback.response.respondedBy}</span>
                        <span className="text-xs text-blue-600">{formatDate(feedback.response.respondedAt)}</span>
                      </div>
                      <p className="text-blue-800">{feedback.response.message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{feedback.helpful} helpful</span>
                      </div>
                      {feedback.isPublic && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <Eye className="w-4 h-4" />
                          <span>Public</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {feedback.status === 'new' && (
                        <button
                          onClick={() => handleRespondToFeedback(feedback)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          <span>Respond</span>
                        </button>
                      )}
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
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="inline-flex rounded-full bg-blue-50 p-4 mb-6">
              <MessageSquare className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Feedback Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
              There are no customer reviews to display at the moment. Once customers start sharing their experiences, you'll see them here.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 text-sm text-gray-500">
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                Encourage satisfied customers to leave a review
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                Check back later for new feedback
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={() => setShowResponseModal(false)} />
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Respond to Feedback</h3>
                  <p className="text-sm text-gray-500 mt-1">Responding to {selectedFeedback.customerName}</p>
                </div>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Original Feedback */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex">{getRatingStars(selectedFeedback.rating)}</div>
                  <span className="text-sm font-medium text-gray-600">{selectedFeedback.rating}/5</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{selectedFeedback.title}</h4>
                <p className="text-gray-700 text-sm">{selectedFeedback.message}</p>
              </div>

              {/* Response Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={6}
                    placeholder="Write a thoughtful response to address the customer's feedback..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isSubmittingResponse}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitResponse}
                    disabled={!responseMessage.trim() || isSubmittingResponse}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmittingResponse ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Response
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;