import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const Card = ({
    title,
    description,
    icon,
    onPress,
  }: {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardRow}>

        {/* ICON */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={24} color="#ff6b81" />
        </View>

        {/* TEXT */}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardText}>{description}</Text>
        </View>

        {/* ARROW */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="#999"
        />

      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Welcome 👋</Text>

      <Card
        title="Community"
        icon="forum-outline"
        description="Join discussions, ask questions, and share your thoughts."
        onPress={() => navigation.navigate('Community')}
      />

      <Card
        title="Doctors"
        icon="stethoscope"
        description="Chat with verified doctors (Premium users only)."
        onPress={() => navigation.navigate('Doctor')}
      />

      <Card
        title="Shop"
        icon="shopping-outline"
        description="Browse products, add to cart, and track orders."
        onPress={() => navigation.navigate('Shop')}
      />
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  heading: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 3,
  },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffe4ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  cardText: {
    fontSize: 14,
    color: '#555',
  },
});