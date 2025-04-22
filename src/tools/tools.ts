import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

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

export const getDefaultSettings = async() => {
  const settingsDoc = await getDoc(doc(db, 'settings', 'raid'));
  const settings = settingsDoc.data();
  return settings;
}