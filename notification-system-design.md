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

# Stage 5

The proposed implementation is:

function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)


## What are the problems with this implementation?

I think this implementation has a few issues:

- It processes one student at a time, which will be very slow for 50,000 students.
- If the email service fails, some students may not receive notifications.
- There is no retry mechanism for failed notifications.
- Email sending, database saving, and push notifications are all dependent on each other.
- The system may become very slow during peak usage.

---

## What if `send_email()` fails for 200 students?

If the email service fails for 200 students, those students will not receive the notification. Therefore, failed requests should be stored and retried later instead of stopping the entire process.


## How would I redesign this?

Instead of processing notifications one by one, I would process them asynchronously using a queue.

The flow would be:
1.HR/Admin
2.Notification API
3.Queue
4.Workers
5.Database + Email + Push Notification

This allows multiple notifications to be processed at the same time, which improves performance and reliability.

## Should saving to the database and sending emails happen together?

No.
I would first save the notification to the database to make sure that the notification is not lost. After saving it, I would send emails and push notifications separately. This way, even if the email service fails, the notification information will still be available in the database.

## Revised Pseudocode


```
notify_all(student_ids, message)

    for each student_id in student_ids

        save_notification(student_id, message)

        add_notification_to_queue(student_id, message)


process_notifications()

    while queue is not empty

        notification = get_next_notification()

        try

            send_email(
                notification.student_id,
                notification.message
            )

            send_push_notification(
                notification.student_id,
                notification.message
            )

        catch error

            retry_notification(notification)
```


## Advantages

- Faster processing.
- Better performance.
- Supports retrying failed notifications.
- More reliable.
- Can handle a large number of students.

# Stage 6

To implement the Priority Inbox feature, I assigned different weights to different notification types.

- Placement = 3
- Result = 2
- Event = 1

The final priority is determined using both notification type and notification recency. Notifications with higher weight are prioritized first, and among notifications with the same weight, the most recent notification receives higher priority.

To calculate the top notifications, I first calculate a priority score for every notification and then sort the notifications in descending order of priority. Finally, I display the top 10 notifications.

If new notifications continue to arrive, I would maintain the top 10 efficiently using a min-heap of fixed size 10. This avoids repeatedly sorting all notifications and provides better performance.