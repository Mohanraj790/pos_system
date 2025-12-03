import React, { useState } from 'react';
import { User, Store } from '../types';
import { Card, Button, Input } from '../components/UI';
import { User as UserIcon, Save, Image, Mail } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<Partial<User>>({ ...user });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) return;
    onUpdateUser({ ...user, ...formData } as User);
    alert('Profile updated successfully!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <div className="flex items-center gap-4">
           <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
               <UserIcon size={32} />
           </div>
           <div>
               <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
               <p className="text-slate-500">Manage your account settings</p>
           </div>
       </div>

       <Card>
           <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex flex-col items-center gap-2">
                        {formData.imageUrl ? (
                            <img src={formData.imageUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-slate-100" />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <Image size={48} />
                            </div>
                        )}
                        <div className="text-center w-full">
                            <label className="text-xs font-bold text-indigo-600 cursor-pointer hover:underline">
                                Change Image URL
                                <input 
                                   type="text" 
                                   className="hidden" // Hiding actual file input as we use URL string for this demo
                                /> 
                            </label>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                         <Input 
                            label="Profile Image URL"
                            value={formData.imageUrl || ''}
                            onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                            placeholder="https://example.com/me.jpg"
                         />

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Input 
                                label="Username"
                                value={formData.username || ''}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                             />
                             <Input 
                                label="Role"
                                value={formData.role || ''}
                                disabled
                                className="bg-slate-100 cursor-not-allowed"
                             />
                         </div>

                         <Input 
                            label="Email Address"
                            type="email"
                            value={formData.email || ''}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            placeholder="user@example.com"
                         />
                    </div>
                </div>

                <div className="border-t pt-4 flex justify-end">
                    <Button type="submit" className="flex items-center gap-2">
                        <Save size={18} /> Update Profile
                    </Button>
                </div>
           </form>
       </Card>
    </div>
  );
};