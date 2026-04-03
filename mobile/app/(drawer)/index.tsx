/**
 * Drawer index route -- redirects to the default chat screen.
 *
 * When the drawer layout mounts, this route immediately sends the user
 * to the "new" chat placeholder. In Phase 75+, this could redirect to
 * the most recent active session instead.
 */

import { Redirect } from 'expo-router';

export default function DrawerIndex() {
  return <Redirect href="/chat/new" />;
}
