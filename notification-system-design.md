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


# Stage 2

## Database Choice

I would choose PostgreSQL as the persistent storage for this notification system.

I chose PostgreSQL because it provides reliable transactions (ACID properties), supports indexing and partitioning, and performs well for filtering and sorting operations. Since the data is structured and has relationships between students and notifications, a relational database is a suitable choice.

---

## Database Schema

### Students Table

| Column | Data Type |
|---------|-----------|
| id | BIGINT PRIMARY KEY |
| name | VARCHAR(100) |
| email | VARCHAR(100) |
| created_at | TIMESTAMP |

### Notifications Table

| Column | Data Type |
|---------|-----------|
| id | UUID PRIMARY KEY |
| student_id | BIGINT |
| notification_type | ENUM('Placement','Event','Result') |
| message | TEXT |
| is_read | BOOLEAN |
| created_at | TIMESTAMP |

---

## Problems at Scale

As the number of students and notifications increases, the following problems may occur:

- Slow query performance.
- Increased database storage usage.
- Higher load due to frequent reads and writes.
- Slower sorting and filtering operations.
- Increased response time.

---

## Solutions

To solve these problems, I would:

- Create indexes on frequently queried columns.
- Use database partitioning for large tables.
- Implement pagination.
- Use Redis caching.
- Use read replicas for read-heavy operations.

---

## SQL Queries

### Fetch all notifications of a student

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
ORDER BY created_at DESC;
```

### Fetch unread notifications

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND is_read = false
ORDER BY created_at DESC;
```

### Fetch notifications by type

```sql
SELECT *
FROM notifications
WHERE student_id = 1042
AND notification_type = 'Placement';
```

### Mark notification as read

```sql
UPDATE notifications
SET is_read = true
WHERE id = 'notification_id';
```

### Create a notification

```sql
INSERT INTO notifications
(student_id, notification_type, message, is_read, created_at)
VALUES
(1042, 'Placement', 'Google hiring for SDE roles', false, NOW());
```