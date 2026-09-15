'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ArrowLeft, Copy, Loader2, MoreHorizontal, Receipt, Shuffle, Trash2 } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Card, Field, FieldMessage, WARNING_COLOR, invalidStyle, secondary, subdued, text } from '../../_components/EditorFields';
import { apiErrorMessage, fmtAed } from '../../products/_components/productAdmin';
import { customerName, fmtDate, orderStatusBadge } from '../../users/_components/customerAdmin';
import { couponStatus, couponSummary, endOfDubaiDay, generateCode, isValidCode, toDubaiDateInput } from './couponAdmin';

const initialForm = (coupon) => ({
  code: coupon?.code || '',
  discount_type: coupon?.discount_type || 'percentage',
  discount_value: coupon ? String(Number(coupon.discount_value)) : '',
  hasMinimum: coupon?.minimum_purchase_amount != null,
  minimum: coupon?.minimum_purchase_amount != null ? String(Number(coupon.minimum_purchase_amount)) : '',
  hasLimit: coupon?.usage_limit != null,
  usage_limit: coupon?.usage_limit != null ? String(coupon.usage_limit) : '',
  hasEnd: Boolean(coupon?.expiration_date),
  end_date: toDubaiDateInput(coupon?.expiration_date),
  is_active: coupon?.is_active !== false,
});

const AffixInput = ({ id, prefix, suffix, error, ...props }) => (
  <div className="relative">
    {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none" style={subdued}>{prefix}</span>}
    <input
      id={id}
      className="sp-input"
      style={invalidStyle(error, { paddingLeft: prefix ? 48 : undefined, paddingRight: suffix ? 36 : undefined })}
      aria-invalid={!!error}
      {...props}
    />
    {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] pointer-events-none" style={subdued}>{suffix}</span>}
  </div>
);

const Option = ({ type = 'radio', name, checked, onChange, label, children }) => (
  <div>
    <label className="flex items-center gap-2.5 cursor-pointer w-fit">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 cursor-pointer"
        style={{ accentColor: 'var(--sp-primary)' }}
      />
      <span className="text-[13px]" style={text}>{label}</span>
    </label>
    {checked && children && <div className="mt-2 ml-[26px] max-w-[280px]">{children}</div>}
  </div>
);

export default function CouponEditor({ coupon, orders = [], onSaved }) {
  const router = useRouter();
  const { fetchWithAuth } = useAppContext();
  const isNew = !coupon;

  const [form, setForm] = useState(() => initialForm(coupon));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // What the editor looked like when it opened (or was last saved), to detect unsaved changes
  const baselineRef = useRef(null);
  if (baselineRef.current === null) baselineRef.current = JSON.stringify(form);
  const isDirty = JSON.stringify(form) !== baselineRef.current;

  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const setField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const found = {};
    if (!isValidCode(form.code.trim())) found.code = 'Use 3–32 letters, numbers, dashes or underscores.';
    const value = Number(form.discount_value);
    if (form.discount_value === '' || !Number.isFinite(value) || value <= 0) found.discount_value = 'Enter a value greater than 0.';
    else if (form.discount_type === 'percentage' && value > 100) found.discount_value = "A percentage can't be more than 100.";
    if (form.hasMinimum) {
      const minimum = Number(form.minimum);
      if (form.minimum === '' || !Number.isFinite(minimum) || minimum <= 0) found.minimum = 'Enter a minimum subtotal greater than 0.';
    }
    if (form.hasLimit) {
      const limit = Number(form.usage_limit);
      if (form.usage_limit === '' || !Number.isInteger(limit) || limit < 1) found.usage_limit = 'Enter a whole number of 1 or more.';
    }
    if (form.hasEnd && !form.end_date) found.end_date = 'Choose an end date.';
    return found;
  };

  const payload = () => ({
    code: form.code.trim(),
    discount_type: form.discount_type,
    discount_value: Number(form.discount_value),
    minimum_purchase_amount: form.hasMinimum ? Number(form.minimum) : null,
    usage_limit: form.hasLimit ? Number(form.usage_limit) : null,
    expiration_date: form.hasEnd && form.end_date ? endOfDubaiDay(form.end_date) : null,
    is_active: form.is_active,
  });

  const save = async () => {
    if (saving) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Please fix the highlighted fields.');
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify(payload());
      if (isNew) {
        const response = await fetchWithAuth('/api/coupons', { method: 'POST', body });
        const { couponId } = await response.json();
        baselineRef.current = JSON.stringify(form);
        toast.success('Discount created');
        router.replace(`/admin/coupons/${couponId}`);
      } else {
        await fetchWithAuth(`/api/coupons/${coupon.id}`, { method: 'PUT', body });
        baselineRef.current = JSON.stringify(form);
        toast.success('Discount saved');
        onSaved?.();
      }
    } catch (error) {
      const message = apiErrorMessage(error, 'The discount could not be saved. Please try again.');
      if (/code/i.test(message)) setErrors(prev => ({ ...prev, code: message }));
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Cmd/Ctrl+S saves, like the other editors
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const discard = () => {
    if (isDirty && !window.confirm('Discard all unsaved changes?')) return;
    if (isNew) {
      baselineRef.current = JSON.stringify(form);
      router.push('/admin/coupons');
      return;
    }
    setForm(initialForm(coupon));
    setErrors({});
  };

  const confirmLeave = (e) => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast.success(`Copied ${coupon.code}`);
    } catch {
      toast.error('The code could not be copied.');
    }
  };

  const handleDelete = async () => {
    const uses = coupon.order_count + coupon.cancelled_count;
    if (uses > 0) {
      toast.error(`${coupon.code} was used on ${uses} order${uses !== 1 ? 's' : ''}, so it can't be deleted. Set its status to Disabled instead.`);
      return;
    }
    if (!window.confirm(`Delete the discount code ${coupon.code}? This can't be undone.`)) return;
    try {
      await fetchWithAuth(`/api/coupons/${coupon.id}`, { method: 'DELETE' });
      baselineRef.current = JSON.stringify(form);
      toast.success('Discount deleted');
      router.push('/admin/coupons');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The discount could not be deleted.'));
    }
  };

  const headerStatus = coupon ? couponStatus(coupon) : null;
  const preview = payload();
  const summary = couponSummary(preview);
  const endPassed = form.hasEnd && form.end_date && new Date(endOfDubaiDay(form.end_date)) < new Date();
  const limitReached = !isNew && form.hasLimit && form.usage_limit !== '' && Number(form.usage_limit) <= coupon.usage_count;
  const isPercentage = form.discount_type === 'percentage';
  const showSaveBar = isNew || isDirty;

  return (
    <div className="max-w-[1080px] mx-auto space-y-4">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href="/admin/coupons"
          onClick={confirmLeave}
          aria-label="Back to discounts"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#e3e3e3] transition-colors"
          style={secondary}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[20px] font-semibold truncate min-w-0 max-w-full tracking-wide" style={text}>{isNew ? 'Create discount' : coupon.code}</h1>
        {headerStatus && <span className={`sp-badge ${headerStatus.cls}`}>{headerStatus.label}</span>}
        {!isNew && (
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={copyCode} className="sp-btn sp-btn-secondary"><Copy size={14} />Copy code</button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="sp-btn sp-btn-secondary px-2.5" aria-label="More actions"><MoreHorizontal size={16} /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-lg p-1 min-w-[180px]">
                <DropdownMenuItem onClick={handleDelete} className="rounded-md px-3 py-2 text-[13px] gap-2 text-red-600 focus:bg-red-50">
                  <Trash2 size={14} />Delete discount
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <form onSubmit={e => { e.preventDefault(); save(); }} noValidate>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">

          {/* ── Main column ── */}
          <div className="space-y-4 min-w-0">
            <Card title="Discount code">
              <Field label="Code" htmlFor="code" error={errors.code} hint="Customers type this at checkout. Capital letters don't matter.">
                <div className="flex gap-2">
                  <input
                    id="code"
                    type="text"
                    value={form.code}
                    onChange={e => setField('code', e.target.value.replace(/\s/g, ''))}
                    placeholder="e.g. SUMMER15"
                    maxLength={32}
                    className="sp-input font-semibold tracking-wide"
                    style={invalidStyle(errors.code)}
                    aria-invalid={!!errors.code}
                  />
                  <button type="button" onClick={() => setField('code', generateCode())} className="sp-btn sp-btn-secondary shrink-0">
                    <Shuffle size={14} />Generate
                  </button>
                </div>
              </Field>
            </Card>

            <Card title="Value">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="inline-flex p-0.5 rounded-lg self-start" style={{ background: '#f1f1f1' }} role="radiogroup" aria-label="Discount type">
                  {[['percentage', 'Percentage'], ['fixed_amount', 'Fixed amount']].map(([value, label]) => {
                    const selected = form.discount_type === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setField('discount_type', value)}
                        className="h-8 px-3 rounded-md text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                        style={selected
                          ? { background: '#ffffff', color: 'var(--sp-text)', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }
                          : { color: 'var(--sp-text-secondary)' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1 max-w-[240px]">
                  <AffixInput
                    id="discount_value"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max={isPercentage ? 100 : undefined}
                    step={isPercentage ? '1' : '0.01'}
                    value={form.discount_value}
                    onChange={e => setField('discount_value', e.target.value)}
                    placeholder={isPercentage ? '10' : '50.00'}
                    prefix={isPercentage ? undefined : 'AED'}
                    suffix={isPercentage ? '%' : undefined}
                    error={errors.discount_value}
                    aria-label="Discount value"
                  />
                  {errors.discount_value && <FieldMessage color="#b42318">{errors.discount_value}</FieldMessage>}
                </div>
              </div>
              <p className="text-[12px] mt-2" style={subdued}>Taken off the order subtotal, before VAT and delivery. One code can be used per order.</p>
            </Card>

            <Card title="Minimum purchase requirements">
              <div className="space-y-3">
                <Option name="minimum" checked={!form.hasMinimum} onChange={() => setField('hasMinimum', false)} label="No minimum requirements" />
                <Option name="minimum" checked={form.hasMinimum} onChange={() => setField('hasMinimum', true)} label="Minimum order subtotal">
                  <AffixInput
                    id="minimum"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.minimum}
                    onChange={e => setField('minimum', e.target.value)}
                    placeholder="200.00"
                    prefix="AED"
                    error={errors.minimum}
                    aria-label="Minimum order subtotal"
                  />
                  {errors.minimum && <FieldMessage color="#b42318">{errors.minimum}</FieldMessage>}
                </Option>
              </div>
            </Card>

            <Card title="Maximum uses">
              <Option type="checkbox" checked={form.hasLimit} onChange={e => setField('hasLimit', e.target.checked)} label="Limit how many times this code can be used in total">
                <AffixInput
                  id="usage_limit"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={form.usage_limit}
                  onChange={e => setField('usage_limit', e.target.value)}
                  placeholder="100"
                  error={errors.usage_limit}
                  aria-label="Maximum uses"
                />
                {errors.usage_limit && <FieldMessage color="#b42318">{errors.usage_limit}</FieldMessage>}
                {!errors.usage_limit && limitReached && (
                  <FieldMessage color={WARNING_COLOR}>It&apos;s already been used {coupon.usage_count} times, so it will stop working.</FieldMessage>
                )}
              </Option>
              {!isNew && <p className="text-[12px] mt-2" style={subdued}>Used {coupon.usage_count} time{coupon.usage_count !== 1 ? 's' : ''} so far.</p>}
            </Card>

            <Card title="End date">
              <Option type="checkbox" checked={form.hasEnd} onChange={e => setField('hasEnd', e.target.checked)} label="Set an end date">
                <input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={e => setField('end_date', e.target.value)}
                  className="sp-input cursor-pointer"
                  style={invalidStyle(errors.end_date)}
                  aria-invalid={!!errors.end_date}
                  aria-label="End date"
                />
                {errors.end_date
                  ? <FieldMessage color="#b42318">{errors.end_date}</FieldMessage>
                  : endPassed
                    ? <FieldMessage color={WARNING_COLOR}>This date has passed, so the code won&apos;t work at checkout.</FieldMessage>
                    : <p className="text-[12px] mt-1.5" style={subdued}>The code stops working at 11:59 pm UAE time on this day.</p>}
              </Option>
            </Card>

            {!isNew && (
              <Card title="Orders" description={orders.length ? `${orders.length === 50 ? 'The latest 50 orders' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`} that used this code` : undefined}>
                {orders.length === 0 ? (
                  <div className="py-8 px-4 flex flex-col items-center text-center rounded-lg" style={{ background: 'var(--sp-surface-sub)' }}>
                    <Receipt size={22} style={subdued} />
                    <p className="text-[13px] font-medium mt-2" style={text}>No orders have used this code yet</p>
                  </div>
                ) : (
                  <ul>
                    {orders.map((order, index) => {
                      const badge = orderStatusBadge(order.status);
                      const hasCustomer = order.customer_id != null;
                      return (
                        <li key={`${order.id}-${order.status}`} className="flex items-center gap-3 py-2.5" style={index ? { borderTop: '1px solid #f1f1f1' } : undefined}>
                          <div className="min-w-[96px]">
                            <Link href={`/admin/orders/${order.id}`} onClick={confirmLeave} className="text-[13px] font-semibold hover:underline" style={text}>#{order.id}</Link>
                            <p className="text-[12px]" style={subdued}>{fmtDate(order.created_at)}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            {hasCustomer ? (
                              <Link href={`/admin/users/${order.customer_id}`} onClick={confirmLeave} className="block text-[13px] truncate hover:underline" style={text}>
                                {customerName(order)}
                              </Link>
                            ) : <p className="text-[13px]" style={subdued}>Unknown customer</p>}
                            <p className="text-[12px] truncate" style={subdued}>Saved {fmtAed(order.discount_amount)}</p>
                          </div>
                          <span className={`sp-badge ${badge.cls}`}>{badge.label}</span>
                          <span className="text-[13px] font-semibold whitespace-nowrap w-[92px] text-right" style={text}>{fmtAed(order.total_amount)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            )}
          </div>

          {/* ── Side column ── */}
          <div className="space-y-4 lg:sticky lg:top-0">
            <Card title="Status">
              <select
                value={form.is_active ? 'active' : 'disabled'}
                onChange={e => setField('is_active', e.target.value === 'active')}
                className="sp-input cursor-pointer"
                aria-label="Status"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <p className="text-[12px] mt-2" style={subdued}>
                {form.is_active
                  ? 'Customers can use this code at checkout while it is within its limits and end date.'
                  : "Disabled codes are turned down at checkout. You can enable it again any time."}
              </p>
            </Card>

            <Card title="Summary">
              <p className="text-[15px] font-semibold tracking-wide truncate" style={text}>{form.code.trim() || 'No code yet'}</p>
              <ul className="mt-2 space-y-1.5">
                {summary.map(line => (
                  <li key={line} className="flex gap-2 text-[13px]" style={secondary}>
                    <span className="mt-[7px] w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--sp-text-subdued)' }} />
                    {line}
                  </li>
                ))}
              </ul>
            </Card>

            {!isNew && (
              <Card title="Performance">
                <dl className="space-y-2 text-[13px]">
                  <div className="flex justify-between gap-3"><dt style={secondary}>Times used</dt><dd className="font-medium" style={text}>{coupon.usage_count}</dd></div>
                  <div className="flex justify-between gap-3">
                    <dt style={secondary}>Orders</dt>
                    <dd className="font-medium text-right" style={text}>
                      {coupon.order_count}
                      {coupon.cancelled_count > 0 && <span className="block text-[12px] font-normal" style={subdued}>+{coupon.cancelled_count} cancelled</span>}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3"><dt style={secondary}>Discount given</dt><dd className="font-medium" style={text}>{fmtAed(coupon.discount_total)}</dd></div>
                  <div className="flex justify-between gap-3"><dt style={secondary}>Sales with this code</dt><dd className="font-medium" style={text}>{fmtAed(coupon.sales_total)}</dd></div>
                </dl>
                <p className="text-[12px] mt-3" style={subdued}>&ldquo;Times used&rdquo; is what the maximum-uses limit counts. Orders and totals exclude cancellations.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Save bar — always shown for a new discount, and for an existing one once something changes */}
        {showSaveBar && (
          <div className="sticky bottom-4 z-20 mt-4">
            <div className="sp-card flex items-center gap-3 px-4 py-3" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <p className="text-[13px] font-medium flex-1" style={text}>
                {isNew ? 'New discount' : 'Unsaved changes'}
                <span className="hidden sm:inline font-normal ml-2" style={subdued}>Press ⌘S / Ctrl+S to save</span>
              </p>
              <button type="button" onClick={discard} disabled={saving} className="sp-btn sp-btn-secondary">Discard</button>
              <button type="submit" disabled={saving} className="sp-btn sp-btn-primary min-w-[120px]">
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : isNew ? 'Save discount' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
