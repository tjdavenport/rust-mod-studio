import Tabs from './Tabs';
import { useCallback, MouseEvent } from 'react';
import { GoCode, GoArrowLeft } from 'react-icons/go';
import { useNavigate, useLocation } from 'react-router-dom';

const BackLink = () => {
  const navigate = useNavigate();
  const handleOnClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/');
  }, []);

  return (
    <a href="#" className="h4" onClick={handleOnClick}>
      <GoArrowLeft style={{ verticalAlign: "top" }} className="light-grey" />
    </a>
  );
};

const ActiveLink = () => {
  const handleOnClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  }, []);

  return (
    <a href="#" className="h4" onClick={handleOnClick}>
      <GoCode style={{ verticalAlign: "top" }} className="light-grey" />
    </a>
  );
};

const Nav = () => {
  const location = useLocation();

  const link = location.pathname.includes('/edit/') ? (
    <BackLink/>
  ) : (
    <ActiveLink/>
  );

  return (
    <div className="bg-dark-grey bb-light-grey" style={{ padding: '0px 12px', height: '48px', display: 'flex', alignItems: 'center' }}>
      {link}
      <Tabs/>
    </div>
  );
};

export default Nav;
