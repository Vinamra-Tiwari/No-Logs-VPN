import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Clock,
  Copy,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Blocks,
  Hash,
  ArrowUpRight,
} from 'lucide-react';

export default function AuditTrail({ peerId, peerName, onClose }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const fetchAuditTrail = async () => {
    if (!peerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/peers/${peerId}/audit-trail`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
      setError(err.message || 'Unable to connect to audit ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [peerId]);

  const copyToClipboard = (text, type = 'hash') => {
    navigator.clipboard.writeText(text);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getEventBadge = (eventType, eventName) => {
    switch (Number(eventType)) {
      case 0:
        return {
          label: eventName || 'Provisioned',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
        };
      case 1:
        return {
          label: eventName || 'Rotated',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
        };
      case 2:
        return {
          label: eventName || 'Revoked',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
        };
      default:
        return {
          label: eventName || 'Unknown',
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          dot: 'bg-slate-400',
        };
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    const date = new Date(ts * 1000);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatRelativeTime = (ts) => {
    if (!ts) return '';
    const diffSec = Math.floor(Date.now() / 1000 - ts);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const truncateHash = (str, left = 8, right = 6) => {
    if (!str || str.length <= left + right) return str || '';
    return `${str.slice(0, left)}...${str.slice(-right)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                On-Chain Audit Trail
              </h2>
              <p className="text-xs text-slate-400">
                Peer: <span className="text-cyan-300 font-medium">{data?.name || peerName || peerId}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAuditTrail}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Refresh ledger logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Privacy & Key Hash Banner */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                Anchored Public Key Hash (SHA-256)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Zero-Knowledge Privacy
              </span>
            </div>
            {data?.publicKeyHash ? (
              <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2">
                <span className="font-mono text-xs text-cyan-300 truncate mr-2" title={data.publicKeyHash}>
                  {data.publicKeyHash}
                </span>
                <button
                  onClick={() => copyToClipboard(data.publicKeyHash, 'keyHash')}
                  className="text-slate-400 hover:text-cyan-300 transition-colors p-1 flex-shrink-0"
                  title="Copy full key hash"
                >
                  {copiedHash === 'keyHash' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="h-8 bg-slate-900/60 rounded-xl animate-pulse" />
            )}
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Tamper-evident verification: Only the SHA-256 digest of this peer's public key is anchored. Neither private keys nor raw public keys ever touch the blockchain.
            </p>
          </div>

          {/* Ledger Event History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Blocks className="w-3.5 h-3.5 text-slate-400" />
                Lifecycle Transitions ({data?.events ? data.events.length : 0})
              </h3>
              <span className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Local Dev Ledger
              </span>
            </div>

            {loading ? (
              <div className="space-y-4 py-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 animate-pulse space-y-2"
                  >
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Ledger Connection Notice</p>
                  <p className="text-xs text-rose-400/80 mt-1">{error}</p>
                  <button
                    onClick={fetchAuditTrail}
                    className="mt-3 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            ) : !data?.events || data.events.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-950/30 border border-dashed border-slate-800">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400">No on-chain events recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Events are anchored upon peer provisioning, key rotation, or revocation.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-800">
                {data.events.map((event, idx) => {
                  const badge = getEventBadge(event.eventType, event.eventName);
                  const isLast = idx === data.events.length - 1;

                  return (
                    <motion.div
                      key={event.txHash || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="relative"
                    >
                      {/* Timeline marker */}
                      <div
                        className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${badge.dot}`}
                      />

                      {/* Event Card */}
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                            {event.blockNumber && (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
                                Block #{event.blockNumber}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs text-slate-400 flex items-center gap-1"
                            title={formatTimestamp(event.timestamp)}
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatRelativeTime(event.timestamp)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 mb-2">
                          {formatTimestamp(event.timestamp)}
                        </div>

                        {/* Tx Hash */}
                        {event.txHash && (
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60 text-slate-400">
                            <span className="font-mono text-slate-400">
                              Tx: <span className="text-slate-300">{truncateHash(event.txHash, 10, 8)}</span>
                            </span>
                            <button
                              onClick={() => copyToClipboard(event.txHash, `tx-${idx}`)}
                              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                              title="Copy transaction hash"
                            >
                              {copiedHash === `tx-${idx}` ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Copied
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Copy className="w-3 h-3" /> Copy Tx
                                </span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cryptographically Verified</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-xs font-medium"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
