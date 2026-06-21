'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabaseClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Check if they are a portal user
      const { data: portalUser, error: pError } = await supabase
        .from('client_portal_users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (pError || !portalUser) {
        await supabase.auth.signOut();
        throw new Error('Access denied. This portal is restricted to authorized clients.');
      }

      toast.success('Access Granted. Welcome to Nexus 2.0.');
      router.push('/portal/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gold/10 border border-gold/30 rounded-3xl flex items-center justify-center mx-auto shadow-gold">
            <Shield size={40} className="text-gold" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">NEXUS PORTAL</h1>
            <p className="text-text-muted text-sm uppercase tracking-[0.4em] font-medium">Secure Client Authentication</p>
          </div>
        </div>

        <div className="card glass p-8 space-y-6 border-white/5 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-widest text-text-dim">Authorized Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input 
                  type="email" 
                  required 
                  className="form-input pl-12 h-14 bg-white/5 border-white/10"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label text-xs uppercase tracking-widest text-text-dim">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50" size={18} />
                <input 
                  type="password" 
                  required 
                  className="form-input pl-12 h-14 bg-white/5 border-white/10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary btn-lg w-full h-14 shadow-gold text-base font-bold flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Establish Connection
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-text-dim leading-relaxed">
              Protected by Enterprise-Grade RSA Encryption.<br/>
              Unauthorized access attempts are logged and reported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
