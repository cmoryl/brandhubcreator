import { useEffect, useRef, useState } from 'react';
import { AuditDetailLoader } from '@/components/brand/CanvaAuditSkeletons';
import { AuditPageHeader } from '@/components/brand/AuditPageHeader';
import { useBrandContextBySlug } from '@/hooks/useBrandContextBySlug';
import { useCanvaAuditAutoSync } from '@/hooks/useCanvaAuditAnalyses';

const AUDIT_URL = '/transperfect/canva-audit.html';

export default function TransPerfectCanvaAudit() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { brandId, organizationId } = useBrandContextBySlug('transperfect');
  useCanvaAuditAutoSync(
    organizationId
      ? { brandSlug: 'transperfect', brandId, organizationId, auditSlug: 'transperfect-canva-audit' }
      : null,
  );

  useEffect(() => {
    document.title = 'Canva Master Registry + Audit — TransPerfect';
  }, []);

  const applyTheme = (t: 'dark' | 'light') => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    doc.body.classList.toggle('light-mode', t === 'light');
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <AuditPageHeader
        title="Canva Master Registry + Audit"
        subtitle="TransPerfect — shareable team report"
        auditUrl={AUDIT_URL}
        downloadName="Canva_Master_Registry_Audit_TransPerfect.html"
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />

      <AuditDetailLoader loaded={loaded}>
        <iframe
          ref={iframeRef}
          src={AUDIT_URL}
          title="Canva Master Registry + Audit — TransPerfect"
          className="absolute inset-0 h-full w-full border-0 bg-background"
          onLoad={() => {
            applyTheme(theme);
            setLoaded(true);
          }}
        />
      </AuditDetailLoader>
    </div>
  );
}
