import Editor from '../Editor';
import { useParams } from 'react-router-dom';

const Edit = () => {
  const { uri } = useParams();

  return (
    <Editor uri={uri}/>
  );
};

export default Edit;
