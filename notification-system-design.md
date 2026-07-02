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

ID – BIGINT (Primary Key)
Name – VARCHAR(100)
Email – VARCHAR(100)
Created At – TIMESTAMP

### Notifications Table

ID – UUID (Primary Key)
Student ID – BIGINT
Notification Type – ENUM('Placement', 'Event', 'Result')
Message – TEXT
Is Read – BOOLEAN
Created At – TIMESTAMP

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

# Stage 3


The given query is:

```sql
SELECT *
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt ASC;
```

The query is accurate because it fetches all unread notifications for a specific student and sorts them by the time they were created.

---

## Why is this query slow?

The database now contains around 5,000,000 notifications. If proper indexes are not present, the database has to scan a large number of records to find the unread notifications of a particular student.

The query is filtering on `studentID` and `isRead` and then sorting by `createdAt`. Performing these operations on a large table without proper indexing will increase the execution time significantly.

---

## What would I change?

I would create a composite index on the columns used in filtering and sorting.

```sql
CREATE INDEX idx_notifications
ON notifications(studentID, isRead, createdAt);
```

This allows the database to quickly find unread notifications for a student and return them in the required order.

Without an index, the query complexity is approximately O(n), where n is the number of rows in the table. After adding the index, the lookup cost is reduced significantly and approaches O(log n).

---

## Should we add indexes on every column?

No, adding indexes on every column is not a good practice.

Although indexes improve read performance, they also:

- Increase storage usage.
- Slow down INSERT and UPDATE operations.
- Increase maintenance overhead.

Therefore, indexes should only be created on columns that are frequently used in filtering, sorting, and searching.

---

## Query to find all students who received placement notifications in the last 7 days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

# Stage 4

Currently, notifications are being fetched from the database every time a student loads a page. As the number of users increases, this can create a significant load on the database and increase response time.
To improve performance, I would use the following approaches:

## 1. Redis Caching

Instead of querying the database for every request, frequently accessed notifications can be stored in Redis cache.

### Advantages

- Reduces database load.
- Faster response times.
- Improves user experience.

### Tradeoffs

- Requires additional infrastructure.
- Cache invalidation needs to be handled carefully.

---

## 2. Pagination

Instead of loading all notifications at once, notifications should be fetched in smaller batches.

Example:

```http
GET /api/v1/notifications?page=1&limit=20
```

### Advantages

- Reduces database queries.
- Faster API responses.
- Lower memory usage.

### Tradeoffs

- Requires additional frontend handling for pagination.
---

## 3. Real-Time Notifications using WebSockets

Instead of repeatedly fetching notifications, the server can push new notifications to students using WebSockets.

### Advantages

- Eliminates unnecessary polling.
- Reduces database load.
- Provides real-time updates.

### Tradeoffs

- More complex implementation.
- Requires management of active connections.

---

## 4. Database Indexing and Read Replicas

Indexes can improve query performance, while read replicas can distribute read traffic across multiple database instances.

### Advantages

- Faster queries.
- Better scalability.
- Reduced load on the primary database.

### Tradeoffs

- Additional infrastructure cost.
- Replication lag can occur.

---

In my opinion, the best approach would be to combine Redis caching, pagination, WebSockets, and database optimization techniques to improve performance and reduce database load.