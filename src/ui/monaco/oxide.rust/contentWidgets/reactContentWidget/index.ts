import { ReactNode } from 'react';
import { ReactContentWidget } from './create';

export const cache = new Map<string, ReactContentWidget>(); 

export type WrapperProps = {
  children: ReactNode;
  width: string;
  onBlur: () => void;
};

export { default as Wrapper } from './Wrapper';
export { default as create } from './create';
export { ThemeContext } from './theme'
