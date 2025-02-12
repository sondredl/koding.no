import React, { useEffect, useReducer } from "react";
import { authContext } from "../auth";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastList } from "../components/ToastList/ToastList";
import { toast } from "../lib/toast";

export const queryClient = new QueryClient();

const reducer = (
  state: {
    isLoggedIn: boolean;
    netlifyIdentity: any;
    lastCallWasInitial: boolean;
  },
  action: {
    type: "login" | "logout" | "setNetlifyIdentity";
    payload: {
      netlifyIdentity: any;
    };
  }
) => {
  switch (action.type) {
    case "login":
      return {
        ...state,
        isLoggedIn: true,
        netlifyIdentity: action.payload.netlifyIdentity,
        lastCallWasInitial: state.netlifyIdentity === null,
      };
    case "logout":
      return {
        ...state,
        isLoggedIn: false,
        netlifyIdentity: action.payload.netlifyIdentity,
        lastCallWasInitial: state.netlifyIdentity === null,
      };
    case "setNetlifyIdentity":
      return {
        ...state,
        netlifyIdentity: action.payload.netlifyIdentity,
        lastCallWasInitial: state.netlifyIdentity === null,
      };
    default:
      return state;
  }
};

// Default implementation, that you can customize
export default function Root({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    isLoggedIn: false,
    netlifyIdentity: null,
    lastCallWasInitial: true,
  });

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      document.location.hostname === "beta.koding.no"
    ) {
      // Redirect til nyeste staging-deployment
      window.location.replace(
        "https://staging--koding-no.netlify.app/"
      );
    }
    import("netlify-identity-widget").then(
      (importedNetlifyIdentity) => {
        importedNetlifyIdentity.on("login", () => {
          dispatch({
            type: "login",
            payload: {
              netlifyIdentity: { ...importedNetlifyIdentity },
            },
          });
          importedNetlifyIdentity.close(); // close the modal
          importedNetlifyIdentity.refresh().catch((err) => {
            // Logout and prompt login if token refresh fails
            dispatch({
              type: "logout",
              payload: {
                netlifyIdentity: { ...importedNetlifyIdentity },
              },
            });
            importedNetlifyIdentity.open("login");
          });
        });

        importedNetlifyIdentity.on("logout", () => {
          dispatch({
            type: "logout",
            payload: {
              netlifyIdentity: { ...importedNetlifyIdentity },
            },
          });
          toast({
            title: "Du er nå logget ut",
            kind: "info",
          });
        });

        importedNetlifyIdentity.init({
          locale: "no",
        });

        if (!importedNetlifyIdentity?.currentUser?.()) {
          dispatch({
            type: "setNetlifyIdentity",
            payload: {
              netlifyIdentity: { ...importedNetlifyIdentity },
            },
          });
        }
      }
    );
  }, []);

  useEffect(() => {
    if (state.isLoggedIn && !state.lastCallWasInitial) {
      // NetlifyIdentity already existed, meaning this is not initial login
      toast({
        title: "Logget inn",
        kind: "success",
      });
    }
  }, [state.isLoggedIn]);

  return (
    <QueryClientProvider client={queryClient}>
      <authContext.Provider
        value={
          state.netlifyIdentity
            ? {
                ...state.netlifyIdentity,
                isLoggedIn: state.isLoggedIn,
              }
            : null
        }
      >
        {children}
        <ToastList />
      </authContext.Provider>
    </QueryClientProvider>
  );
}
