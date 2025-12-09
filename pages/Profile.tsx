import React, { useState } from 'react';
import { User, Store } from '../types';
import { Card, Button, Input } from '../components/UI';
import { User as UserIcon, Save, Image, Mail } from 'lucide-react';
import { authApi } from '../src/api/auth';
import { storesApi } from '../src/api/stores';
import { useEffect } from 'react';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<Partial<User>>({ ...user });
    const [storeForm, setStoreForm] = useState<Partial<Store> | null>(null);

    useEffect(() => {
        // load associated store if user belongs to a store
        const loadStore = async () => {
            if (user?.storeId) {
                try {
                    const s = await storesApi.getById(user.storeId);
                    setStoreForm(s);
                } catch (err) {
                    console.error('Failed to load store for profile', err);
                }
            } else {
                setStoreForm(null);
            }
        };
        loadStore();
    }, [user?.storeId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username) return;
        try {
                        const savedUser = await onUpdateUser({ ...user, ...formData } as User);

                        // If the user is assigned to a store and storeForm exists, persist store changes
                        if (storeForm && user.storeId) {
                            try {
                                // Only send store-specific editable fields
                                const storePayload: any = {
                                    name: storeForm.name,
                                    currency: storeForm.currency,
                                    globalDiscount: storeForm.globalDiscount,
                                    primaryUpiId: storeForm.primaryUpiId,
                                    secondaryUpiId: storeForm.secondaryUpiId,
                                    activeUpiIdType: storeForm.activeUpiIdType,
                                    gstNumber: storeForm.gstNumber,
                                    address: storeForm.address,
                                    timezone: storeForm.timezone
                                };
                                await storesApi.update(user.storeId, storePayload);
                            } catch (err) {
                                console.error('Failed to update store from profile', err);
                                alert('Profile updated but failed to update store details. See console.');
                                return;
                            }
                        }

                        alert('Profile updated successfully!');
        } catch (err) {
            console.error('Profile update failed', err);
            alert('Failed to update profile. See console for details.');
        }
    };

    const [pwForm, setPwForm] = React.useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pwForm.oldPassword || !pwForm.newPassword) return alert('Please fill both fields');
        if (pwForm.newPassword !== pwForm.confirmPassword) return alert('New passwords do not match');

        try {
            await authApi.changePassword(pwForm.oldPassword, pwForm.newPassword);
            alert('Password changed successfully');
            setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            console.error('Change password failed', err);
            alert(err?.response?.data?.error || 'Failed to change password');
        }
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

                         <Input 
                            label="Display Name"
                            value={(formData as any).displayName || ''}
                            onChange={e => setFormData({...formData, displayName: e.target.value})}
                            placeholder="e.g. John Doe"
                         />

                         <Input 
                            label="Mobile Number"
                            type="tel"
                            value={(formData as any).phoneNumber || ''}
                            onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                            placeholder="+1 234 567 890"
                         />
                    </div>
                </div>

                                {/* Additional Details Section: store-related fields are edited on the store record */}
                                {storeForm && (
                                    <div className="border-t pt-6 space-y-6">
                                        {/* Store Configuration Section */}
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-700">Store Configuration</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Store Name</label>
                                                    <input 
                                                        type="text"
                                                        value={storeForm.name || ''}
                                                        onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                        placeholder="Store name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-slate-600">Currency</label>
                                                    <input 
                                                        type="text"
                                                        value={storeForm.currency || ''}
                                                        disabled
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-100 cursor-not-allowed"
                                                    />
                                                    <p className="text-xs text-slate-500 mt-1">ℹ️ Currency is locked and cannot be changed. Changing it would cause all historical transaction amounts to display incorrectly.</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-slate-600">Global Discount % (Seasonal)</label>
                                                <input 
                                                    type="number"
                                                    value={storeForm.globalDiscount || 0}
                                                    onChange={e => setStoreForm({ ...storeForm, globalDiscount: parseFloat(e.target.value) })}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        {/* Payment Configuration Section */}
                                        <div className="space-y-4 pt-4 border-t">
                                            <h3 className="font-bold text-slate-700">Payment Configuration</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="Primary UPI ID"
                                                    value={storeForm.primaryUpiId || ''}
                                                    onChange={e => setStoreForm({ ...(storeForm || {}), primaryUpiId: e.target.value })}
                                                    placeholder="primary@upi"
                                                />
                                                <Input
                                                    label="Secondary UPI ID"
                                                    value={storeForm.secondaryUpiId || ''}
                                                    onChange={e => setStoreForm({ ...(storeForm || {}), secondaryUpiId: e.target.value })}
                                                    placeholder="secondary@upi"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-slate-600">Select Active Payment Account</label>
                                                <div className="mt-2 space-y-2">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="activeUpi"
                                                            value="PRIMARY"
                                                            checked={storeForm.activeUpiIdType === 'PRIMARY'}
                                                            onChange={e => setStoreForm({ ...storeForm, activeUpiIdType: e.target.value })}
                                                        />
                                                        <span className="text-sm">Primary Account: {storeForm.primaryUpiId || 'N/A'}</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="activeUpi"
                                                            value="SECONDARY"
                                                            checked={storeForm.activeUpiIdType === 'SECONDARY'}
                                                            onChange={e => setStoreForm({ ...storeForm, activeUpiIdType: e.target.value })}
                                                        />
                                                        <span className="text-sm">Secondary Account: {storeForm.secondaryUpiId || 'N/A'}</span>
                                                    </label>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2">The selected account's QR code will be displayed on customer invoices and the checkout screen.</p>
                                            </div>
                                        </div>

                                        {/* Other Store Details */}
                                        <div className="space-y-4 pt-4 border-t">
                                            <h3 className="font-bold text-slate-700">Business Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input
                                                    label="GST/Tax Number"
                                                    value={storeForm.gstNumber || ''}
                                                    onChange={e => setStoreForm({ ...(storeForm || {}), gstNumber: e.target.value })}
                                                    placeholder="Tax Identification No."
                                                />
                                                <Input
                                                    label="Timezone"
                                                    value={storeForm.timezone || ''}
                                                    onChange={e => setStoreForm({ ...(storeForm || {}), timezone: e.target.value })}
                                                    placeholder="e.g. Asia/Kolkata"
                                                />
                                            </div>

                                            <Input
                                                label="Address"
                                                value={storeForm.address || ''}
                                                onChange={e => setStoreForm({ ...(storeForm || {}), address: e.target.value })}
                                                placeholder="Full physical address"
                                            />
                                        </div>
                                    </div>
                                )}
                                {!storeForm && (
                                    <div className="border-t pt-6">
                                        <p className="text-sm text-slate-500">You are not assigned to any store.</p>
                                    </div>
                                )}

                <div className="border-t pt-4 flex justify-end">
                    <Button type="submit" className="flex items-center gap-2">
                        <Save size={18} /> Update Profile
                    </Button>
                </div>
           </form>
       </Card>

            <Card title="Change Password">
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input label="Old Password" type="password" value={pwForm.oldPassword} onChange={e => setPwForm({...pwForm, oldPassword: e.target.value})} />
                    <Input label="New Password" type="password" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} />
                    <Input label="Confirm New Password" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} />
                    <div className="flex justify-end">
                        <Button type="submit">Change Password</Button>
                    </div>
                </form>
            </Card>
    </div>
  );
};