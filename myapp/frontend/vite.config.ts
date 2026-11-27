import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: [
      {
        find: /^react-native$/,
        replacement: resolve(__dirname, "src/platform/react-native.web.ts"),
      },
      {
        find: /^react-native-image-picker$/,
        replacement: resolve(
          __dirname,
          "src/platform/imagePicker.web.ts",
        ),
      },
      {
        find: /^@react-native-community\/datetimepicker$/,
        replacement: resolve(
          __dirname,
          "src/components/common/DateTimePicker.web.tsx",
        ),
      },
      {
        find: /^react-native-vector-icons\/MaterialCommunityIcons$/,
        replacement: resolve(
          __dirname,
          "node_modules/react-native-vector-icons/dist/MaterialCommunityIcons.js",
        ),
      },
      {
        find: /^react-native-vector-icons\/Ionicons$/,
        replacement: resolve(
          __dirname,
          "node_modules/react-native-vector-icons/dist/Ionicons.js",
        ),
      },
    ],
    extensions: [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".json",
    ],
  },
  optimizeDeps: {
    exclude: ["react-native"],
    esbuildOptions: {
      resolveExtensions: [
        ".web.tsx",
        ".web.ts",
        ".web.jsx",
        ".web.js",
        ".tsx",
        ".ts",
        ".jsx",
        ".js",
        ".json",
      ],
    },
  },
});
