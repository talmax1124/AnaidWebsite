import React, { useState, useEffect } from 'react';
import { Users, User as UserIcon, Crown } from 'lucide-react';
import { User } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users');
      const result = await response.json();
      
      if (result.success && result.data && Array.isArray(result.data)) {
        const usersData = result.data.map((user: any) => ({
          id: user.id.toString(),
          clerkId: user.id.toString(), // Using ID as clerkId for compatibility
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at || user.created_at)
        })) as User[];
        
        setUsers(usersData);
      } else {
        console.error('Failed to load users or invalid data structure:', result);
        setUsers([]); // Set empty array as fallback
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'customer') => {
    setUpdating(userId);
    
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        console.error('Failed to update user role:', result.message);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          User Management
        </h3>
        
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <UserIcon className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{Array.isArray(users) ? users.filter(u => u.role === 'customer').length : 0}</p>
                  <p className="text-sm text-blue-600">Customers</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Crown className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-purple-900">{Array.isArray(users) ? users.filter(u => u.role === 'admin').length : 0}</p>
                  <p className="text-sm text-purple-600">Admins</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-green-900">{Array.isArray(users) ? users.length : 0}</p>
                  <p className="text-sm text-green-600">Total Users</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
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
              {Array.isArray(users) && users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? (
                        <><Crown className="w-3 h-3 mr-1" /> Admin</>
                      ) : (
                        <><UserIcon className="w-3 h-3 mr-1" /> Customer</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {user.role === 'customer' ? (
                        <button
                          onClick={() => updateUserRole(user.id, 'admin')}
                          disabled={updating === user.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        >
                          {updating === user.id ? 'Updating...' : 'Make Admin'}
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserRole(user.id, 'customer')}
                          disabled={updating === user.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {updating === user.id ? 'Updating...' : 'Make Customer'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {(!Array.isArray(users) || users.length === 0) && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;