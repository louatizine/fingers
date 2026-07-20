import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { holidaysAPI } from '../services/api';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  MoonIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { fetchTunisiaPublicHolidays } from '../services/holidaysApi';

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const PRESET_KEYS = ['eid_fitr', 'eid_adha', 'islamic_new_year', 'mawlid', 'ashura', 'custom'];

const FALLBACK_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getWeekdayLabels = (t) => {
  const labels = t('weekdays.short', { returnObjects: true });
  return Array.isArray(labels) ? labels : FALLBACK_WEEKDAYS;
};

const formatDateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getTodayKey = () => {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
};

const dateToKey = (date) =>
  formatDateKey(date.getFullYear(), date.getMonth(), date.getDate());

const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getWeekStart = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const buildWeekDays = (weekStart) => {
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(weekStart, i);
    days.push({
      day: d.getDate(),
      key: dateToKey(d),
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  return days;
};

const expandDateRange = (startDate, endDate) => {
  const dates = [];
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const end = endDate || startDate;
  const [ey, em, ed] = end.split('-').map(Number);
  const current = new Date(sy, sm - 1, sd);
  const last = new Date(ey, em - 1, ed);

  while (current <= last) {
    dates.push(formatDateKey(current.getFullYear(), current.getMonth(), current.getDate()));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const countDays = (startDate, endDate) => expandDateRange(startDate, endDate || startDate).length;

const itemKey = (item) =>
  item.type === 'religious' ? `religious:${item.id}:${item.date}` : `public:${item.date}`;

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ day: null, key: `pad-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, key: formatDateKey(year, month, day) });
  }

  return cells;
}

function getDayStyle(dayInfo, isSelected, isToday) {
  if (!dayInfo) return 'text-slate-600';
  const { hasPublic, hasReligious } = dayInfo;
  if (isSelected) {
    if (hasPublic && hasReligious) return 'bg-gradient-to-br from-amber-500 to-violet-600 text-white shadow-md ring-2 ring-violet-300';
    if (hasReligious) return 'bg-violet-600 text-white shadow-md ring-2 ring-violet-300';
    return 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300';
  }
  if (hasPublic && hasReligious) return 'bg-gradient-to-br from-amber-50 to-violet-50 text-slate-800 hover:from-amber-100 hover:to-violet-100';
  if (hasReligious) return 'bg-violet-50 text-violet-900 hover:bg-violet-100';
  return 'bg-amber-50 text-amber-900 hover:bg-amber-100';
}

function MonthCalendar({ year, month, dayMap, selectedItem, onSelectDay, todayKey }) {
  const { t } = useTranslation('holidays');
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const weekdayLabels = getWeekdayLabels(t);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <h3 className="mb-3 text-center text-sm font-semibold text-slate-800">
        {t(`months.${MONTH_KEYS[month]}`)}
      </h3>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-medium uppercase tracking-wide text-slate-400"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (!cell.day) {
            return <div key={cell.key} className="aspect-square" />;
          }

          const dayInfo = dayMap[cell.key];
          const hasHoliday = Boolean(dayInfo?.items?.length);
          const isToday = cell.key === todayKey;
          const isSelected = selectedItem?.date === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => hasHoliday && onSelectDay(cell.key, dayInfo.items)}
              disabled={!hasHoliday}
              className={`
                relative flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-all
                ${hasHoliday ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                ${getDayStyle(dayInfo, isSelected, isToday)}
                ${isToday && !isSelected ? 'ring-2 ring-primary-400 ring-offset-1' : ''}
              `}
              title={dayInfo?.items?.map((i) => i.displayName).join(' · ')}
            >
              {cell.day}
              {hasHoliday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                  {dayInfo.hasPublic && <span className="h-1 w-1 rounded-full bg-amber-500" />}
                  {dayInfo.hasReligious && <span className="h-1 w-1 rounded-full bg-violet-500" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekCalendar({ weekStart, dayMap, selectedItem, onSelectDay, todayKey, locale, isRTL }) {
  const { t } = useTranslation('holidays');
  const days = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const weekdayLabels = getWeekdayLabels(t);

  const formatDayMonth = (dateKey) => {
    const date = parseDateKey(dateKey);
    return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((cell, index) => {
          const dayInfo = dayMap[cell.key];
          const hasHoliday = Boolean(dayInfo?.items?.length);
          const isToday = cell.key === todayKey;
          const isSelected = selectedItem?.date === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => hasHoliday && onSelectDay(cell.key, dayInfo.items)}
              disabled={!hasHoliday}
              className={`
                flex min-h-[140px] flex-col rounded-xl border p-3 transition-all
                ${isRTL ? 'text-right' : 'text-left'}
                ${hasHoliday ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default border-slate-100 bg-slate-50/50'}
                ${isSelected ? 'border-primary-300 shadow-md' : 'border-slate-200/80'}
                ${getDayStyle(dayInfo, isSelected, isToday)}
                ${isToday && !isSelected ? 'ring-2 ring-primary-400 ring-offset-1' : ''}
              `}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {weekdayLabels[index]}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {formatDayMonth(cell.key)}
                </span>
              </div>
              <span className="text-2xl font-bold leading-none">{cell.day}</span>
              {hasHoliday ? (
                <ul className="mt-3 space-y-1">
                  {dayInfo.items.map((item) => (
                    <li
                      key={itemKey(item)}
                      className={`truncate text-xs font-medium ${isSelected ? 'text-white/95' : ''}`}
                    >
                      {item.displayName}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="mt-auto pt-3 text-xs text-slate-400">{t('calendar.noHoliday')}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarPeriodFilter({
  calendarView,
  onViewChange,
  periodLabel,
  onPrev,
  onNext,
  isRTL,
  t,
}) {
  const views = [
    { id: 'month', label: t('calendar.month') },
    { id: 'week', label: t('calendar.week') },
  ];

  return (
    <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
      <div className={`flex rounded-xl border border-slate-200 bg-slate-100 p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onViewChange(view.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              calendarView === view.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <button
          type="button"
          onClick={onPrev}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          aria-label={t('calendar.previous')}
        >
          <ChevronLeftIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>

        <div className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center">
          <p className="text-sm font-bold text-slate-900">{periodLabel}</p>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
          aria-label={t('calendar.next')}
        >
          <ChevronRightIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function buildDayMap(publicHolidays, religiousHolidays, isRTL) {
  const map = {};

  const addItem = (date, item) => {
    if (!map[date]) {
      map[date] = { items: [], hasPublic: false, hasReligious: false };
    }
    map[date].items.push(item);
    if (item.type === 'public') map[date].hasPublic = true;
    if (item.type === 'religious') map[date].hasReligious = true;
  };

  publicHolidays.forEach((h) => {
    addItem(h.date, {
      type: 'public',
      date: h.date,
      displayName: isRTL ? h.localName : h.name,
      name: h.name,
      localName: h.localName,
    });
  });

  religiousHolidays.forEach((h) => {
    expandDateRange(h.start_date, h.end_date).forEach((date) => {
      addItem(date, {
        type: 'religious',
        id: h._id,
        date,
        displayName: isRTL && h.local_name ? h.local_name : h.name,
        name: h.name,
        local_name: h.local_name,
        preset_key: h.preset_key,
        notes: h.notes,
        start_date: h.start_date,
        end_date: h.end_date,
      });
    });
  });

  return map;
}

const emptyForm = () => ({
  preset_key: 'eid_fitr',
  name: '',
  local_name: '',
  start_date: '',
  end_date: '',
  notes: '',
});

function ReligiousHolidaysSection({
  year,
  canManage,
  religiousHolidays,
  loading,
  onReload,
  onSelectHoliday,
  isRTL,
  formatDisplayDate,
}) {
  const { t } = useTranslation('holidays');
  const toast = useToast();
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const applyPreset = (presetKey) => {
    if (presetKey === 'custom') return;
    setForm((prev) => ({
      ...prev,
      preset_key: presetKey,
      name: t(`religious.presets.${presetKey}.name`),
      local_name: t(`religious.presets.${presetKey}.localName`),
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    const initial = emptyForm();
    setForm({
      ...initial,
      name: t('religious.presets.eid_fitr.name'),
      local_name: t('religious.presets.eid_fitr.localName'),
    });
    setShowForm(true);
  };

  const openEdit = (holiday) => {
    setEditingId(holiday._id);
    setForm({
      preset_key: holiday.preset_key || 'custom',
      name: holiday.name,
      local_name: holiday.local_name || '',
      start_date: holiday.start_date,
      end_date: holiday.end_date || holiday.start_date,
      notes: holiday.notes || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.start_date) {
      toast.error(t('religious.failed'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        year,
        end_date: form.end_date || form.start_date,
      };
      if (editingId) {
        await holidaysAPI.updateReligiousHoliday(editingId, payload);
      } else {
        await holidaysAPI.createReligiousHoliday(payload);
      }
      toast.success(t('religious.saved'));
      closeForm();
      onReload();
    } catch (err) {
      toast.error(err.response?.data?.error || t('religious.failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (holiday) => {
    const ok = await confirm({
      title: t('religious.delete'),
      message: t('religious.confirmDelete'),
      type: 'danger',
    });
    if (!ok) return;

    try {
      await holidaysAPI.deleteReligiousHoliday(holiday._id);
      toast.success(t('religious.deleted'));
      onReload();
    } catch (err) {
      toast.error(err.response?.data?.error || t('religious.failed'));
    }
  };

  return (
    <section className="rounded-2xl border border-violet-200/80 bg-white p-5 shadow-sm md:p-6">
      <div className={`mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
            <MoonIcon className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t('religious.title')}</h2>
            <p className="text-sm text-slate-500">{t('religious.subtitle')}</p>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className={`inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <PlusIcon className="h-4 w-4" />
            {t('religious.add')}
          </button>
        )}
      </div>

      {!canManage && (
        <p className={`mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ${isRTL ? 'text-right' : ''}`}>
          {t('religious.readOnlyHint')}
        </p>
      )}

      {showForm && canManage && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 md:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{t('religious.fields.preset')}</span>
              <select
                value={form.preset_key}
                onChange={(e) => {
                  const key = e.target.value;
                  setForm((prev) => ({ ...prev, preset_key: key }));
                  applyPreset(key);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {PRESET_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(`religious.presets.${key}.label`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{t('religious.fields.name')}</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{t('religious.fields.localName')}</span>
              <input
                type="text"
                value={form.local_name}
                onChange={(e) => setForm((prev) => ({ ...prev, local_name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                dir="rtl"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{t('religious.fields.startDate')}</span>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{t('religious.fields.endDate')}</span>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">{t('religious.fields.notes')}</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className={`mt-4 flex gap-2 ${isRTL ? 'flex-row-reverse justify-start' : 'justify-end'}`}>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {t('religious.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? '…' : t('religious.save')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : religiousHolidays.length === 0 ? (
        <p className={`py-8 text-center text-sm text-slate-500 ${isRTL ? 'text-right' : ''}`}>
          {t('religious.empty', { year })}
        </p>
      ) : (
        <div className="space-y-2">
          {religiousHolidays.map((holiday) => {
            const days = countDays(holiday.start_date, holiday.end_date);
            return (
              <div
                key={holiday._id}
                className={`flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => onSelectHoliday(holiday)}
                  className={`flex-1 text-left ${isRTL ? 'text-right' : ''}`}
                >
                  <p className="font-semibold text-slate-900">
                    {isRTL && holiday.local_name ? holiday.local_name : holiday.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDisplayDate(holiday.start_date)}
                    {holiday.end_date && holiday.end_date !== holiday.start_date && (
                      <> — {formatDisplayDate(holiday.end_date)}</>
                    )}
                    <span className="mx-2 text-slate-300">·</span>
                    {t('religious.days', { count: days })}
                  </p>
                  {holiday.notes && (
                    <p className="mt-1 text-xs text-slate-400">{holiday.notes}</p>
                  )}
                </button>

                {canManage && (
                  <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                      type="button"
                      onClick={() => openEdit(holiday)}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                      title={t('religious.edit')}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(holiday)}
                      className="rounded-lg border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50"
                      title={t('religious.delete')}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function PublicHolidays() {
  const { t, i18n } = useTranslation('holidays');
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const canManage = user?.role === 'admin' || user?.role === 'supervisor';

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [calendarView, setCalendarView] = useState('month');
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [religiousHolidays, setReligiousHolidays] = useState([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [loadingReligious, setLoadingReligious] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const todayKey = getTodayKey();

  const loadPublicHolidays = useCallback(async () => {
    setLoadingPublic(true);
    setError(null);
    try {
      const data = await fetchTunisiaPublicHolidays(year);
      const enriched = (data || []).map((h) => ({
        ...h,
        localName: h.localName,
        displayName: isRTL ? h.localName : h.name,
      }));
      enriched.sort((a, b) => a.date.localeCompare(b.date));
      setPublicHolidays(enriched);
    } catch (err) {
      setError(err.message || t('error'));
      setPublicHolidays([]);
    } finally {
      setLoadingPublic(false);
    }
  }, [year, isRTL, t]);

  const loadReligiousHolidays = useCallback(async () => {
    setLoadingReligious(true);
    try {
      const response = await holidaysAPI.getReligiousHolidays(year);
      setReligiousHolidays(response.data.holidays || []);
    } catch {
      setReligiousHolidays([]);
    } finally {
      setLoadingReligious(false);
    }
  }, [year]);

  useEffect(() => {
    loadPublicHolidays();
    loadReligiousHolidays();
  }, [loadPublicHolidays, loadReligiousHolidays]);

  const dayMap = useMemo(
    () => buildDayMap(publicHolidays, religiousHolidays, isRTL),
    [publicHolidays, religiousHolidays, isRTL]
  );

  const allListItems = useMemo(() => {
    const items = [];
    publicHolidays.forEach((h) => {
      items.push({
        type: 'public',
        date: h.date,
        displayName: isRTL ? h.localName : h.name,
        sortKey: h.date,
      });
    });
    religiousHolidays.forEach((h) => {
      items.push({
        type: 'religious',
        id: h._id,
        date: h.start_date,
        displayName: isRTL && h.local_name ? h.local_name : h.name,
        sortKey: h.start_date,
        start_date: h.start_date,
        end_date: h.end_date,
      });
    });
    return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [publicHolidays, religiousHolidays, isRTL]);

  const upcomingItems = useMemo(
    () => allListItems.filter((h) => h.date >= todayKey),
    [allListItems, todayKey]
  );

  const pastItems = useMemo(
    () => allListItems.filter((h) => h.date < todayKey).reverse(),
    [allListItems, todayKey]
  );

  const formatDisplayDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handleSelectDay = (date, items) => {
    setSelectedItem(items[0] ? { ...items[0], date } : null);
  };

  const handleSelectHoliday = (holiday) => {
    setSelectedItem({
      type: 'religious',
      id: holiday._id,
      date: holiday.start_date,
      displayName: isRTL && holiday.local_name ? holiday.local_name : holiday.name,
      name: holiday.name,
      local_name: holiday.local_name,
      notes: holiday.notes,
      start_date: holiday.start_date,
      end_date: holiday.end_date,
    });
  };

  const navigatePeriod = (direction) => {
    setFocusDate((prev) => {
      const next = calendarView === 'month'
        ? new Date(prev.getFullYear(), prev.getMonth() + direction, 1)
        : addDays(getWeekStart(prev), direction * 7);
      setYear(next.getFullYear());
      return next;
    });
  };

  const handleGoToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setFocusDate(now);
  };

  const handleYearStep = (delta) => {
    setYear((prevYear) => {
      const nextYear = prevYear + delta;
      setFocusDate((prev) => {
        const daysInMonth = new Date(nextYear, prev.getMonth() + 1, 0).getDate();
        return new Date(nextYear, prev.getMonth(), Math.min(prev.getDate(), daysInMonth));
      });
      return nextYear;
    });
  };

  const periodLabel = useMemo(() => {
    if (calendarView === 'month') {
      return `${t(`months.${MONTH_KEYS[focusDate.getMonth()]}`)} ${focusDate.getFullYear()}`;
    }
    const weekStart = getWeekStart(focusDate);
    const weekEnd = addDays(weekStart, 6);
    const formatShort = (date) =>
      new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(date);
    if (weekStart.getFullYear() === weekEnd.getFullYear()) {
      return `${formatShort(weekStart)} – ${formatShort(weekEnd)}, ${weekStart.getFullYear()}`;
    }
    return `${formatShort(weekStart)}, ${weekStart.getFullYear()} – ${formatShort(weekEnd)}, ${weekEnd.getFullYear()}`;
  }, [calendarView, focusDate, i18n.language, t]);

  const loading = loadingPublic || loadingReligious;
  const dayItems = selectedItem?.date ? dayMap[selectedItem.date]?.items || [] : [];

  return (
    <div className="min-h-full bg-[#f3f2f1] p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-white/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
          <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                <FlagIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
                <p className="text-sm text-slate-500">{t('subtitle')}</p>
              </div>
            </div>

            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                type="button"
                onClick={() => handleYearStep(-1)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeftIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>

              <div className="min-w-[120px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('year')}</span>
                <p className="text-xl font-bold text-slate-900">{year}</p>
              </div>

              <button
                type="button"
                onClick={() => handleYearStep(1)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronRightIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleGoToToday}
                className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700"
              >
                {t('today')}
              </button>

              <button
                type="button"
                onClick={() => { loadPublicHolidays(); loadReligiousHolidays(); }}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {!loadingPublic && !error && (
            <div className={`mt-4 flex flex-wrap items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <p className="text-sm text-slate-500">
                {t('totalCount', { public: publicHolidays.length, religious: religiousHolidays.length })}
              </p>
              <div className={`flex gap-3 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  {t('legend.public')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                  {t('legend.religious')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-400 to-violet-500" />
                  {t('legend.both')}
                </span>
              </div>
            </div>
          )}
        </header>

        {loadingPublic && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <p className="text-sm text-slate-500">{t('loading')}</p>
            </div>
          </div>
        )}

        {error && !loadingPublic && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-rose-700">{error}</p>
            <button
              type="button"
              onClick={loadPublicHolidays}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {!loadingPublic && !error && (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <section className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 shadow-sm backdrop-blur-sm md:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-slate-800">{t('calendar.title')}</h2>
                </div>

                <CalendarPeriodFilter
                  calendarView={calendarView}
                  onViewChange={setCalendarView}
                  periodLabel={periodLabel}
                  onPrev={() => navigatePeriod(-1)}
                  onNext={() => navigatePeriod(1)}
                  isRTL={isRTL}
                  t={t}
                />

                {calendarView === 'month' ? (
                  <MonthCalendar
                    year={focusDate.getFullYear()}
                    month={focusDate.getMonth()}
                    dayMap={dayMap}
                    selectedItem={selectedItem}
                    onSelectDay={handleSelectDay}
                    todayKey={todayKey}
                  />
                ) : (
                  <WeekCalendar
                    weekStart={getWeekStart(focusDate)}
                    dayMap={dayMap}
                    selectedItem={selectedItem}
                    onSelectDay={handleSelectDay}
                    todayKey={todayKey}
                    locale={i18n.language}
                    isRTL={isRTL}
                  />
                )}
              </section>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  {selectedItem ? (
                    <div className={isRTL ? 'text-right' : ''}>
                      <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedItem.type === 'religious'
                          ? 'bg-violet-100 text-violet-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedItem.type === 'religious' ? t('types.religious') : t('types.Public')}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{selectedItem.displayName}</h3>
                      {selectedItem.type === 'public' && !isRTL && selectedItem.localName !== selectedItem.name && (
                        <p className="mt-1 text-sm text-slate-500" dir="rtl">{selectedItem.localName}</p>
                      )}
                      {selectedItem.type === 'religious' && selectedItem.local_name && !isRTL && (
                        <p className="mt-1 text-sm text-slate-500" dir="rtl">{selectedItem.local_name}</p>
                      )}
                      <p className="mt-3 text-sm font-medium text-primary-600">
                        {selectedItem.type === 'religious' && selectedItem.end_date && selectedItem.end_date !== selectedItem.start_date
                          ? `${formatDisplayDate(selectedItem.start_date)} — ${formatDisplayDate(selectedItem.end_date)}`
                          : formatDisplayDate(selectedItem.date)}
                      </p>
                      {selectedItem.notes && (
                        <p className="mt-2 text-sm text-slate-500">{selectedItem.notes}</p>
                      )}
                      {dayItems.length > 1 && (
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <p className="mb-2 text-xs font-medium uppercase text-slate-400">{t('allHolidays')}</p>
                          <ul className="space-y-1">
                            {dayItems.map((item) => (
                              <li key={itemKey(item)}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedItem({ ...item, date: selectedItem.date })}
                                  className={`w-full rounded-lg px-2 py-1 text-sm ${isRTL ? 'text-right' : 'text-left'} hover:bg-slate-50`}
                                >
                                  {item.displayName}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">{t('selectDay')}</p>
                  )}
                </div>

                {upcomingItems.length > 0 && (
                  <HolidayList
                    title={t('upcoming')}
                    items={upcomingItems}
                    selectedItem={selectedItem}
                    onSelect={setSelectedItem}
                    formatDisplayDate={formatDisplayDate}
                    isRTL={isRTL}
                    t={t}
                  />
                )}

                {pastItems.length > 0 && year <= currentYear && (
                  <HolidayList
                    title={t('past')}
                    items={pastItems}
                    selectedItem={selectedItem}
                    onSelect={setSelectedItem}
                    formatDisplayDate={formatDisplayDate}
                    isRTL={isRTL}
                    t={t}
                    muted
                  />
                )}

                <p className="text-center text-xs text-slate-400">{t('poweredBy')}</p>
              </aside>
            </div>

            <ReligiousHolidaysSection
              year={year}
              canManage={canManage}
              religiousHolidays={religiousHolidays}
              loading={loadingReligious}
              onReload={loadReligiousHolidays}
              onSelectHoliday={handleSelectHoliday}
              isRTL={isRTL}
              formatDisplayDate={formatDisplayDate}
            />
          </>
        )}
      </div>
    </div>
  );
}

function HolidayList({ title, items, selectedItem, onSelect, formatDisplayDate, isRTL, t, muted = false }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 ${isRTL ? 'text-right' : ''}`}>
        {title}
      </h3>
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = selectedItem?.date === item.date && selectedItem?.type === item.type
            && (item.type !== 'religious' || selectedItem?.id === item.id);
          return (
            <li key={`${item.type}-${item.id || item.date}`}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={`
                  w-full rounded-xl px-3 py-2 text-sm transition
                  ${isRTL ? 'text-right' : 'text-left'}
                  ${active
                    ? item.type === 'religious' ? 'bg-violet-100 font-medium text-violet-900' : 'bg-amber-100 font-medium text-amber-900'
                    : muted ? 'text-slate-500 hover:bg-slate-50' : 'text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.type === 'religious' ? 'bg-violet-500' : 'bg-amber-500'}`} />
                  <span className="block font-medium">{item.displayName}</span>
                </span>
                <span className="block pl-3.5 text-xs text-slate-400">
                  {item.type === 'religious' && item.end_date && item.end_date !== item.start_date
                    ? `${formatDisplayDate(item.start_date)} — ${formatDisplayDate(item.end_date)}`
                    : formatDisplayDate(item.date)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
