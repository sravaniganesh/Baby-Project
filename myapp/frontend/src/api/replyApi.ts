import API from '../config/api';

export const createReply = async (
  token: string,
  data: {
    postId: string;
    content: string;
    parentReplyId?: string | null;
  }
) => {
  const res = await API.post('/replies', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getRepliesByPost = async (
  postId: string,
  token: string
) => {
  const res = await API.get(`/replies/post/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};