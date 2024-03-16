import styled from 'styled-components';

export const Pane = styled.div<{ maxWidth?: string }>`
  box-shadow: 0px 0px 4px 0px #000000;
  padding: 16px;
  border-radius: 4px;
  min-width: 280px;
  max-width: ${({ maxWidth = '50%'}) => maxWidth};
  overflow-y: scroll;
`;
