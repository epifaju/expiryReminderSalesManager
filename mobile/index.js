/**
 * @format
 */

import { AppRegistry } from "react-native";
import SimpleApp from "./SimpleApp";
import { name as appName } from "./package.json";

AppRegistry.registerComponent(appName, () => SimpleApp);
