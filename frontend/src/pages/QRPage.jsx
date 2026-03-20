import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Wifi, WifiOff, Smartphone, RefreshCw, QrCode, LogOut, Bot } from 'lucide-react';

export default function QRPage() {
    const { socket, waStatus } = useSocket();
    const [qrImage, setQrImage] = useState(null);
    const [pageState, setPageState] = useState('loading'); // loading | qr | connected | disconnected | restarting
    const [qrTimer, setQrTimer] = useState(0);

    // ── Socket events ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const onQR = ({ qr }) => {
            setQrImage(qr);
            setPageState('qr');
            setQrTimer(60); // WhatsApp QR valid ~60s
        };
        const onReady = () => { setPageState('connected'); setQrImage(null); };
        const onDisconnected = () => { setPageState('restarting'); setQrImage(null); };
        const onRestarting = () => { setPageState('restarting'); setQrImage(null); };

        socket.on('whatsapp-qr', onQR);
        socket.on('whatsapp-ready', onReady);
        socket.on('whatsapp-disconnected', onDisconnected);
        socket.on('whatsapp-restarting', onRestarting);

        return () => {
            socket.off('whatsapp-qr', onQR);
            socket.off('whatsapp-ready', onReady);
            socket.off('whatsapp-disconnected', onDisconnected);
            socket.off('whatsapp-restarting', onRestarting);
        };
    }, [socket]);

    // Sync waStatus on mount (backend sends cached state immediately on connect)
    useEffect(() => {
        if (waStatus === 'connected') setPageState('connected');
        else if (waStatus === 'qr') setPageState('qr'); // cached QR will arrive separately
    }, [waStatus]);

    // Auto-stop loading spinner after 25s if nothing arrived
    useEffect(() => {
        if (pageState !== 'loading') return;
        const t = setTimeout(() => setPageState('disconnected'), 25000);
        return () => clearTimeout(t);
    }, [pageState]);

    // QR countdown timer
    useEffect(() => {
        if (!qrTimer) return;
        const iv = setInterval(() => {
            setQrTimer(p => {
                if (p <= 1) { clearInterval(iv); return 0; }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [qrTimer]);

    const handleDisconnect = () => {
        if (socket) {
            socket.emit('logout-whatsapp');
            setPageState('restarting');
            setQrImage(null);
        }
    };

    const handleReconnect = () => {
        if (socket) {
            socket.emit('restart-whatsapp');
            setPageState('restarting');
            setQrImage(null);
        }
    };

    // ── Render helpers ─────────────────────────────────────────────────────────
    const renderStatus = () => {
        if (pageState === 'connected') {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                    padding: '32px 48px',
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.35)',
                    borderRadius: 'var(--radius-lg)',
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'rgba(34,197,94,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Wifi size={36} color="var(--success)" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)' }}>
                            WhatsApp Connected
                        </div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            Your bot is live and accepting orders from multiple customers.
                        </div>
                    </div>
                    {/* Disconnect button */}
                    <button
                        onClick={handleDisconnect}
                        style={{
                            marginTop: 8,
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '9px 20px',
                            background: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.35)',
                            borderRadius: 8, cursor: 'pointer',
                            color: 'var(--danger)', fontWeight: 600, fontSize: '0.88rem',
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                    >
                        <LogOut size={15} /> Disconnect WhatsApp
                    </button>
                </div>
            );
        }

        if (pageState === 'qr') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        background: 'white', borderRadius: 20, padding: 20,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                    }}>
                        <img src={qrImage} alt="WhatsApp QR Code"
                            style={{ width: 288, height: 288, display: 'block', borderRadius: 8 }} />
                    </div>
                    {qrTimer > 0 && (
                        <p style={{
                            fontSize: '0.88rem', fontWeight: 700,
                            color: qrTimer <= 10 ? 'var(--danger)' : 'var(--primary)',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <RefreshCw size={14} />
                            QR expires in {qrTimer}s
                        </p>
                    )}
                </div>
            );
        }

        if (pageState === 'restarting') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                    <div style={{ position: 'relative', width: 80, height: 80 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--border)' }} />
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            border: '3px solid transparent',
                            borderTopColor: 'var(--primary)',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RefreshCw size={28} color="var(--primary)" />
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                            Reinitialising WhatsApp…
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                            A new QR code will appear automatically in a few seconds.
                        </p>
                    </div>
                </div>
            );
        }

        if (pageState === 'loading') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                    <div style={{ position: 'relative', width: 80, height: 80 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--border)' }} />
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            border: '3px solid transparent',
                            borderTopColor: 'var(--primary)',
                            animation: 'spin 1s linear infinite',
                        }} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Starting WhatsApp… QR will appear shortly.
                    </p>
                </div>
            );
        }

        // disconnected (failed after timeout)
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                padding: '28px 36px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius)',
            }}>
                <WifiOff size={36} color="var(--danger)" />
                <p style={{ color: 'var(--danger)', fontWeight: 700 }}>WhatsApp Disconnected</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.6 }}>
                    Make sure the backend server is running.<br />Click below to retry.
                </p>
                <button
                    onClick={handleReconnect}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 22px',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        border: 'none', borderRadius: 8, cursor: 'pointer',
                        color: 'white', fontWeight: 700, fontSize: '0.9rem',
                    }}
                >
                    <RefreshCw size={15} /> Reconnect
                </button>
            </div>
        );
    };

    return (
        <div className="qr-container">
            {/* Header */}
            <div style={{ textAlign: 'center', maxWidth: 520 }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                }}>
                    <QrCode size={32} color="white" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>
                    Connect WhatsApp Bot
                </h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.92rem' }}>
                    Scan the QR code below with the <strong>WhatsApp number you want to use as your restaurant bot</strong>.<br />
                    Multiple customers can message that number to place orders.
                </p>
            </div>

            {/* Main status area */}
            {renderStatus()}

            {/* How to connect */}
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '22px 28px', maxWidth: 440, width: '100%',
            }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Smartphone size={16} color="var(--primary)" /> How to connect
                </h3>
                <ol style={{ paddingLeft: 20, lineHeight: 2.2, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    <li>Open WhatsApp on the <strong style={{ color: 'var(--text-primary)' }}>shop's phone</strong></li>
                    <li>Go to <strong style={{ color: 'var(--text-primary)' }}>Settings → Linked Devices</strong></li>
                    <li>Tap <strong style={{ color: 'var(--text-primary)' }}>Link a Device</strong></li>
                    <li>Scan the QR code — bot is live instantly!</li>
                </ol>
            </div>

            {/* Bot commands */}
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '22px 28px', maxWidth: 440, width: '100%',
            }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bot size={16} color="var(--primary)" /> Customer Commands
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {[
                        ['hi / hello / menu', 'Start ordering'],
                        ['1, 2, 3 (numbers)', 'Add items to cart'],
                        ['cart', 'View current cart'],
                        ['done', 'Confirm & place order'],
                        ['clear', 'Empty the cart'],
                        ['quit / bye', 'Exit & receive bill'],
                    ].map(([cmd, desc]) => (
                        <div key={cmd} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                            <code style={{
                                background: 'var(--bg-dark)', padding: '3px 10px',
                                borderRadius: 6, color: 'var(--primary)', fontWeight: 700,
                            }}>{cmd}</code>
                            <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
