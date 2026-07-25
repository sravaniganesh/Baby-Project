import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext'; // ✅ ADD

const WomenSpacesScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth(); // ✅ GET LOGGED IN USER

  const userStage = user?.womenCategory; // teen, married, etc.

  const goToWomenChat = (stageKey: string) => {

    // ✅ STRICT STAGE CONTROL
    if (userStage !== stageKey) {
      Alert.alert(
        "Access Restricted",
        "This space is only available for your current life stage."
      );
      return;
    }

    navigation.navigate("WomenChat", { stageKey });
  };

  // ✅ Helper for locked styling
  const isLocked = (stageKey: string) => userStage !== stageKey;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Women Spaces</Text>
        <Text style={styles.subtitle}>
          Connect with women in the same stage of life
        </Text>
      </View>

      <View style={styles.cardsWrapper}>

        {/* 🌱 TEEN */}
        <TouchableOpacity
          style={[styles.card, isLocked("teen") && styles.lockedCard]}
          activeOpacity={0.9}
          onPress={() => goToWomenChat("teen")}
        >
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.cardTitle}>Teen & College Life</Text>
          <Text style={styles.cardDesc}>
            Studies, friendships, travel, career dreams, and everyday questions.
          </Text>
          {isLocked("teen") && <Text style={styles.lockText}>🔒 Not your stage</Text>}
        </TouchableOpacity>

        {/* 💍 MARRIED */}
        <TouchableOpacity
          style={[styles.card, isLocked("married") && styles.lockedCard]}
          activeOpacity={0.9}
          onPress={() => goToWomenChat("married")}
        >
          <Text style={styles.emoji}>💍</Text>
          <Text style={styles.cardTitle}>Married Life</Text>
          <Text style={styles.cardDesc}>
            Relationships, family adjustments, emotional support, and growth.
          </Text>
          {isLocked("married") && <Text style={styles.lockText}>🔒 Not your stage</Text>}
        </TouchableOpacity>

        {/* 🤍 TRYING */}
        <TouchableOpacity
          style={[styles.card, isLocked("trying_to_conceive") && styles.lockedCard]}
          activeOpacity={0.9}
          onPress={() => goToWomenChat("trying_to_conceive")}
        >
          <Text style={styles.emoji}>🤍</Text>
          <Text style={styles.cardTitle}>Trying to Conceive</Text>
          <Text style={styles.cardDesc}>
            Questions, emotions, patience, hope, and shared experiences.
          </Text>
          {isLocked("trying_to_conceive") && <Text style={styles.lockText}>🔒 Not your stage</Text>}
        </TouchableOpacity>

        {/* 🤰 PREGNANCY */}
        <TouchableOpacity
          style={[styles.card, isLocked("pregnant_trimester_1") && styles.lockedCard]}
          activeOpacity={0.9}
          onPress={() => goToWomenChat("pregnant_trimester_1")}
        >
          <Text style={styles.emoji}>🤰</Text>
          <Text style={styles.cardTitle}>Pregnancy</Text>
          <Text style={styles.cardDesc}>
            Trimester-wise support, body changes, doubts, and care.
          </Text>
          {isLocked("pregnant_trimester_1") && <Text style={styles.lockText}>🔒 Not your stage</Text>}
        </TouchableOpacity>

        {/* 👶 POST */}
        <TouchableOpacity
          style={[styles.card, isLocked("post_pregnancy_newborn") && styles.lockedCard]}
          activeOpacity={0.9}
          onPress={() => goToWomenChat("post_pregnancy_newborn")}
        >
          <Text style={styles.emoji}>👶</Text>
          <Text style={styles.cardTitle}>Post Pregnancy & Kids</Text>
          <Text style={styles.cardDesc}>
            Baby care, breastfeeding, recovery, and motherhood support.
          </Text>
          {isLocked("post_pregnancy_newborn") && <Text style={styles.lockText}>🔒 Not your stage</Text>}
        </TouchableOpacity>

      </View>

      <View style={styles.safetyBox}>
        <Text style={styles.safetyText}>
          💗 These spaces are meant to be respectful, supportive, and safe for
          every woman.
        </Text>
      </View>
    </ScrollView>
  );
};

export default WomenSpacesScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },

  backBtn: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },

  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  cardsWrapper: {
    gap: 14,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eee',
  },

  lockedCard: {
    opacity: 0.6,
  },

  lockText: {
    marginTop: 8,
    fontSize: 12,
    color: '#ff5a5f',
    fontWeight: '500',
  },

  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },

  safetyBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff0f0',
  },
  safetyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});