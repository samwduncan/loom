# Apple Developer Program & APNs Setup Checklist

**Plan:** 68-07 (Phase 68: scaffolding-design)
**Requirement:** SCAFF-05
**Status:** Awaiting human action

---

## Task 1: Verify Apple Developer Program Enrollment

- [ ] Go to https://developer.apple.com/account
- [ ] Check membership status shows **"Active"**
- [ ] If "Enrollment Pending" -- wait and retry later (24-48 hours typical for individual)

**Cost:** $99/year personal account
**Timeline:** 24-48 hours for individual, up to 2 weeks for organization

### Troubleshooting
- If enrollment hasn't been started yet: https://developer.apple.com/programs/enroll/
- Apple ID must have two-factor authentication enabled
- Payment method must be valid and on file

---

## Task 2: Create APNs Key and Configure in Expo

**Prerequisites:** Task 1 must be complete (Active membership required)

### Step 2a: Create APNs Key

- [ ] Go to https://developer.apple.com/account/resources/authkeys/list
- [ ] Click "+" to create a new key
- [ ] Name: **"Loom Push Notifications"**
- [ ] Check: **"Apple Push Notifications service (APNs)"**
- [ ] Click Continue, then Register
- [ ] **CRITICAL:** Download the .p8 key file immediately (can only be downloaded once!)
- [ ] Note the **Key ID** (shown on the key details page)
- [ ] Note the **Team ID** (visible at https://developer.apple.com/account > Membership details)

### Step 2b: Configure in Expo

- [ ] Go to https://expo.dev
- [ ] Navigate to the Loom project > Credentials > iOS
- [ ] Under Push Notifications, upload the .p8 key file
- [ ] Enter the Key ID
- [ ] Enter the Team ID

### Step 2c: Verify Configuration

After configuring, run from the project root:
```bash
cd mobile && eas credentials
```
This should show the push notification key configured for iOS.

---

## Important Notes

- The .p8 key file can **only be downloaded once**. Store it securely.
- Key ID and Team ID are needed for Expo configuration.
- This unlocks Phase 72 (push notifications) from a certificate perspective.
- This plan can be completed independently -- all other Phase 68 plans can proceed without it.

---

*Generated: 2026-03-31*
*Plan: 68-07 (Apple Developer enrollment & APNs configuration)*
