import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TaskProvider } from '../store/TaskContext';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <TaskProvider>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </TaskProvider>
  );
}
