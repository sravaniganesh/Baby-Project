import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserStackParamList } from '../../navigation/UserStack';
import API from '../../config/api';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<UserStackParamList, 'PostDetails'>;

/* ================= TYPES ================= */

interface Reply {
  _id: string;
  text: string;
  userId: { name: string };
  replyToReplyId?: string | null;
}

interface Comment {
  _id: string;
  text: string;
  userId: { name: string };
  replies?: Reply[];
}

interface Post {
  _id: string;
  content: string;
  category: string;
  userId: { name: string };
  likes: { userId: string }[];
  comments?: Comment[];
}

/* ================= SCREEN ================= */

const PostDetailsScreen = ({ route }: Props) => {
  const { post: initialPost } = route.params;
  const { token, user } = useAuth();

  const [post, setPost] = useState<Post>(initialPost);
  const [liking, setLiking] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyToReplyId, setReplyToReplyId] = useState<string | null>(null);
  const [replyingToUser, setReplyingToUser] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);

  /* ================= HELPERS ================= */

  const cancelReply = () => {
    setReplyText('');
    setReplyingToCommentId(null);
    setReplyToReplyId(null);
    setReplyingToUser(null);
    setEditingReplyId(null);
  };

  /* ================= LIKE ================= */

  const handleLike = async () => {
    try {
      setLiking(true);
      const res = await API.post(
        `/community/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPost(res.data);
    } finally {
      setLiking(false);
    }
  };

  /* ================= COMMENT ================= */

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSendingComment(true);
      const res = await API.post(
        `/community/${post._id}/comment`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPost(res.data);
      setCommentText('');
    } finally {
      setSendingComment(false);
    }
  };

  /* ================= REPLY / EDIT ================= */

  const handleReplySubmit = async () => {
    if (!replyText.trim() || !replyingToCommentId) return;

    try {
      setSendingReply(true);

      const endpoint = editingReplyId
        ? `/community/${post._id}/reply/${editingReplyId}`
        : `/community/${post._id}/comment/${replyingToCommentId}/reply`;

      const method = editingReplyId ? API.put : API.post;

      const payload = editingReplyId
        ? { text: replyText }
        : { text: replyText, replyToReplyId };

      const res = await method(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPost(res.data);
      cancelReply();
    } finally {
      setSendingReply(false);
    }
  };

  /* ================= DELETE REPLY ================= */

  const handleDeleteReply = (replyId: string) => {
    Alert.alert('Delete Reply', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await API.delete(
            `/community/${post._id}/reply/${replyId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPost(res.data);
          cancelReply();
        },
      },
    ]);
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* Post Card */}
      <View style={styles.postCard}>
        <Text style={styles.author}>{post.userId.name}</Text>
        <Text style={styles.content}>{post.content}</Text>

        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          {liking ? (
            <ActivityIndicator color="#ff5a5f" />
          ) : (
            <Text style={styles.likeText}>
              ❤️ {post.likes.length} Likes
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Comment */}
      <View style={styles.commentInputBox}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={commentText}
          onChangeText={setCommentText}
        />

        <TouchableOpacity
          style={styles.addCommentBtn}
          onPress={handleAddComment}
        >
          <Text style={styles.addCommentText}>
            {sendingComment ? 'Posting...' : 'Post Comment'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comments */}
      <FlatList
        data={post.comments || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <Text style={styles.commentAuthor}>{item.userId.name}</Text>
            <Text style={styles.commentText}>{item.text}</Text>

            <TouchableOpacity
              onPress={() => {
                setReplyingToCommentId(item._id);
                setReplyToReplyId(null);
                setReplyingToUser(item.userId.name);
                setEditingReplyId(null);
                setReplyText('');
              }}
            >
              <Text style={styles.replyBtn}>Reply</Text>
            </TouchableOpacity>

            {(item.replies || []).map((r) => {
              const isOwn = r.userId.name === user?.name;

              return (
                <View
                  key={r._id}
                  style={[
                    styles.replyItem,
                    editingReplyId === r._id && styles.activeReply,
                  ]}
                >
                  <Text style={styles.replyAuthor}>{r.userId.name}</Text>
                  <Text style={styles.replyText}>{r.text}</Text>

                  <View style={styles.replyActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setReplyingToCommentId(item._id);
                        setReplyToReplyId(r._id);
                        setReplyingToUser(r.userId.name);
                        setEditingReplyId(null);
                        setReplyText('');
                      }}
                    >
                      <Text style={styles.replyBtn}>Reply</Text>
                    </TouchableOpacity>

                    {isOwn && (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingReplyId(r._id);
                            setReplyingToCommentId(item._id);
                            setReplyToReplyId(null);
                            setReplyingToUser(r.userId.name);
                            setReplyText(r.text);
                          }}
                        >
                          <Text style={styles.editBtn}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteReply(r._id)}
                        >
                          <Text style={styles.deleteBtn}>Delete</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      />

      {/* Reply Box */}
      {replyingToCommentId && (
        <View style={styles.replyBox}>
          <Text style={styles.replyingTo}>
            {editingReplyId
              ? 'Editing reply'
              : `Replying to ${replyingToUser}`}
          </Text>

          <TextInput
            style={styles.input}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write reply..."
          />

          <View style={styles.replyActions}>
            <TouchableOpacity onPress={handleReplySubmit}>
              <Text style={styles.replyBtn}>
                {sendingReply ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={cancelReply}>
              <Text style={styles.deleteBtn}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default PostDetailsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fafafa',
  },

  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  author: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    marginBottom: 12,
  },

  likeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff0f0',
  },
  likeText: {
    color: '#ff5a5f',
    fontWeight: '600',
    fontSize: 14,
  },

  commentInputBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
  },
  addCommentBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  addCommentText: {
    color: '#fff',
    fontWeight: '600',
  },

  commentCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  commentAuthor: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#222',
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },

  replyItem: {
    marginLeft: 16,
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ddd',
  },
  activeReply: {
    backgroundColor: '#eef4ff',
    borderLeftColor: '#007AFF',
  },
  replyAuthor: {
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    color: '#444',
  },

  replyActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  replyBtn: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  editBtn: {
    color: '#ff9500',
    fontSize: 13,
  },
  deleteBtn: {
    color: '#ff3b30',
    fontSize: 13,
  },

  replyBox: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 12,
    marginTop: 8,
  },
  replyingTo: {
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
  },
});
