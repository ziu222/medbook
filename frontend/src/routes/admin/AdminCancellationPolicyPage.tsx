import { useEffect, useState, type CSSProperties } from 'react';
import { AdminTabs } from '../../components/Common/AdminTabs';
import {
  ApiError,
  activateCancellationPolicy,
  createCancellationPolicy,
  fetchActiveCancellationPolicy,
  type CancellationPolicy,
  type RefundTierInput,
} from '../../lib/api';
import { getUserRole, redirectToLogin } from '../../lib/auth';

const fieldStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid var(--line)',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
};

const labelStyle: CSSProperties = { fontWeight: 700, fontSize: '13.5px', marginBottom: '6px', display: 'block' };

const ROLE_LABELS: Record<'patient' | 'provider', string> = { patient: 'Bệnh nhân hủy', provider: 'Bác sĩ/phòng khám hủy' };

const DEFAULT_TIERS: RefundTierInput[] = [
  { actor_role: 'patient', min_minutes_before: 10080, refund_percentage: 100 },
  { actor_role: 'patient', min_minutes_before: 4320, refund_percentage: 50 },
  { actor_role: 'provider', min_minutes_before: 0, refund_percentage: 100 },
];

function ActivePolicySummary({ policy }: { policy: CancellationPolicy | null }) {
  if (policy === null) {
    return <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Chưa có chính sách nào được áp dụng.</div>;
  }
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '22px', marginBottom: '26px' }}>
      <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '14px' }}>Chính sách đang áp dụng</div>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '14px', color: 'var(--ink2)' }}>
        <div>
          Bệnh nhân được hủy trước: <b>{policy.patient_cancel_cutoff_minutes} phút</b>
        </div>
        <div>
          Bác sĩ/phòng khám: <b>{policy.provider_cancel_cutoff_minutes === null ? 'không giới hạn' : `${policy.provider_cancel_cutoff_minutes} phút`}</b>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--faint)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '6px 8px', fontWeight: 700 }}>Ai hủy</th>
            <th style={{ padding: '6px 8px', fontWeight: 700 }}>Hủy trước tối thiểu</th>
            <th style={{ padding: '6px 8px', fontWeight: 700 }}>Hoàn tiền</th>
          </tr>
        </thead>
        <tbody>
          {policy.refund_tiers.map((tier) => (
            <tr key={tier.id} style={{ borderTop: '1px solid var(--line)' }}>
              <td style={{ padding: '8px' }}>{ROLE_LABELS[tier.actor_role]}</td>
              <td style={{ padding: '8px' }}>{tier.min_minutes_before} phút</td>
              <td style={{ padding: '8px', fontWeight: 700 }}>{tier.refund_percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewPolicyForm({ onActivated }: { onActivated: (policy: CancellationPolicy) => void }) {
  const [patientCutoff, setPatientCutoff] = useState('10080');
  const [providerUnlimited, setProviderUnlimited] = useState(true);
  const [providerCutoff, setProviderCutoff] = useState('0');
  const [tiers, setTiers] = useState<RefundTierInput[]>(DEFAULT_TIERS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTier = (index: number, patch: Partial<RefundTierInput>) => {
    setTiers((prev) => prev.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
  };

  const canSave =
    Number(patientCutoff) >= 0 &&
    tiers.length >= 2 &&
    tiers.some((t) => t.actor_role === 'patient') &&
    tiers.some((t) => t.actor_role === 'provider') &&
    !busy;

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await createCancellationPolicy({
        patient_cancel_cutoff_minutes: Number(patientCutoff) || 0,
        provider_cancel_cutoff_minutes: providerUnlimited ? null : Number(providerCutoff) || 0,
        refund_tiers: tiers,
      });
      const activated = await activateCancellationPolicy(created.id);
      onActivated(activated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lưu chính sách thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '18px', padding: '24px', maxWidth: '720px' }}>
      <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '18px' }}>Tạo chính sách mới (thay thế chính sách hiện tại)</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
        <div>
          <label style={labelStyle}>Bệnh nhân được hủy trước (phút)</label>
          <input type="number" min={0} value={patientCutoff} onChange={(e) => setPatientCutoff(e.target.value)} style={fieldStyle} placeholder="VD: 10080 (7 ngày)" />
        </div>
        <div>
          <label style={labelStyle}>Bác sĩ/phòng khám được hủy trước</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', height: '38px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
              <input type="checkbox" checked={providerUnlimited} onChange={(e) => setProviderUnlimited(e.target.checked)} />
              Không giới hạn
            </label>
            {!providerUnlimited && (
              <input type="number" min={0} value={providerCutoff} onChange={(e) => setProviderCutoff(e.target.value)} style={{ ...fieldStyle, width: '120px' }} />
            )}
          </div>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>Mốc hoàn tiền</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        {tiers.map((tier, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select value={tier.actor_role} onChange={(e) => updateTier(i, { actor_role: e.target.value as 'patient' | 'provider' })} style={{ ...fieldStyle, flex: '0 0 180px' }}>
              <option value="patient">Bệnh nhân hủy</option>
              <option value="provider">Bác sĩ/phòng khám hủy</option>
            </select>
            <input
              type="number"
              min={0}
              value={tier.min_minutes_before}
              onChange={(e) => updateTier(i, { min_minutes_before: Number(e.target.value) || 0 })}
              style={{ ...fieldStyle, flex: '0 0 130px' }}
              placeholder="Phút trước"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={tier.refund_percentage}
              onChange={(e) => updateTier(i, { refund_percentage: Number(e.target.value) || 0 })}
              style={{ ...fieldStyle, flex: '0 0 90px' }}
              placeholder="% hoàn"
            />
            <span style={{ color: 'var(--faint)', fontSize: '13px' }}>%</span>
            <span
              onClick={() => setTiers((prev) => prev.filter((_, idx) => idx !== i))}
              className="link-hover"
              style={{ marginLeft: 'auto', color: '#c0492f', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
            >
              Xóa
            </span>
          </div>
        ))}
      </div>
      <span
        onClick={() => setTiers((prev) => [...prev, { actor_role: 'patient', min_minutes_before: 0, refund_percentage: 0 }])}
        className="link-hover"
        style={{ color: 'var(--brand-d)', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}
      >
        + Thêm mốc
      </span>

      {error && <div style={{ color: '#c0492f', fontSize: '13.5px', marginTop: '16px' }}>{error}</div>}

      <div style={{ marginTop: '20px' }}>
        <span
          onClick={canSave ? handleSubmit : undefined}
          className={canSave ? 'btn-hover' : undefined}
          style={{
            display: 'inline-block',
            padding: '12px 26px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '14.5px',
            cursor: canSave ? 'pointer' : 'not-allowed',
            background: canSave ? 'var(--brand-grad)' : 'var(--line)',
            color: canSave ? '#fff' : 'var(--faint)',
          }}
        >
          {busy ? 'Đang lưu...' : 'Lưu & áp dụng ngay'}
        </span>
      </div>
    </div>
  );
}

export function AdminCancellationPolicyPage({ authed }: { authed: boolean }) {
  const isAdmin = authed && getUserRole() === 'admin';
  const [policy, setPolicy] = useState<CancellationPolicy | null | undefined>(undefined);

  useEffect(() => {
    if (!isAdmin) return;
    fetchActiveCancellationPolicy()
      .then(setPolicy)
      .catch(() => setPolicy(null));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="fade-up" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ color: 'var(--muted)', marginBottom: '18px' }}>
            {authed ? 'Chỉ quản trị viên mới có thể truy cập trang này.' : 'Đăng nhập bằng tài khoản quản trị để tiếp tục.'}
          </div>
          {!authed && (
            <span
              onClick={() => redirectToLogin()}
              className="btn-hover"
              style={{ display: 'inline-block', padding: '13px 26px', borderRadius: '12px', background: 'var(--brand-grad)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              Đăng nhập
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 32px' }}>
      <AdminTabs active="/admin/hoan-tien" />
      <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-.5px', margin: '0 0 4px' }}>Chính sách hủy & hoàn tiền</h1>
      <div style={{ color: 'var(--muted)', fontSize: '14.5px', marginBottom: '22px' }}>
        Cấu hình mốc thời gian được hủy và % hoàn phí đặt lịch — áp dụng ngay khi lưu, không cần deploy lại.
      </div>

      {policy === undefined ? (
        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Đang tải...</div>
      ) : (
        <>
          <ActivePolicySummary policy={policy} />
          <NewPolicyForm onActivated={setPolicy} />
        </>
      )}
    </main>
  );
}
