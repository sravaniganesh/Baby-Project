import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CommunityScreen from '../screens/user/CommunityScreen';
import CreatePostScreen from '../screens/user/CreatePostScreen';
import PostDetailsScreen from '../screens/user/PostDetailsScreen';

import UserChatScreen from '../screens/user/UserChatScreen';
import UserOrdersScreen from "../screens/user/UserOrdersScreen";
import WomenSpacesScreen from '../screens/user/WomenSpacesScreen';
import WomenOnboardingScreen from '../screens/user/WomenOnboardingScreen';
import WomenChatScreen from '../screens/user/WomenChatScreen';
import EditUsernameScreen from "../screens/user/EditUsernameScreen";
import DoctorChatScreen from "../screens/doctor/DoctorChatScreen";

/* ===========================
   🔥 ADD THESE IMPORTS ONLY
=========================== */
import PrivateChatListScreen from "../screens/user/PrivateChatListScreen";
import PrivateChatScreen from "../screens/user/PrivateChatScreen";
import StartPrivateChatScreen from "../screens/user/StartPrivateChatScreen";
/* =========================== */

export type CommunityPost = {
  _id: string;
  content: string;
  category: string;
  userId: {
    name: string;
  };
  likes: { userId: string }[];
};

export type UserStackParamList = {
  Home: undefined;
  Doctors: undefined;
  ChatList: undefined;

  Community: undefined;
  CreatePost: undefined;
  UserOrders: undefined;

  WomenSpaces: undefined;
  EditUsername: undefined;

  WomenOnboarding: undefined;
  WomenChat: undefined;


  PostDetails: {
    post: any;
  };

  UserChat: {
    chatId: string;
    doctorId: string;
    doctorName: string;
  };
 


  /* ===========================
     🔥 ADD THESE TYPES ONLY
  =========================== */
  PrivateChatList: undefined;

  PrivateChat: {
    chatId: string;
  };

  StartPrivateChat: undefined;
  /* =========================== */
};

const Stack = createNativeStackNavigator<UserStackParamList>();

const UserStack = () => {
  return (
    <Stack.Navigator>

      <Stack.Screen
        name="Community"
        component={CommunityScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'Create Post' }}
      />

      <Stack.Screen
        name="PostDetails"
        component={PostDetailsScreen}
        options={{ title: 'Post Details' }}
      />

      <Stack.Screen
        name="UserOrders"
        component={UserOrdersScreen}
        options={{ title: "My Orders" }}
      />

      <Stack.Screen
        name="WomenSpaces"
        component={WomenSpacesScreen}
        options={{ title: 'Women Spaces' }}
      />

      <Stack.Screen
        name="EditUsername"
        component={EditUsernameScreen}
        options={{ title: "Edit Username" }}
      />

      <Stack.Screen
        name="WomenChat"
        component={WomenChatScreen}
        options={{ title: 'Your Women Group' }}
      />

      
     

      {/* ===========================
         🔥 ADD PRIVATE CHAT SCREENS
         (DO NOT REMOVE ANYTHING ABOVE)
      =========================== */}

      <Stack.Screen
        name="PrivateChatList"
        component={PrivateChatListScreen}
        options={{ title: "Private Messages" }}
      />

      <Stack.Screen
        name="StartPrivateChat"
        component={StartPrivateChatScreen}
        options={{ title: "Start New Chat" }}
      />

      <Stack.Screen
        name="PrivateChat"
        component={PrivateChatScreen}
        options={{ title: "Chat" }}
      />
      <Stack.Screen
  name="UserChat"
  component={DoctorChatScreen}
/>
      

      {/* =========================== */}

    </Stack.Navigator>
  );
};

export default UserStack;
