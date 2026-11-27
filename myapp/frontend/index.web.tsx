import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";
import "./src/styles/web.css";

const rootTag = document.getElementById("root");

if (!rootTag) {
  throw new Error("Web root element was not found");
}

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, { rootTag });
