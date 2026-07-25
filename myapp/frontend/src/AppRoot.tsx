import React from "react";

type Props = {
  children: React.ReactNode;
};

const AppRoot: React.FC<Props> = ({ children }) => {
  return <>{children}</>;
};

export default AppRoot;
