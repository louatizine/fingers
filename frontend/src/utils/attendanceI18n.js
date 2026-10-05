export const getAttendanceLocale = (language) => {
  if (language === 'ar') return 'ar-TN';
  if (language === 'fr') return 'fr-FR';
  return 'en-US';
};

export const translateWeekday = ({ dateStr, dayCode, locale, t }) => {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(locale, { weekday: 'long' });
  }

  if (dayCode) {
    const attendanceKey = `attendance:weekdays.${dayCode}`;
    const attendanceLabel = t(attendanceKey);
    if (attendanceLabel !== attendanceKey) return attendanceLabel;

    const settingsKey = `common:settings.attendance.days.${dayCode}`;
    const settingsLabel = t(settingsKey);
    if (settingsLabel !== settingsKey) return settingsLabel;
  }

  return dayCode || t('common:common.notAvailable');
};

export const formatLocalizedLongDate = (dateStr, locale) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatLocalizedShortDate = (dateStr, locale) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

export const emptyAttendanceValue = (t) => t('attendance:formats.emptyTime');
