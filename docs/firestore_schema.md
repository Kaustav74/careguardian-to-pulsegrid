# PulseGrid Firestore Schema

This document outlines the NoSQL schema design for the PulseGrid platform.

## `users` Collection
Stores user profiles and core identity mapping to Firebase Auth.

```json
{
  "uid": "string (Auth ID)",
  "email": "string",
  "displayName": "string",
  "photoURL": "string | null",
  "phoneNumber": "string | null",
  "roleId": "string (reference to roles)",
  "hospitalId": "string | null",
  "isApproved": "boolean",
  "isActive": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "string (uid)",
  "updatedBy": "string (uid)"
}
```

## `roles` Collection
Stores RBAC role definitions and permissions.

```json
{
  "id": "string",
  "label": "string",
  "description": "string",
  "permissions": ["string"],
  "parentRoles": ["string"]
}
```

## `hospitals` Collection
Stores facility information.

```json
{
  "id": "string",
  "name": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "phone": "string",
  "email": "string",
  "adminId": "string (uid)",
  "isActive": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "string (uid)",
  "updatedBy": "string (uid)"
}
```

## `patientProfiles` Collection
Extended medical profile details for users with the patient role.

```json
{
  "id": "string",
  "uid": "string (uid)",
  "hospitalId": "string | null",
  "bloodGroup": "string",
  "allergies": ["string"],
  "emergencyContact": {
    "name": "string",
    "phone": "string",
    "relationship": "string"
  },
  "familyMemberIds": ["string"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "string (uid)",
  "updatedBy": "string (uid)"
}
```

## `emergencyRequests` Collection
Real-time emergency dispatch queue.

```json
{
  "id": "string",
  "patientId": "string (uid)",
  "hospitalId": "string | null",
  "ambulanceId": "string | null",
  "location": {
    "lat": "number",
    "lng": "number",
    "address": "string"
  },
  "status": "enum (pending | dispatched | resolved | cancelled)",
  "priority": "enum (critical | high | medium | low)",
  "description": "string",
  "responderId": "string (uid) | null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "createdBy": "string (uid)",
  "updatedBy": "string (uid)"
}
```

## `auditLogs` Collection
Immutable ledger of privileged actions.

```json
{
  "id": "string",
  "uid": "string (actor)",
  "roleId": "string",
  "action": "string",
  "resourceType": "string",
  "resourceId": "string | null",
  "details": "map",
  "hospitalId": "string | null",
  "timestamp": "timestamp"
}
```

## `notifications` Collection
Real-time user alerts and toasts.

```json
{
  "id": "string",
  "uid": "string (target user)",
  "title": "string",
  "message": "string",
  "type": "enum (info | success | warning | error | emergency)",
  "isRead": "boolean",
  "link": "string | null",
  "createdAt": "timestamp"
}
```
