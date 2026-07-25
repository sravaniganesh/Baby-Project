import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UserStackParamList } from '../../navigation/UserStack';
import API from '../../config/api';
import { useAuth } from '../../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<
  UserStackParamList,
  'Community'
>;

interface CommunityPost {
  _id: string;
  content: string;
  category: string;
  userId: {
    name: string;
  };
  likes: { userId: string }[];
}

const CommunityScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { token, user } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await API.get('/community', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(res.data);
    } catch (error) {
      console.log('Failed to fetch community posts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const toggleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id !== postId) return post;

        const alreadyLiked = post.likes.some(
          (l) => l.userId === user?._id
        );

        return {
          ...post,
          likes: alreadyLiked
            ? post.likes.filter((l) => l.userId !== user?._id)
            : [...post.likes, { userId: user?._id }],
        };
      })
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Community</Text>

        {/* 🔥 ADDED: Private Message + Post buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          
          {/* 💬 Private Messages */}
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PrivateChatList')}
          >
            <Text style={{ fontSize: 18 }}>💬</Text>
          </TouchableOpacity>

          {/* Existing + Post */}
          <TouchableOpacity
            style={styles.postButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Text style={styles.postButtonText}>+ Post</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Google Ad Placeholder */}
      <View style={styles.adBox}>
        <Text style={styles.adText}>Sponsored</Text>
      </View>

      {/* Choose Your Space */}
      <View style={styles.stageSection}>
        <Text style={styles.stageTitle}>Choose Your Space</Text>

        <View style={styles.stageGrid}>
          {[
            '🌱 Teen & College Life',
            '💍 Married Life',
            '🤍 Trying to Conceive',
            '🤰 Pregnancy',
            '👶 Post Pregnancy & Kids',
          ].map((label) => (
            <TouchableOpacity
              key={label}
              style={styles.stageCard}
              activeOpacity={0.9}
              onPress={() => {}}
            >
              <Text style={styles.stageText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Women Spaces Banner */}
      <TouchableOpacity
        style={styles.womenSpacesBanner}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('WomenSpaces')}
      >
        <Text style={styles.womenSpacesTitle}>💗 Women Spaces</Text>
        <Text style={styles.womenSpacesSubtitle}>
          Connect with women in the same stage of life
        </Text>
      </TouchableOpacity>

      <View style={styles.sectionDivider} />

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>💗</Text>
            <Text style={styles.emptyTitle}>Welcome to the Community</Text>
            <Text style={styles.emptyText}>
              This is a safe space for women to share thoughts, doubts,
              experiences, and support each other.
            </Text>
            <Text style={styles.emptyHint}>
              You can start by creating your first post.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={styles.postSeparator} />
        )}
        renderItem={({ item }) => {
          const liked = item.likes.some(
            (l) => l.userId === user?._id
          );

          return (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() =>
                navigation.navigate('PostDetails', { post: item })
              }
            >
              <View style={styles.postCard}>
                <Text style={styles.author}>
                  {item.userId?.name || 'User'}
                </Text>

                <Text style={styles.content}>{item.content}</Text>

                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={() => toggleLike(item._id)}
                    activeOpacity={0.8}
                    style={[
                      styles.likeButton,
                      liked && styles.likeButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.likeText,
                        liked && styles.liked,
                      ]}
                    >
                      ❤️ {item.likes.length}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default CommunityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#222',
  },

  /* 🔥 NEW */
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  postButton: {
    backgroundColor: '#ff5a5f',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  /* ===== REST UNTOUCHED ===== */

  adBox: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  adText: {
    fontSize: 12,
    color: '#777',
  },

  stageSection: { marginBottom: 12 },
  stageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stageCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  stageText: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
    lineHeight: 18,
  },

  womenSpacesBanner: {
    backgroundColor: '#fff0f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  womenSpacesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff5a5f',
    marginBottom: 4,
  },
  womenSpacesSubtitle: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 14,
  },

  postSeparator: { height: 10 },

  postCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  content: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  likeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f7f7f7',
  },
  likeButtonActive: { backgroundColor: '#fff0f0' },
  likeText: { fontSize: 14, color: '#777' },
  liked: { color: '#ff5a5f', fontWeight: '600' },

  emptyBox: {
    marginTop: 70,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#222',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
