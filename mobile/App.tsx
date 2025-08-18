import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './src/store';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import SalesScreen from './src/screens/SalesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import NativeWind styles
import './global.css';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider>
            <NavigationContainer>
              <Tab.Navigator
                screenOptions={({route}) => ({
                  tabBarIcon: ({focused, color, size}) => {
                    let iconName: string;

                    switch (route.name) {
                      case 'Dashboard':
                        iconName = 'dashboard';
                        break;
                      case 'Products':
                        iconName = 'inventory';
                        break;
                      case 'Sales':
                        iconName = 'shopping-cart';
                        break;
                      case 'Reports':
                        iconName = 'assessment';
                        break;
                      case 'Settings':
                        iconName = 'settings';
                        break;
                      default:
                        iconName = 'help';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                  },
                  tabBarActiveTintColor: '#667eea',
                  tabBarInactiveTintColor: 'gray',
                  headerStyle: {
                    backgroundColor: '#667eea',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                })}
              >
                <Tab.Screen 
                  name="Dashboard" 
                  component={DashboardScreen}
                  options={{title: 'Tableau de Bord'}}
                />
                <Tab.Screen 
                  name="Products" 
                  component={ProductsScreen}
                  options={{title: 'Produits'}}
                />
                <Tab.Screen 
                  name="Sales" 
                  component={SalesScreen}
                  options={{title: 'Ventes'}}
                />
                <Tab.Screen 
                  name="Reports" 
                  component={ReportsScreen}
                  options={{title: 'Rapports'}}
                />
                <Tab.Screen 
                  name="Settings" 
                  component={SettingsScreen}
                  options={{title: 'Paramètres'}}
                />
              </Tab.Navigator>
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
