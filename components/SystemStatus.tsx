import React, { useState, useEffect } from 'react';
import { CronLog } from '../types';
import { ClockIcon, CheckCircleIcon, XCircleIcon, TerminalIcon } from './icons';
import { authenticatedFetch } from '../services/supabaseClient';

export const SystemStatus: React.FC = () => {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [loading, setLoading] = useState(true);
  const latestStatus = logs[0]?.status;
  const statusLabel = loading
    ? 'Checking status'
    : latestStatus === 'success'
      ? 'Latest cron log succeeded'
      : latestStatus === 'failure'
        ? 'Latest cron log failed'
        : 'No cron status available';
  const statusClass = latestStatus === 'success'
    ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : latestStatus === 'failure'
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await authenticatedFetch('/api/system-status');
        if (!response.ok) {
          throw new Error('Unable to fetch cron logs');
        }

        const data = await response.json();
        const nextLogs = Array.isArray(data.logs)
          ? data.logs.map((log: any) => ({
              id: String(log.id ?? `${Date.now()}-${Math.random()}`),
              timestamp: log.timestamp,
              status: log.status,
              message: log.message,
              serverTime: log.serverTime,
            }))
          : [];

        setLogs(nextLogs);
      } catch (error) {
        console.error('Error fetching cron logs:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium text-white">System Status</h1>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${statusClass}`}>
          <div className="w-2 h-2 rounded-full bg-current"></div>
          {statusLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-bg-card p-6 rounded-xl border border-brand-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-accent/10 rounded-lg">
              <ClockIcon className="h-5 w-5 text-brand-accent" />
            </div>
            <h3 className="font-medium text-white">Execution Frequency</h3>
          </div>
          <p className="text-2xl font-bold text-white">Optional</p>
          <p className="text-gray-400 text-sm mt-1">Local development only; enable with ENABLE_CRON_LOGS=true</p>
        </div>

        <div className="bg-brand-bg-card p-6 rounded-xl border border-brand-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TerminalIcon className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="font-medium text-white">Database Target</h3>
          </div>
          <p className="text-2xl font-bold text-white">Postgres (if configured)</p>
          <p className="text-gray-400 text-sm mt-1">Database connectivity and production monitoring are not verified here</p>
        </div>

        <div className="bg-brand-bg-card p-6 rounded-xl border border-brand-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-medium text-white">Runtime Health</h3>
          </div>
          <p className="text-2xl font-bold text-white">Not monitored</p>
          <p className="text-gray-400 text-sm mt-1">Configure production health checks and alerting before launch</p>
        </div>
      </div>

      <div className="bg-brand-bg-card rounded-xl border border-brand-border overflow-hidden">
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <h3 className="font-medium text-white">Recent Execution Logs</h3>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Last 10 Runs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-bg-content/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Message</th>
                <th className="px-6 py-3 font-medium">Log ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No logs found. Cron logging is opt-in and disabled in production.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-bg-content/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {log.status === 'success' ? <CheckCircleIcon className="h-3 w-3" /> : <XCircleIcon className="h-3 w-3" />}
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">
                      {log.id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
