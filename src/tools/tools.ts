export const getDayInSwedish = (date: string) => {
  const days = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
  const dayIndex = new Date(date).getDay();
  return days[dayIndex];
};

export const eventCreationSteps = [
  {
    title: 'Typ',
    description: 'Anmälnings typ',
  },
  {
    title: 'Titel',
    description: '',
  },
  {
    title: 'Beskrivning',
    description: '',
  },
  {
    title: 'Datum & Tid',
    description: '',
  },
];