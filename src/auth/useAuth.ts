import { useContext, useEffect, useRef, useState } from "react";
import { NetlifyIndentify, authContext } from ".";

type Return =
  | (NetlifyIndentify & {
      isLoggedIn: boolean;
      initialized: true;
    })
  | {
      isLoggedIn: boolean;
      currentUser: () => null;
      initialized: false;
      open: () => null;
    };

export function useAuth(): Return {
  const context = useContext(authContext);
  if (!context) {
    return {
      isLoggedIn: false,
      currentUser: () => null,
      open: () => null,
      initialized: false,
    };
  }
  return { ...context, initialized: true };
}
