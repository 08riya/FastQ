'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, MapPin, Phone, Star, MoreVertical } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface JoinedQueue {
  id: string;
  name: string;
  location: string;
  category: string;
  position: number;
  totalPeople: number;
  estimatedWait: string;
  status: 'waiting' | 'served' | 'cancelled';
  joinedAt: string;
  rating?: number;
}

export default function MyQueuesPage() {
  const router = useRouter();
  const [joinedQueues, setJoinedQueues] = useState<JoinedQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyQueues = async () => {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          router.push('/');
          return;
        }

        const res = await fetch(`${API_URL}/users/my-queues`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          router.push('/');
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch queues');
        }

        const mappedQueues: JoinedQueue[] = data.data.map((q: any) => ({
          id: q._id,
          name: q.name,
          location: q.location,
          category: q.category.charAt(0).toUpperCase() + q.category.slice(1),
          position: q.userPosition,
          totalPeople: q.currentUsers ? q.currentUsers.filter((u: any) => u.status === 'waiting').length : 0,
          estimatedWait: `${Math.round(q.estimatedWaitTime)} min`,
          status: 'waiting', // The API returns queues where user is waiting
          joinedAt: q.joinedAt,
          rating: q.rating?.average
        }));

        setJoinedQueues(mappedQueues);
      } catch (err: any) {
        console.error('Error fetching queues:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyQueues();
  }, [router]);

  const leaveQueue = async (queueId: string) => {
    if (!confirm('Are you sure you want to leave this queue?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/queues/${queueId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        setJoinedQueues(prev => prev.filter(q => q.id !== queueId));
      } else {
        alert(data.error || 'Failed to leave queue');
      }
    } catch (error) {
      console.error('Error leaving queue:', error);
      alert('Something went wrong');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400 bg-yellow-400/10';
      case 'served': return 'text-green-400 bg-green-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    switch (cat) {
      case 'food': return 'text-orange-400 bg-orange-400/10';
      case 'medical': return 'text-red-400 bg-red-400/10';
      case 'admin': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading your queues...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 py-12">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">My Queues</h1>
        <div className="text-sm text-gray-400">
          {joinedQueues.length} active queue{joinedQueues.length !== 1 ? 's' : ''}
        </div>
      </div>

      {joinedQueues.length === 0 ? (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Active Queues</h3>
          <p className="text-gray-400 mb-6">You haven't joined any queues yet. Browse available queues to get started!</p>
          <button
            onClick={() => router.push('/user-dashboard/join')}
            className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all"
          >
            Browse Queues
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {joinedQueues.map((queue) => (
            <div key={queue.id} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-100">{queue.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(queue.category)}`}>
                      {queue.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(queue.status)}`}>
                      {queue.status}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-400 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {queue.location}
                  </div>
                  <div className="text-xs text-gray-500">
                    Joined: <span suppressHydrationWarning>{new Date(queue.joinedAt).toLocaleString()}</span>
                  </div>
                </div>
                {/* Removed MoreVertical button as it was non-functional */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-sky-400">#{queue.position}</div>
                  <div className="text-xs text-gray-400">Your Position</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{queue.totalPeople}</div>
                  <div className="text-xs text-gray-400">Total People</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">{queue.estimatedWait}</div>
                  <div className="text-xs text-gray-400">Est. Wait Time</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => leaveQueue(queue.id)}
                    className="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-all text-sm"
                  >
                    Leave Queue
                  </button>
                </div>
                {queue.rating && (
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm">{queue.rating}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Removed Static Recent Activity Section for now as we focused on Active Queues */}
    </div>
  );
}


