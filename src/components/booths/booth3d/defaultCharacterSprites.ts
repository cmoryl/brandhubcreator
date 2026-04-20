import visitorMaleA from '@/assets/booth-sprites/visitor-male-a.png';
import visitorFemaleA from '@/assets/booth-sprites/visitor-female-a.png';
import staffMaleA from '@/assets/booth-sprites/staff-male-a.png';
import staffFemaleA from '@/assets/booth-sprites/staff-female-a.png';

export const DEFAULT_CHARACTER_SPRITES: Record<string, string> = {
  'visitor-m1': visitorMaleA,
  'visitor-m2': visitorMaleA,
  'visitor-m3': visitorMaleA,
  'visitor-m4': visitorMaleA,
  'phone-m1': visitorMaleA,
  'visitor-f1': visitorFemaleA,
  'visitor-f2': visitorFemaleA,
  'visitor-f3': visitorFemaleA,
  'photo-f1': visitorFemaleA,
  'staff-m1': staffMaleA,
  'staff-f1': staffFemaleA,
};

export const isDefaultCharacterSprite = (characterId: string, url?: string) => {
  return !!url && DEFAULT_CHARACTER_SPRITES[characterId] === url;
};