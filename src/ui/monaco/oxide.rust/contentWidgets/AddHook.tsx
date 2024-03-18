import snippets from './snippets.json';
import styled from 'styled-components';
import { ThemeContext } from './reactContentWidget';
import { Wrapper, WrapperProps } from './reactContentWidget';
import {
  useContext,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  WheelEvent,
  ChangeEvent,
  CSSProperties,
  createContext,
} from 'react';

export const ID = 'oxide.rust.add-hook';

const snippetCategories = snippets.reduce((categories, snippet) => {
  if (categories.includes(snippet.category)) {
    return categories;
  } else {
    categories.push(snippet.category);
    return categories;
  }
}, []).sort();

const Input = ({ setFilterString }: { setFilterString: (newValue: string) => void }) => {
  const theme = useContext(ThemeContext);
  const ref = useRef<HTMLInputElement>();
  const style = {
    backgroundColor: theme.backgroundColor,
    border: theme.widgetBorder,
    outline: 'none',
    flexGrow: 1,
    color: '#fff'
  };
  const handleOnChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilterString(event.currentTarget.value);
  }, [setFilterString]);

  useEffect(() => {
    ref.current.focus();
  }, []);

  return (
    <input style={style} type="text" ref={ref} onChange={handleOnChange}/>
  );
};

type SelectProps = {
  setFilterCategory: (filterCategory: string) => void;
};
const Select = ({ setFilterCategory }: SelectProps) => {
  const theme = useContext(ThemeContext);
  const style = {
    backgroundColor: theme.selectedBackgroundColor,
    border: theme.widgetBorder,
    outline: 'none',
    color: '#fff',
  };
  const handleChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setFilterCategory(event.currentTarget.value);
  }, [setFilterCategory]);

  return (
    <select style={style} onChange={handleChange}>
      <option value="">category</option>
      {snippetCategories.map((category) => {
        return (
          <option key={`category-${category}`} value={category}>{category}</option>
        );
      })};
    </select>
  );
};

type ListItemProps = {
  label: string;
  doc: string;
  insertText: string;
};
const ListItemContainer = styled.div`
  cursor: pointer;
  padding: 4px 4px 8px 4px;

  &:hover {
    background-color: ${({theme}) => theme.selectedBackgroundColor};
  }
`;
const ListItem = ({ label, doc, insertText }: ListItemProps) => {
  const { onSelect } = useContext(AddHookWidgetContext);
  const theme = useContext(ThemeContext);
  const labelStyle = {
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
    color: theme.keywordForeground,
    padding: '4px 0px'
  };
  const docStyle = {
    fontSize: theme.fontSize,
  };

  return (
    <ListItemContainer theme={theme} onClick={() => onSelect(insertText)}>
      <p style={labelStyle}>{label}()</p>
      <p style={docStyle}>{doc}</p>
    </ListItemContainer>
  );
};

type ScrollableListProps = {
  filterString: string;
  filterCategory: string;
}
const ScrollableList = ({ filterString, filterCategory }: ScrollableListProps) => {
  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    // because Monaco editor will intercept the scroll
    event.stopPropagation();
  }, []);
  const style: CSSProperties = {
    height: '150px', overflowY: 'scroll'
  };
  const filteredSnippets = useMemo(() => {
    return snippets.filter(snippet => {
      return snippet.label.toLowerCase().includes(filterString.toLowerCase()) &&
        ((snippet.category === filterCategory) || (!filterCategory))
    });
  }, [filterString, filterCategory])


  return (
    <div onWheel={handleWheel} style={style}>
      {filteredSnippets.map((snippet, i) => {
        return (
          <ListItem
            label={snippet.label}
            insertText={snippet.insertText}
            doc={snippet.documentation}
            key={"list-item-" + i} 
          />
        );
      })}
    </div>
  );
};

const AddHookWidgetContext = createContext({
  onSelect: (insertText: string) => {}
});

type AddHookWidgetProps = Omit<WrapperProps, 'children'> & {
  onSelect: (insertText: string) => void;
};
export default ({ width, onBlur, onSelect }: AddHookWidgetProps) => {
  const [filterString, setFilterString] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  return (
    <AddHookWidgetContext.Provider value={{ onSelect }}>
      <Wrapper width={width} onBlur={onBlur}>
        <div style={{display: 'flex', marginBottom: '4px', padding: '0px 4px'}}>
          <Input setFilterString={setFilterString} />
          <Select setFilterCategory={setFilterCategory}/>
        </div>
        <ScrollableList filterString={filterString} filterCategory={filterCategory}/>
      </Wrapper>
    </AddHookWidgetContext.Provider>
  );
};
