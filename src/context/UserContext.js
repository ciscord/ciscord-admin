import { useState, createContext, useContext, useEffect } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import Router from 'next/router';
import { COMPANY_NAME } from 'src/utils/config';
import { LOGOUT_USER, GET_ME } from 'src/apis/User';
import { AppContext } from './AppContext';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [logoutUser] = useMutation(LOGOUT_USER);
  const [fetchMe, { data: { me, loading } = {} }] = useLazyQuery(GET_ME, {
    fetchPolicy: 'network-only',
    onCompleted: () => {
      sessionStorage.setItem('tenant', COMPANY_NAME());
      setUser(me);
      Router.push(`/[company]/[community]/[channel]`, `/${COMPANY_NAME()}/general/general`, {
        shallow: true,
      });
    },
  });

  const { userLoaded, setUserLoaded } = useContext(AppContext);

  const [fetchOnly, { data: { me: me1 } = {} }] = useLazyQuery(GET_ME, {
    fetchPolicy: 'network-only',
    onCompleted: () => {
      sessionStorage.setItem('tenant', COMPANY_NAME());
      setUser(me1);
      if (!userLoaded) {
        setUserLoaded(true);
      }
    },
  });

  const logout = async () => {
    try {
      await logoutUser({});
    } catch (error) {
      alert(error);
    }

    sessionStorage.removeItem('token');
    setUser(null);
    if (window) {
      window.sessionStorage.setItem('logout', Date.now());
      sessionStorage.removeItem('user');
    }
  };

  const signin = token => {
    sessionStorage.setItem('token', token);
    fetchMe();
  };

  const getMe = () => {
    fetchOnly();
  };

  useEffect(() => {
    if (!user) {
      getMe();
    }
  }, []);

  useEffect(() => {
    if (user === null) {
      const localState = JSON.parse(sessionStorage.getItem('user'));
      if (localState) {
        setUser(localState);
      }
    } else if (sessionStorage.getItem('tenant') !== COMPANY_NAME()) {
      logout();
    } else {
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        isLogged: !!user,
        user,
        setUser,
        getMe,
        signin,
        logout,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserProvider as default, UserContext };
