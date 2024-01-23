import { WrapperProps } from './';
import { useCallback, FocusEvent } from 'react';

export default ({ width, onBlur, children }: WrapperProps) => {
  const style = {
    width, paddingTop: '4px'
  };
  const handleBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget) || (event.relatedTarget === null)) {
      return;
    }
    onBlur();
  }, [onBlur]);

  return (
    <div tabIndex={0} onBlur={handleBlur} style={style} className="suggest-widget">
      {children}
    </div>
  );
};
