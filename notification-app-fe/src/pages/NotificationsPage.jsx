import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  Pagination,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
  Divider
} from "@mui/material";

import { Log } from "../logger/logger";

const BASE_URL =
  "http://4.224.186.213/evaluation-service/notifications";

const TYPES = ["Event", "Result", "Placement"];

const WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1
};

function calculatePriority(n) {
  const weight = WEIGHTS[n.Type] || 0;
  const time = new Date(n.Timestamp).getTime() || 0;
  return weight * 1e12 + time;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [priorityMode, setPriorityMode] = useState(false);

  const limit = 10;

  const getViewed = () =>
    JSON.parse(localStorage.getItem("viewed") || "[]");

  const markViewed = (id) => {
    const viewed = getViewed();
    if (!viewed.includes(id)) {
      viewed.push(id);
      localStorage.setItem("viewed", JSON.stringify(viewed));
    }
  };

  const fetchData = async () => {
    try {
      await Log("info", "Fetching notifications");

      let url = `${BASE_URL}?page=${page}&limit=${limit}`;

      if (type) url += `&notification_type=${type}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_TOKEN}`
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();

      setNotifications(data.notifications || []);

      await Log("info", "Fetched notifications successfully");
    } catch (err) {
      await Log("error", err.message);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, type]);

  const processedNotifications = useMemo(() => {
    let list = [...notifications];

    if (priorityMode) {
      list = list
        .map((n) => ({
          ...n,
          priority: calculatePriority(n)
        }))
        .sort((a, b) => b.priority - a.priority);
    }

    return list;
  }, [notifications, priorityMode]);

  return (
    <Box sx={{ padding: 3, maxWidth: 900, margin: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Notifications Dashboard
      </Typography>

      {/* CONTROLS */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>

        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          displayEmpty
          size="small"
        >
          <MenuItem value="">All Types</MenuItem>
          {TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>

        <FormControlLabel
          control={
            <Switch
              checked={priorityMode}
              onChange={(e) => setPriorityMode(e.target.checked)}
            />
          }
          label="Priority Mode"
        />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* LIST */}
      <Stack spacing={2}>
        {processedNotifications.map((n) => {
          const viewed = getViewed().includes(n.ID);

          return (
            <Card
              key={n.ID}
              onClick={() => markViewed(n.ID)}
              sx={{
                cursor: "pointer",
                backgroundColor: viewed ? "#f5f5f5" : "#fff",
                borderLeft: viewed
                  ? "4px solid gray"
                  : "4px solid #1976d2",
                transition: "0.2s"
              }}
            >
              <CardContent>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">
                    {n.Type}
                  </Typography>

                  {viewed && (
                    <Chip label="Viewed" size="small" />
                  )}

                  {priorityMode && (
                    <Chip
                      label={`Priority ${calculatePriority(n)}`}
                      size="small"
                      color="primary"
                    />
                  )}
                </Stack>

                <Typography variant="body1">
                  {n.Message}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {n.Timestamp}
                </Typography>

              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* PAGINATION (disabled in priority mode for simplicity) */}
      {!priorityMode && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={10}
            page={page}
            onChange={(e, value) => setPage(value)}
          />
        </Box>
      )}
    </Box>
  );
}