import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      let currentUser = session?.user;

      if (!session) {
        const isTester = localStorage.getItem('isTester');
        if (isTester === 'true') {
          currentUser = JSON.parse(localStorage.getItem('testerUser') || '{}');
          setUser(currentUser);
        } else {
          navigate('/auth');
          return;
        }
      } else {
        setUser(session.user);
      }

      if (currentUser?.email === 'tester@gmail.com') {
        setProfile({
          full_name: 'Tester User',
          id: currentUser.id
        });
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        setProfile(data);
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen font-montserrat bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="glass-card p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-budgify-500/20 flex items-center justify-center">
              <User size={48} className="text-budgify-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile?.full_name || 'User'}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="glass p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Mail size={20} className="text-budgify-400" />
                <h3 className="font-semibold">Email</h3>
              </div>
              <p className="text-muted-foreground ml-8">{user?.email}</p>
            </div>

            <div className="glass p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={20} className="text-budgify-400" />
                <h3 className="font-semibold">Member Since</h3>
              </div>
              <p className="text-muted-foreground ml-8">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="glass p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Shield size={20} className="text-budgify-400" />
                <h3 className="font-semibold">Account Status</h3>
              </div>
              <p className="text-muted-foreground ml-8">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
