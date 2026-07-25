import React from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  name: string;
  size?: number;
  color?: string;
};

const AppIcon = ({ name, size = 22, color = "#333" }: Props) => {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
    />
  );
};

export default AppIcon;