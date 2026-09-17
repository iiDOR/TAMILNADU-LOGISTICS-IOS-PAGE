import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../store/authStore';
import { getTmpAvatar } from '../api/tmpAvatar';

export function ProfileSheet() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    try {
      const d = localStorage.getItem('tnl_dash');
      const tmpId = d ? JSON.parse(d)?.rider?.truckersmpId : null;
      if (tmpId) getTmpAvatar(String(tmpId)).then(setAvatar);
    } catch {}
  }, []);

  if (!user) return null;

  const overlay = open ? (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 24px calc(env(safe-area-inset-bottom) + 24px)',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 99, margin: '0 auto 24px' }} />

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(245,197,24,0.3)', flexShrink: 0 }}>
            {avatar
              ? <img src={avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5c518', fontWeight: 700, fontSize: 20 }}>
                  {user.username[0].toUpperCase()}
                </div>
            }
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 16, margin: 0 }}>{user.username}</p>
            {user.vtcName && <p style={{ color: '#f5c518', fontSize: 12, margin: '4px 0 0' }}>{user.vtcName}</p>}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />

        <button
          onClick={() => { logout(); setOpen(false); }}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.4)',
            background: 'transparent', color: '#ef4444',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button onClick={() => setOpen(true)}
              className="w-8 h-8 rounded-full overflow-hidden border border-soft active:scale-95 transition-transform">
        {avatar
          ? <img src={avatar} alt={user.username} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-elevated flex items-center justify-center text-xs font-bold text-gold">
              {user.username[0].toUpperCase()}
            </div>
        }
      </button>

      {createPortal(overlay, document.getElementById('root')!)}
    </>
  );
}
