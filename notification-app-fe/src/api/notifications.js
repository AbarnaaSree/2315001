const BASE_URL =
  "http://4.224.186.213/evaluation-service/notifications";

export async function fetchNotifications({
  page = 1,
  limit = 10,
  type
}) {
  let url = `${BASE_URL}?page=${page}&limit=${limit}`;

  if (type) {
    url += `&notification_type=${type}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.REACT_APP_TOKEN}`
    }
  });

  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return res.json();
}