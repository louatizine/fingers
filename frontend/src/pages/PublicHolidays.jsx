import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { fetchTunisiaPublicHolidays } from '../services/holidaysApi';

const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const formatDateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getTodayKey = () => {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
};

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

function MonthCalendar({ year, month, holidayMap, selectedDate, onSelectDay, todayKey }) {
  const { t } = useTranslation('holidays');
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const weekdayLabels = t('weekdays.short', { returnObjects: true });

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

          const holiday = holidayMap[cell.key];
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedDate;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => holiday && onSelectDay(cell.key)}
              disabled={!holiday}
              className={`
                relative flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-all
                ${holiday ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                ${isSelected
                  ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300'
                  : holiday
                    ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'text-slate-600'
                }
                ${isToday && !isSelected ? 'ring-2 ring-primary-400 ring-offset-1' : ''}
              `}
              title={holiday ? (holiday.displayName) : undefined}
            >
              {cell.day}
              {holiday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PublicHolidays() {
  const { t, i18n } = useTranslation('holidays');
  const isRTL = i18n.language === 'ar';

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const todayKey = getTodayKey();

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTunisiaPublicHolidays(year);
      const enriched = (data || []).map((h) => ({
        ...h,
        displayName: isRTL ? h.localName : h.name,
      }));
      enriched.sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(enriched);

      const upcoming = enriched.find((h) => h.date >= todayKey);
      setSelectedDate(upcoming?.date || enriched[0]?.date || null);
    } catch (err) {
      setError(err.message || t('error'));
      setHolidays([]);
      setSelectedDate(null);
    } finally {
      setLoading(false);
    }
  }, [year, isRTL, todayKey, t]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const holidayMap = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      map[h.date] = h;
    });
    return map;
  }, [holidays]);

  const selectedHoliday = selectedDate ? holidayMap[selectedDate] : null;

  const upcomingHolidays = useMemo(
    () => holidays.filter((h) => h.date >= todayKey),
    [holidays, todayKey]
  );

  const pastHolidays = useMemo(
    () => holidays.filter((h) => h.date < todayKey).reverse(),
    [holidays, todayKey]
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

  return (
    <div className="min-h-full bg-[#f3f2f1] p-4 md:p-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
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
                onClick={() => setYear((y) => y - 1)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:shadow-sm"
                aria-label="Previous year"
              >
                <ChevronLeftIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>

              <div className="min-w-[120px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('year')}</span>
                <p className="text-xl font-bold text-slate-900">{year}</p>
              </div>

              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 hover:shadow-sm"
                aria-label="Next year"
              >
                <ChevronRightIcon className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setYear(currentYear)}
                className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
              >
                {t('today')}
              </button>

              <button
                type="button"
                onClick={loadHolidays}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                aria-label={t('retry')}
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {!loading && !error && (
            <p className={`mt-4 text-sm text-slate-500 ${isRTL ? 'text-right' : ''}`}>
              {t('holidayCount', { count: holidays.length })}
            </p>
          )}
        </header>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <p className="text-sm text-slate-500">{t('loading')}</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-rose-700">{error}</p>
            <button
              type="button"
              onClick={loadHolidays}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Year calendar grid */}
            <section className="rounded-2xl border border-slate-200/80 bg-white/50 p-4 shadow-sm backdrop-blur-sm md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-slate-800">{year}</h2>
              </div>

              {holidays.length === 0 ? (
                <p className="py-12 text-center text-slate-500">{t('noHolidays')}</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {MONTH_KEYS.map((_, monthIndex) => (
                    <MonthCalendar
                      key={monthIndex}
                      year={year}
                      month={monthIndex}
                      holidayMap={holidayMap}
                      selectedDate={selectedDate}
                      onSelectDay={setSelectedDate}
                      todayKey={todayKey}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Sidebar: details + list */}
            <aside className="space-y-4">
              {/* Selected holiday detail */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                {selectedHoliday ? (
                  <div className={isRTL ? 'text-right' : ''}>
                    <div className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      {t('types.Public')}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedHoliday.displayName}
                    </h3>
                    {!isRTL && selectedHoliday.localName !== selectedHoliday.name && (
                      <p className="mt-1 text-sm text-slate-500" dir="rtl">
                        {selectedHoliday.localName}
                      </p>
                    )}
                    {isRTL && (
                      <p className="mt-1 text-sm text-slate-500" dir="ltr">
                        {selectedHoliday.name}
                      </p>
                    )}
                    <p className="mt-3 text-sm font-medium text-primary-600">
                      {formatDisplayDate(selectedHoliday.date)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{t('selectDay')}</p>
                )}
              </div>

              {/* Upcoming list */}
              {upcomingHolidays.length > 0 && (
                <HolidayList
                  title={t('upcoming')}
                  holidays={upcomingHolidays}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  formatDisplayDate={formatDisplayDate}
                  isRTL={isRTL}
                />
              )}

              {/* Past list (when viewing current/past year) */}
              {pastHolidays.length > 0 && year <= currentYear && (
                <HolidayList
                  title={t('past')}
                  holidays={pastHolidays}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  formatDisplayDate={formatDisplayDate}
                  isRTL={isRTL}
                  muted
                />
              )}

              <p className="text-center text-xs text-slate-400">{t('poweredBy')}</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function HolidayList({ title, holidays, selectedDate, onSelect, formatDisplayDate, isRTL, muted = false }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 ${isRTL ? 'text-right' : ''}`}>
        {title}
      </h3>
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {holidays.map((holiday) => {
          const isActive = holiday.date === selectedDate;
          return (
            <li key={holiday.date}>
              <button
                type="button"
                onClick={() => onSelect(holiday.date)}
                className={`
                  w-full rounded-xl px-3 py-2 text-sm transition
                  ${isRTL ? 'text-right' : 'text-left'}
                  ${isActive
                    ? 'bg-amber-100 font-medium text-amber-900'
                    : muted
                      ? 'text-slate-500 hover:bg-slate-50'
                      : 'text-slate-700 hover:bg-slate-50'
                  }
                `}
              >
                <span className="block font-medium">{holiday.displayName}</span>
                <span className="block text-xs text-slate-400">
                  {formatDisplayDate(holiday.date)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
