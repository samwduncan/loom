import express from 'express';
import { Expo } from 'expo-server-sdk';
import { pushTokenDb } from '../database/db.js';

const router = express.Router();

const VALID_NOTIFICATION_MODES = ['all', 'failures_and_permissions', 'permissions_only', 'none'];

/**
 * POST /api/push/register
 * Register or update a push token with notification preferences.
 * Body: { token: string, platform?: string, notificationMode?: string }
 */
router.post('/register', (req, res) => {
  try {
    const { token, platform, notificationMode } = req.body;

    // Validate token exists
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Validate token is a valid Expo push token
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ error: 'Invalid Expo push token' });
    }

    // Validate notification mode if provided
    const mode = notificationMode || 'all';
    if (!VALID_NOTIFICATION_MODES.includes(mode)) {
      return res.status(400).json({
        error: `Invalid notification mode. Must be one of: ${VALID_NOTIFICATION_MODES.join(', ')}`
      });
    }

    pushTokenDb.upsertToken(token, platform || 'ios', req.user.id, mode);
    res.json({ success: true });
  } catch (error) {
    console.error('[Push] Register error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/push/register
 * Unregister a push token.
 * Body: { token: string }
 */
router.delete('/register', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    pushTokenDb.deleteToken(token);
    res.json({ success: true });
  } catch (error) {
    console.error('[Push] Unregister error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/push/preferences
 * Update notification mode for a token.
 * Body: { token: string, notificationMode: string }
 */
router.patch('/preferences', (req, res) => {
  try {
    const { token, notificationMode } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!notificationMode) {
      return res.status(400).json({ error: 'Notification mode is required' });
    }

    if (!VALID_NOTIFICATION_MODES.includes(notificationMode)) {
      return res.status(400).json({
        error: `Invalid notification mode. Must be one of: ${VALID_NOTIFICATION_MODES.join(', ')}`
      });
    }

    pushTokenDb.updatePreference(token, notificationMode);
    res.json({ success: true });
  } catch (error) {
    console.error('[Push] Preferences update error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
