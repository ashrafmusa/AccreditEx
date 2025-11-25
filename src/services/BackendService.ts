import React, { createContext, useContext, useEffect } from "react";
import { backendService } from "./BackendService";

const BackendServiceContext = createContext(backendService);

export const useBackend = () => useContext(BackendServiceContext);

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    backendService.initialize();
    const handleOnline = () => backendService.processOfflineQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return (
    <BackendServiceContext.Provider value= { backendService } >
    { children }
    </BackendServiceContext.Provider>
  );
};