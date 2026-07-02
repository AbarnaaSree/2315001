# Notification System Design
# Stage 1

# Notification System API Design

The notification system should support notifications related to Placements, Events, and Results. 
Students receive notification in real time

## Core APIs
### 1. Fetch All Notifications

```http
GET /api/v1/notifications?page=1&limit=10&notification_type=Placement
```
Returns all notifications for a student with support for pagination and filtering.

### 2. Fetch a Single Notification

```http
GET /api/v1/notifications/{notificationId}
```

Returns details of a specific notification.
### 3. Create Notification

```http
POST /api/v1/notifications
```

Request:

```json
{
  "studentIds": [1042,1043],
  "type": "Placement",
  "message": "Google hiring for SDE roles"
}
```
Creates notifications for selected students.
---
### 4. Broadcast Notification

```http
POST /api/v1/notifications/broadcast
```

Request:

```json
{
  "type": "Placement",
  "message": "Amazon campus recruitment drive announced"
}
```

Sends notifications to all students.

---

### 5. Mark Notification as Read

```http
PATCH /api/v1/notifications/{notificationId}/read
```

Updates notification status to read.

---

### 6. Fetch Unread Notifications

```http
GET /api/v1/notifications/unread
```

Returns all unread notifications.

---

### 7. Fetch Priority Notifications

```http
GET /api/v1/notifications/priority?limit=10
```
Returns top priority notifications based on importance and recency.

---

## Real-Time Notification Mechanism
For real-time notification delivery, I would use WebSockets.
