import { holidaysAPI } from './api';
import { fetchTunisiaPublicHolidays } from './holidaysApi';

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addHoliday = (map, date, holiday) => {
  if (!map[date]) map[date] = [];
  map[date].push(holiday);
};

export async function fetchHolidayMap(year, isRTL = false) {
  const [publicResponse, religiousResponse] = await Promise.all([
    fetchTunisiaPublicHolidays(year),
    holidaysAPI.getReligiousHolidays(year),
  ]);
  const map = {};

  (publicResponse || []).forEach((holiday) => {
    addHoliday(map, holiday.date, {
      type: 'public',
      name: isRTL ? holiday.localName || holiday.name : holiday.name,
    });
  });

  (religiousResponse.data.holidays || []).forEach((holiday) => {
    const start = new Date(`${holiday.start_date}T00:00:00`);
    const end = new Date(`${holiday.end_date || holiday.start_date}T00:00:00`);

    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      addHoliday(map, formatDateKey(date), {
        type: 'religious',
        name: isRTL && holiday.local_name ? holiday.local_name : holiday.name,
      });
    }
  });

  return map;
}
