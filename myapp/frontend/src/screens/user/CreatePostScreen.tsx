import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import API from '../../config/api';

const CreatePostScreen = () => {
  const navigation = useNavigation();

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Validation', 'Post content cannot be empty');
      return;
    }

    try {
      setLoading(true);

      // 🔐 Token is attached automatically by Axios interceptor
      await API.post('/community', {
        category: 'general',
        content,
      });

      setContent('');
      navigation.goBack();
    } catch (error: any) {
      console.log('Create post error:', error?.response?.data || error.message);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to create post'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create Post</Text>

      {/* Post Input */}
      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          placeholder="Share your thoughts, doubts, or feelings…"
          multiline
          value={content}
          onChangeText={setContent}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleCreatePost}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Post</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CreatePostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
  },

  backBtn: {
    marginBottom: 10,
  },
  backText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },

  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    color: '#222',
  },

  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  input: {
    height: 140,
    fontSize: 15,
    color: '#444',
    textAlignVertical: 'top',
    lineHeight: 22,
  },

  button: {
    backgroundColor: '#ff5a5f',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
