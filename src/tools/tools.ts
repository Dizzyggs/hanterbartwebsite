export const getDayInEnglish = (date: string) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = new Date(date).getDay();
  return days[dayIndex];
};

export const eventCreationSteps = [
  {
    title: 'Title',
    description: '',
  },
  {
    title: 'Description',
    description: '',
  },
  {
    title: 'Date & Time',
    description: '',
  },
];