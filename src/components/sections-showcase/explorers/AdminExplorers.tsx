import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Users, TrendingUp, Shield, Activity, BarChart3, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dashboard metrics explorer
export function DashboardExplorer() {
  const [metrics, setMetrics] = useState([
    { label: 'Users', value: 1247, trend: 12 },
    { label: 'Views', value: 8934, trend: 8 },
    { label: 'Brands', value: 56, trend: 3 },
    { label: 'Active', value: 89, trend: -2 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.value + Math.floor(Math.random() * 10 - 3),
        trend: m.trend + (Math.random() > 0.5 ? 1 : -1),
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            className="bg-muted/30 rounded-xl p-4 border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
            <div className="flex items-end justify-between">
              <motion.span 
                className="text-2xl font-bold text-foreground"
                key={metric.value}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
              >
                {metric.value.toLocaleString()}
              </motion.span>
              <span className={cn(
                "text-xs font-medium flex items-center gap-0.5",
                metric.trend >= 0 ? "text-green-500" : "text-red-500"
              )}>
                <TrendingUp className={cn("w-3 h-3", metric.trend < 0 && "rotate-180")} />
                {Math.abs(metric.trend)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="h-24 bg-muted/30 rounded-xl border border-border/50 p-4 flex items-end gap-1">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-accent/60 rounded-t"
            initial={{ height: 0 }}
            animate={{ height: `${30 + Math.random() * 70}%` }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
          />
        ))}
      </div>
    </div>
  );
}

// Analytics visualization explorer
export function AnalyticsExplorer() {
  const [view, setView] = useState<'bar' | 'pie' | 'line'>('bar');
  const [data] = useState([65, 45, 80, 55, 70, 40, 90]);

  return (
    <div className="space-y-6">
      {/* Chart preview */}
      <div className="h-48 bg-muted/30 rounded-xl border border-border/50 p-4 flex items-end justify-center gap-2">
        {view === 'bar' && data.map((value, i) => (
          <motion.div
            key={i}
            className="flex-1 max-w-8 bg-gradient-to-t from-accent to-primary rounded-t"
            initial={{ height: 0 }}
            animate={{ height: `${value}%` }}
            transition={{ delay: i * 0.1, type: "spring" }}
          />
        ))}

        {view === 'pie' && (
          <motion.div
            className="w-32 h-32 rounded-full relative"
            style={{
              background: `conic-gradient(
                hsl(var(--accent)) 0deg 130deg,
                hsl(var(--primary)) 130deg 220deg,
                hsl(var(--muted)) 220deg 290deg,
                hsl(var(--accent) / 0.5) 290deg 360deg
              )`,
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring" }}
          >
            <div className="absolute inset-4 bg-card rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-foreground">100%</span>
            </div>
          </motion.div>
        )}

        {view === 'line' && (
          <svg className="w-full h-full" viewBox="0 0 100 60">
            <motion.path
              d={`M 0 ${60 - data[0] * 0.5} ${data.map((v, i) => `L ${i * 16.6} ${60 - v * 0.5}`).join(' ')}`}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
            {data.map((v, i) => (
              <motion.circle
                key={i}
                cx={i * 16.6}
                cy={60 - v * 0.5}
                r="3"
                fill="hsl(var(--accent))"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 * i }}
              />
            ))}
          </svg>
        )}
      </div>

      {/* View selector */}
      <div className="flex justify-center gap-2">
        {[
          { key: 'bar', icon: BarChart3, label: 'Bar' },
          { key: 'pie', icon: PieChart, label: 'Pie' },
          { key: 'line', icon: Activity, label: 'Line' },
        ].map(({ key, icon: Icon, label }) => (
          <motion.button
            key={key}
            onClick={() => setView(key as typeof view)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5",
              view === key 
                ? "bg-accent text-accent-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Audit log explorer
export function AuditExplorer() {
  const [logs, setLogs] = useState([
    { action: 'Updated', entity: 'Brand Colors', time: '2m ago', user: 'JD' },
    { action: 'Created', entity: 'New Logo', time: '15m ago', user: 'SK' },
    { action: 'Published', entity: 'Style Guide', time: '1h ago', user: 'JD' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const actions = ['Updated', 'Created', 'Viewed', 'Exported'];
      const entities = ['Typography', 'Colors', 'Patterns', 'Templates'];
      const users = ['JD', 'SK', 'MR', 'AL'];
      
      setLogs(prev => [
        {
          action: actions[Math.floor(Math.random() * actions.length)],
          entity: entities[Math.floor(Math.random() * entities.length)],
          time: 'Just now',
          user: users[Math.floor(Math.random() * users.length)],
        },
        ...prev.slice(0, 2),
      ]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const actionColors: Record<string, string> = {
    Updated: 'bg-blue-500',
    Created: 'bg-green-500',
    Published: 'bg-purple-500',
    Viewed: 'bg-gray-500',
    Exported: 'bg-orange-500',
  };

  return (
    <div className="space-y-4">
      {/* Log entries */}
      <div className="space-y-2">
        {logs.map((log, i) => (
          <motion.div
            key={`${log.entity}-${i}`}
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={cn("w-2 h-2 rounded-full", actionColors[log.action] || 'bg-gray-500')} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground">
                <span className="font-medium">{log.action}</span> {log.entity}
              </div>
              <div className="text-xs text-muted-foreground">{log.time}</div>
            </div>
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-xs font-medium text-accent">{log.user}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 flex-wrap">
        {Object.entries(actionColors).slice(0, 4).map(([action, color]) => (
          <div key={action} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", color)} />
            <span className="text-xs text-muted-foreground">{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// User management explorer
export function UserExplorer() {
  const [selectedRole, setSelectedRole] = useState(0);

  const roles = [
    { name: 'Admin', count: 3, color: 'bg-red-500' },
    { name: 'Editor', count: 8, color: 'bg-blue-500' },
    { name: 'Viewer', count: 24, color: 'bg-green-500' },
  ];

  const users = [
    { name: 'John Doe', role: 0, avatar: 'JD' },
    { name: 'Sarah Kim', role: 1, avatar: 'SK' },
    { name: 'Mike Ross', role: 2, avatar: 'MR' },
    { name: 'Amy Lee', role: 1, avatar: 'AL' },
  ];

  return (
    <div className="space-y-6">
      {/* Role breakdown */}
      <div className="flex justify-center gap-6">
        {roles.map((role, i) => (
          <motion.button
            key={role.name}
            onClick={() => setSelectedRole(i)}
            className={cn(
              "text-center transition-all",
              selectedRole === i ? "scale-110" : "opacity-60"
            )}
            whileHover={{ scale: 1.1 }}
          >
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1", role.color)}>
              {role.count}
            </div>
            <span className="text-xs text-muted-foreground">{role.name}</span>
          </motion.button>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {users.filter(u => selectedRole === -1 || u.role === selectedRole || selectedRole === 0).slice(0, 3).map((user, i) => (
          <motion.div
            key={user.name}
            className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium", roles[user.role].color)}>
              {user.avatar}
            </div>
            <div className="flex-1">
              <div className="text-sm text-foreground">{user.name}</div>
              <div className="text-xs text-muted-foreground">{roles[user.role].name}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
