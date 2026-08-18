import { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api";

const AuthContext = createContext(null);

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const AUTH_REQUEST_TIMEOUT = 8000;

/*
|--------------------------------------------------------------------------
| REQUEST WITH TIMEOUT
|--------------------------------------------------------------------------
|
| Axios already has a timeout in our api.js, but we also protect the
| authentication restore process independently.
|
*/

function requestWithTimeout(request, timeout = AUTH_REQUEST_TIMEOUT) {
  let timer = null;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error("Authentication request timed out.");

      error.code = "AUTH_REQUEST_TIMEOUT";

      reject(error);
    }, timeout);
  });

  return Promise.race([
    request.finally(() => {
      if (timer) {
        clearTimeout(timer);
      }
    }),

    timeoutPromise,
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

/*
|--------------------------------------------------------------------------
| AUTH PROVIDER
|--------------------------------------------------------------------------
*/

export function AuthProvider({ children }) {
  /*
  |--------------------------------------------------------------------------
  | RESTORE SAVED USER IMMEDIATELY
  |--------------------------------------------------------------------------
  |
  | This is important.
  |
  | If the browser refreshes, the dashboard should not disappear while
  | the backend is being contacted.
  |
  */

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("gontobbo_user");

      if (!savedUser) {
        return null;
      }

      const parsedUser = JSON.parse(savedUser);

      return parsedUser;
    } catch (error) {
      console.error("Failed to restore saved user:", error);

      localStorage.removeItem("gontobbo_user");

      return null;
    }
  });

  /*
  |--------------------------------------------------------------------------
  | AUTH LOADING
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | We start with FALSE.
  |
  | The application must NOT block the dashboard while verifying a
  | previously saved session.
  |
  */

  const [loading, setLoading] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | AUTH VERIFYING
  |--------------------------------------------------------------------------
  |
  | This is separate from loading.
  |
  | `loading` means the application itself is waiting for authentication.
  |
  | `verifying` means we are quietly checking the saved token in the
  | background.
  |
  */

  const [verifying, setVerifying] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | RESTORE SESSION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      /*
        |--------------------------------------------------------------------------
        | GET TOKEN
        |--------------------------------------------------------------------------
        */

      const token = localStorage.getItem("gontobbo_token");

      /*
        |--------------------------------------------------------------------------
        | NO TOKEN
        |--------------------------------------------------------------------------
        */

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
          setVerifying(false);
        }

        return;
      }

      /*
        |--------------------------------------------------------------------------
        | BACKGROUND VERIFICATION
        |--------------------------------------------------------------------------
        */

      if (!cancelled) {
        setVerifying(true);
      }

      try {
        /*
          |--------------------------------------------------------------------------
          | REQUEST CURRENT USER
          |--------------------------------------------------------------------------
          */

        const response = await requestWithTimeout(api.get("/users/me"));

        if (cancelled) {
          return;
        }

        const userData = response.data?.user || null;

        /*
          |--------------------------------------------------------------------------
          | INVALID SERVER RESPONSE
          |--------------------------------------------------------------------------
          */

        if (!userData) {
          console.warn(
            "Server did not return a user during session verification.",
          );

          /*
           * Keep saved user.
           *
           * Do NOT destroy the local session just because the server
           * response is incomplete.
           */

          return;
        }

        /*
          |--------------------------------------------------------------------------
          | UPDATE USER
          |--------------------------------------------------------------------------
          */

        setUser(userData);

        localStorage.setItem("gontobbo_user", JSON.stringify(userData));
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to restore authentication:", error);

        const status = error.response?.status;

        /*
          |--------------------------------------------------------------------------
          | 401
          |--------------------------------------------------------------------------
          |
          | Token is invalid/expired.
          |
          | This is the ONLY normal situation where we destroy the saved
          | authentication session.
          |
          */

        if (status === 401) {
          localStorage.removeItem("gontobbo_token");

          localStorage.removeItem("gontobbo_user");

          setUser(null);

          return;
        }

        /*
          |--------------------------------------------------------------------------
          | 403
          |--------------------------------------------------------------------------
          |
          | Keep the user.
          |
          | The backend may reject the request because of permissions,
          | account state, driver status, etc.
          |
          */

        if (status === 403) {
          console.warn(
            "Session verification returned 403. Keeping saved user.",
          );

          return;
        }

        /*
          |--------------------------------------------------------------------------
          | TIMEOUT
          |--------------------------------------------------------------------------
          */

        if (error.code === "AUTH_REQUEST_TIMEOUT") {
          console.warn("Session verification timed out. Keeping saved user.");

          return;
        }

        /*
          |--------------------------------------------------------------------------
          | NETWORK / SERVER ERROR
          |--------------------------------------------------------------------------
          |
          | Do not log the user out just because the backend is temporarily
          | unavailable.
          |
          */

        console.warn("Session verification failed. Keeping saved user.");
      } finally {
        if (!cancelled) {
          setVerifying(false);

          /*
            |--------------------------------------------------------------------------
            | NEVER KEEP GLOBAL AUTH LOADING TRUE
            |--------------------------------------------------------------------------
            */

          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  */

  const login = (token, userData) => {
    if (!token) {
      throw new Error("Login token is missing.");
    }

    if (!userData) {
      throw new Error("Login user information is missing.");
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE TOKEN
    |--------------------------------------------------------------------------
    */

    localStorage.setItem("gontobbo_token", token);

    /*
    |--------------------------------------------------------------------------
    | SAVE USER
    |--------------------------------------------------------------------------
    */

    localStorage.setItem("gontobbo_user", JSON.stringify(userData));

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATE IMMEDIATELY
    |--------------------------------------------------------------------------
    */

    setUser(userData);

    setLoading(false);
  };

  /*
  |--------------------------------------------------------------------------
  | REGISTER
  |--------------------------------------------------------------------------
  */

  const register = async (registrationData) => {
    try {
      /*
        |--------------------------------------------------------------------------
        | REGISTER REQUEST
        |--------------------------------------------------------------------------
        */

      const response = await requestWithTimeout(
        api.post("/auth/register", registrationData),
      );

      const data = response.data;

      const token = data?.token;

      const userData = data?.user;

      /*
        |--------------------------------------------------------------------------
        | VALIDATE RESPONSE
        |--------------------------------------------------------------------------
        */

      if (!token || !userData) {
        throw new Error(
          "Registration succeeded but authentication data was not returned.",
        );
      }

      /*
        |--------------------------------------------------------------------------
        | SAVE TOKEN
        |--------------------------------------------------------------------------
        */

      localStorage.setItem("gontobbo_token", token);

      /*
        |--------------------------------------------------------------------------
        | SAVE USER
        |--------------------------------------------------------------------------
        */

      localStorage.setItem("gontobbo_user", JSON.stringify(userData));

      /*
        |--------------------------------------------------------------------------
        | UPDATE STATE
        |--------------------------------------------------------------------------
        */

      setUser(userData);

      setLoading(false);

      return {
        token,
        user: userData,
      };
    } catch (error) {
      console.error("Registration error:", error);

      const message =
        error.response?.data?.message ||
        error.message ||
        "Registration failed.";

      throw new Error(message);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    /*
    |--------------------------------------------------------------------------
    | STOP AUTH SESSION
    |--------------------------------------------------------------------------
    */

    localStorage.removeItem("gontobbo_token");

    localStorage.removeItem("gontobbo_user");

    /*
    |--------------------------------------------------------------------------
    | RESET STATE
    |--------------------------------------------------------------------------
    */

    setUser(null);

    setLoading(false);

    setVerifying(false);
  };

  /*
  |--------------------------------------------------------------------------
  | AUTH STATE
  |--------------------------------------------------------------------------
  */

  const isAuthenticated = Boolean(user);

  /*
  |--------------------------------------------------------------------------
  | ROLE HELPERS
  |--------------------------------------------------------------------------
  */

  const isPassenger = user?.role === "passenger";

  const isDriver = user?.role === "driver";

  const isAdmin = user?.role === "admin";

  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

  const value = {
    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */

    user,

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    loading,

    /*
    |--------------------------------------------------------------------------
    | BACKGROUND VERIFICATION
    |--------------------------------------------------------------------------
    */

    verifying,

    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATED
    |--------------------------------------------------------------------------
    */

    isAuthenticated,

    /*
    |--------------------------------------------------------------------------
    | ROLES
    |--------------------------------------------------------------------------
    */

    isPassenger,

    isDriver,

    isAdmin,

    /*
    |--------------------------------------------------------------------------
    | ACTIONS
    |--------------------------------------------------------------------------
    */

    login,

    register,

    logout,
  };

  /*
  |--------------------------------------------------------------------------
  | PROVIDER
  |--------------------------------------------------------------------------
  */

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/*
|--------------------------------------------------------------------------
| useAuth
|--------------------------------------------------------------------------
*/

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
