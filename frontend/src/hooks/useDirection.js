/**
 * Custom hook for RTL/LTR direction management
 * Returns direction info and helper functions
 */
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const useDirection = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = currentLanguage;
  }, [direction, currentLanguage]);

  return {
    isRTL,
    direction,
    language: currentLanguage,
  };
};

/**
 * Helper function to get RTL-aware class
 * Usage: rtlClass('mr-4', 'ml-4') -> returns 'ml-4' if RTL, 'mr-4' if LTR
 */
export const rtlClass = (ltrClass, rtlClass, isRTL) => {
  return isRTL ? rtlClass : ltrClass;
};

/**
 * Helper to conditionally apply classes based on direction
 * Usage: dirClass({ ltr: 'ml-4', rtl: 'mr-4' }, isRTL)
 */
export const dirClass = (classes, isRTL) => {
  return isRTL ? classes.rtl : classes.ltr;
};

/**
 * Helper for margin start (left in LTR, right in RTL)
 * Usage: ms(4) -> 'ml-4' in LTR, 'mr-4' in RTL
 */
export const ms = (size, isRTL) => isRTL ? `mr-${size}` : `ml-${size}`;
export const me = (size, isRTL) => isRTL ? `ml-${size}` : `mr-${size}`;
export const ps = (size, isRTL) => isRTL ? `pr-${size}` : `pl-${size}`;
export const pe = (size, isRTL) => isRTL ? `pl-${size}` : `pr-${size}`;

/**
 * Get flex direction for RTL
 */
export const flexDir = (isRTL) => isRTL ? 'flex-row-reverse' : '';

/**
 * Get text alignment for RTL
 */
export const textAlign = (isRTL) => isRTL ? 'text-right' : 'text-left';

/**
 * Get position for RTL (left/right)
 */
export const position = (side, isRTL) => {
  if (side === 'left') return isRTL ? 'right' : 'left';
  if (side === 'right') return isRTL ? 'left' : 'right';
  return side;
};
