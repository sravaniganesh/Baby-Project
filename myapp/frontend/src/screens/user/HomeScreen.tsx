
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ConsultationStatusBanner from "./ConsultationStatusBanner";


const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const Card = ({
    title,
    description,
    icon,
    color,
    background,
    onPress,
  }: {
    title: string;
    description: string;
    icon: string;
    color: string;
    background: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={[styles.iconContainer, { backgroundColor: background }]}>
        <MaterialCommunityIcons name={icon} size={27} color={color} />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{description}</Text>
      </View>

      <View style={styles.arrowContainer}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={23}
          color="#8B8B98"
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="#FFF9FA" barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Welcome section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.greeting}>WELCOME TO MAA</Text>
            <Text style={styles.heading}>Hello there! 👋</Text>
            <Text style={styles.subtitle}>
              A little care, support and love for every stage of life.
            </Text>
          </View>

          <View style={styles.heartIcon}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={34}
              color="#E85D78"
            />
          </View>
                </View>

        {/* Consultation booking status */}
        <ConsultationStatusBanner />

        {/* Highlight section */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Your wellbeing{'\n'}matters to us.
            </Text>
            <Text style={styles.heroDescription}>
              Discover support, healthcare and everyday essentials in one place.
            </Text>
          </View>

          <MaterialCommunityIcons
            name="flower-tulip"
            size={76}
            color="#FFFFFF"
            style={styles.heroIcon}
          />
        </View>

        {/* Explore section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Explore Maa</Text>
            <Text style={styles.sectionSubtitle}>
              Everything you need, all in one place
            </Text>
          </View>
        </View>

        <Card
          title="Community"
          icon="account-group-outline"
          color="#A05AB5"
          background="#F4E9FA"
          description="Connect with women, share experiences and support each other."
          onPress={() => navigation.navigate('Community')}
        />

        <Card
          title="Doctors"
          icon="stethoscope"
          color="#168B83"
          background="#E4F5F1"
          description="Find doctors and request hospital or video consultations."
          onPress={() => navigation.navigate('Doctor')}
        />

        <Card
          title="Shop"
          icon="shopping-outline"
          color="#D18A37"
          background="#FFF1DF"
          description="Discover products for women, mothers and children."
          onPress={() => navigation.navigate('Shop')}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialCommunityIcons
            name="heart"
            size={15}
            color="#E8788E"
          />
          <Text style={styles.footerText}>
            Made with care, for every woman.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF9FA',
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 30,
  },

  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 23,
  },

  welcomeTextContainer: {
    flex: 1,
    paddingRight: 10,
  },

  greeting: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#D66A83',
    marginBottom: 7,
  },

  heading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#292637',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#777481',
  },

  heartIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFE8ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCard: {
    minHeight: 155,
    backgroundColor: '#A94F76',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 29,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#A94F76',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
  },

  heroContent: {
    flex: 1,
    paddingRight: 5,
  },

  heroTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  heroDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: '#FCEAF0',
    maxWidth: 220,
  },

  heroIcon: {
    opacity: 0.95,
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#292637',
  },

  sectionSubtitle: {
    fontSize: 12,
    color: '#898592',
    marginTop: 5,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1EBEF',
    elevation: 2,
    shadowColor: '#38243A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#302B3A',
    marginBottom: 5,
  },

  cardText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#85818E',
  },

  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    gap: 6,
  },

  footerText: {
    fontSize: 11,
    color: '#A19BA5',
    fontWeight: '600',
  },
});
