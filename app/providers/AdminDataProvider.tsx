"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "../components/Toast";
import type {
  ActivityItem,
  BlockItem,
  CityStat,
  CommunityItem,
  CoupleItem,
  DashboardStats,
  PromptItem,
  UserItem,
  ReportItem,
  ChartDataPoint,
  ActivityLog,
} from "../lib/types";

export interface AddCommunityInput {
  name: string;
  description?: string;
  city: string;
  tags?: string[];
  coverImageUrl?: string;
  hostCoupleId?: string | null;
}

export interface UpdateCommunityInput {
  name?: string;
  description?: string;
  city?: string;
  tags?: string[];
  coverImageUrl?: string;
}

// Shape of the `/admin/data` response payload. Every field is optional so the
// UI can defend against a partial/garbled response without falling back to any.
interface AdminDataPayload {
  stats?: Partial<DashboardStats>;
  users?: UserItem[];
  couples?: CoupleItem[];
  communities?: CommunityItem[];
  activities?: ActivityItem[];
  prompts?: PromptItem[];
  reports?: ReportItem[];
  blocks?: BlockItem[];
  chartData?: ChartDataPoint[];
  userLogs?: ActivityLog[];
  communityLogs?: ActivityLog[];
  cityDistribution?: CityStat[];
}

interface AdminContextType {
  stats: DashboardStats;
  users: UserItem[];
  couples: CoupleItem[];
  communities: CommunityItem[];
  activities: ActivityItem[];
  prompts: PromptItem[];
  reports: ReportItem[];
  blocks: BlockItem[];
  chartData: ChartDataPoint[];
  cityDistribution: CityStat[];
  userLogs: ActivityLog[];
  communityLogs: ActivityLog[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  // Actions
  addPrompt: (title: string, category: string) => Promise<void>;
  togglePrompt: (id: string) => Promise<void>;
  editPrompt: (id: string, title: string) => Promise<void>;
  reorderPrompts: (ids: string[]) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  deleteCouple: (id: string) => Promise<void>;
  banCouple: (id: string, reason?: string) => Promise<void>;
  unbanCouple: (id: string) => Promise<void>;
  deleteCommunity: (id: string) => Promise<void>;
  addCommunity: (data: AddCommunityInput) => Promise<void>;
  updateCommunity: (id: string, data: UpdateCommunityInput) => Promise<void>;
  resolveReport: (id: string, status: 'resolved' | 'dismissed') => Promise<void>;
  adminUnblock: (blockerCoupleId: string, targetId: string) => Promise<void>;
  processJoinRequest: (
    communityId: string,
    requestId: string,
    decision: 'accept' | 'reject',
  ) => Promise<void>;
  sendNotification: (title: string, message: string, recipientIds?: string[]) => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCouples: 0,
    totalCommunities: 0,
    totalPrompts: 0,
    activeToday: 0,
  });
  const [users, setUsers] = useState<UserItem[]>([]);
  const [couples, setCouples] = useState<CoupleItem[]>([]);
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [userLogs, setUserLogs] = useState<ActivityLog[]>([]);
  const [communityLogs, setCommunityLogs] = useState<ActivityLog[]>([]);
  const [cityDistribution, setCityDistribution] = useState<CityStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1/admin";
  const toast = useToast();

  // Assign server data into state with defensive guards. A partial/garbled
  // payload (e.g. missing `stats` or a non-array `users`) must never blow up the
  // downstream `.map()`/`[0]` in the pages, so every field falls back to a safe
  // empty default.
  const applyData = useCallback((data: AdminDataPayload) => {
    setStats(
      data?.stats && typeof data.stats === "object"
        ? {
            totalUsers: data.stats.totalUsers ?? 0,
            totalCouples: data.stats.totalCouples ?? 0,
            totalCommunities: data.stats.totalCommunities ?? 0,
            totalPrompts: data.stats.totalPrompts ?? 0,
            activeToday: data.stats.activeToday ?? 0,
          }
        : { totalUsers: 0, totalCouples: 0, totalCommunities: 0, totalPrompts: 0, activeToday: 0 },
    );
    setUsers(Array.isArray(data?.users) ? data.users : []);
    setCouples(Array.isArray(data?.couples) ? data.couples : []);
    setCommunities(Array.isArray(data?.communities) ? data.communities : []);
    setActivities(Array.isArray(data?.activities) ? data.activities : []);
    setPrompts(Array.isArray(data?.prompts) ? data.prompts : []);
    setReports(Array.isArray(data?.reports) ? data.reports : []);
    setBlocks(Array.isArray(data?.blocks) ? data.blocks : []);
    setChartData(Array.isArray(data?.chartData) ? data.chartData : []);
    setUserLogs(Array.isArray(data?.userLogs) ? data.userLogs : []);
    setCommunityLogs(Array.isArray(data?.communityLogs) ? data.communityLogs : []);
    setCityDistribution(Array.isArray(data?.cityDistribution) ? data.cityDistribution : []);
  }, []);

  // Clear auth state, wipe stored token AND the mirrored cookie the Next
  // middleware reads. Called only on a real auth failure (401/403) or explicit
  // logout — NOT on transient 5xx/network errors (see fetchAllData).
  const forceLogout = useCallback(() => {
    localStorage.removeItem("admin_token");
    // Expire the middleware cookie immediately.
    document.cookie = "admin_token=; path=/; max-age=0; SameSite=Lax";
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  const fetchAllData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/data`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // Only a genuine auth failure should end the session.
      if (res.status === 401 || res.status === 403) {
        forceLogout();
        return;
      }

      // 5xx / other non-ok: the token may be perfectly valid — keep the admin
      // signed in and surface the error instead of bouncing them to /login.
      if (!res.ok) {
        setIsAuthenticated(true);
        toast("Couldn't load dashboard data (server error). Try refreshing.", "error");
        return;
      }

      const json = await res.json();
      if (json?.success && json.data) {
        setIsAuthenticated(true);
        applyData(json.data);
      } else {
        // Auth was fine but the shape is off — don't destroy the session.
        setIsAuthenticated(true);
        toast("Received an unexpected response from the server.", "error");
      }
    } catch (err) {
      // Network blip — keep the session so a dropped connection doesn't log the
      // admin out; the page's Refresh action can retry.
      console.error("Failed to fetch admin data:", err);
      setIsAuthenticated(true);
      toast("Network error loading data. Check your connection and refresh.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, forceLogout, applyData, toast]);

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      // Keep the middleware cookie in sync with the stored token, then validate
      // with the server before rendering protected content.
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `admin_token=${savedToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
      setToken(savedToken);
      fetchAllData(savedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchAllData]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const json = await res.json();
      if (json?.success && json.data?.token) {
        const authToken = json.data.token;
        localStorage.setItem("admin_token", authToken);
        // Mirror the token into a cookie so the Next middleware can gate routes.
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `admin_token=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
        setToken(authToken);
        // Validate + load BEFORE reporting success so the caller doesn't navigate
        // to the dashboard only to be bounced by a failing initial fetch.
        await fetchAllData(authToken);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Login Error:", err);
      return false;
    }
  };

  const logout = () => {
    forceLogout();
    setUsers([]);
    setCouples([]);
    setCommunities([]);
    setPrompts([]);
    setReports([]);
    setBlocks([]);
    setActivities([]);
    setChartData([]);
    setUserLogs([]);
    setCommunityLogs([]);
    setCityDistribution([]);
  };

  const addPrompt = async (title: string, category: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category }),
      });
      if (res.ok) { toast("Prompt added successfully.", "success"); silentRefresh(token); }
      else toast("Failed to add prompt.", "error");
    } catch (err) {
      console.error("Add Prompt Error:", err);
      toast("Failed to add prompt.", "error");
    }
  };

  const togglePrompt = async (id: string) => {
    if (!token) return;
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
    try {
      const res = await fetch(`${API_URL}/prompts/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
        toast("Failed to update prompt.", "error");
      }
    } catch (err) {
      console.error("Toggle Prompt Error:", err);
      setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
      toast("Failed to update prompt.", "error");
    }
  };

  const deletePrompt = async (id: string) => {
    if (!token) return;
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    try {
      const res = await fetch(`${API_URL}/prompts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) toast("Prompt deleted.", "success");
      else { silentRefresh(token); toast("Failed to delete prompt.", "error"); }
    } catch (err) {
      console.error("Delete Prompt Error:", err);
      silentRefresh(token);
      toast("Failed to delete prompt.", "error");
    }
  };

  const editPrompt = async (id: string, title: string) => {
    if (!token) return;
    const prev = prompts.find((p) => p.id === id)?.title ?? "";
    setPrompts((ps) => ps.map((p) => (p.id === id ? { ...p, title } : p)));
    try {
      const res = await fetch(`${API_URL}/prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title }),
      });
      if (res.ok) toast("Prompt updated.", "success");
      else {
        setPrompts((ps) => ps.map((p) => (p.id === id ? { ...p, title: prev } : p)));
        toast("Failed to update prompt.", "error");
      }
    } catch (err) {
      console.error("Edit Prompt Error:", err);
      setPrompts((ps) => ps.map((p) => (p.id === id ? { ...p, title: prev } : p)));
      toast("Failed to update prompt.", "error");
    }
  };

  const reorderPrompts = async (ids: string[]) => {
    if (!token) return;
    // Optimistic: update sortOrder locally
    setPrompts((ps) => {
      const ordered = [...ps].sort((a, b) => {
        const ai = ids.indexOf(a.id);
        const bi = ids.indexOf(b.id);
        // items not in ids array stay at the end
        return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
      });
      return ordered.map((p, i) => ({ ...p, sortOrder: i }));
    });
    try {
      const res = await fetch(`${API_URL}/prompts/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) { silentRefresh(token); toast("Failed to reorder prompts.", "error"); }
    } catch (err) {
      console.error("Reorder Prompts Error:", err);
      silentRefresh(token);
    }
  };

  const deleteUser = async (id: string) => {
    if (!token) return;
    const removedUser = users.find((u) => u.id === id);
    if (removedUser?.coupleId) {
      // The server deletes a paired user by wiping the WHOLE couple + BOTH
      // partners (admin.controller.deleteUser → deleteCouple), so mirror that
      // locally: drop the couple AND every user pointing at it. Otherwise the
      // partner row lingers referencing a now-deleted couple.
      const goneCoupleId = removedUser.coupleId;
      setUsers((prev) => prev.filter((u) => u.id !== id && u.coupleId !== goneCoupleId));
      setCouples((prev) => prev.filter((c) => c.id !== goneCoupleId));
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) toast(`User deleted successfully.`, "success");
      else { silentRefresh(token); toast("Failed to delete user.", "error"); }
    } catch (err) {
      console.error("Delete User Error:", err);
      silentRefresh(token);
      toast("Failed to delete user.", "error");
    }
  };

  const deleteCouple = async (id: string) => {
    if (!token) return;
    setCouples((prev) => prev.filter((c) => c.id !== id));
    setUsers((prev) => prev.filter((u) => u.coupleId !== id));
    try {
      const res = await fetch(`${API_URL}/couples/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) toast("Couple and all associated data deleted.", "success");
      else { silentRefresh(token); toast("Failed to delete couple.", "error"); }
    } catch (err) {
      console.error("Delete Couple Error:", err);
      silentRefresh(token);
      toast("Failed to delete couple.", "error");
    }
  };

  const banCouple = async (id: string, reason?: string) => {
    if (!token) return;
    const now = new Date().toISOString();
    setCouples((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "banned", bannedAt: now, banReason: reason || null } : c
      )
    );
    setUsers((prev) =>
      prev.map((u) =>
        u.coupleId === id ? { ...u, status: "banned", bannedAt: now } : u
      )
    );
    try {
      const res = await fetch(`${API_URL}/couples/${id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: reason || null }),
      });
      if (res.ok) toast("Couple banned. Both partners are now blocked.", "success");
      else { silentRefresh(token); toast("Failed to ban couple.", "error"); }
    } catch (err) {
      console.error("Ban Couple Error:", err);
      silentRefresh(token);
      toast("Failed to ban couple.", "error");
    }
  };

  const unbanCouple = async (id: string) => {
    if (!token) return;
    setCouples((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "engaged" as const, bannedAt: null, banReason: null } : c
      )
    );
    setUsers((prev) =>
      prev.map((u) =>
        u.coupleId === id ? { ...u, status: "active" as const, bannedAt: null } : u
      )
    );
    try {
      const res = await fetch(`${API_URL}/couples/${id}/unban`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) toast("Couple unbanned. Access restored.", "success");
      else { silentRefresh(token); toast("Failed to unban couple.", "error"); }
    } catch (err) {
      console.error("Unban Couple Error:", err);
      silentRefresh(token);
      toast("Failed to unban couple.", "error");
    }
  };

  const processJoinRequest = async (
    communityId: string,
    requestId: string,
    decision: 'accept' | 'reject',
  ) => {
    if (!token) return;
    try {
      const res = await fetch(
        `${API_URL}/communities/${communityId}/requests/${requestId}/${decision}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) { toast(`Join request ${decision}ed.`, "success"); silentRefresh(token); }
      else toast("Failed to process join request.", "error");
    } catch (err) {
      console.error("Process Join Request Error:", err);
      toast("Failed to process join request.", "error");
    }
  };

  const deleteCommunity = async (id: string) => {
    if (!token) return;
    setCommunities((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetch(`${API_URL}/communities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) toast("Community deleted.", "success");
      else { silentRefresh(token); toast("Failed to delete community.", "error"); }
    } catch (err) {
      console.error("Delete Community Error:", err);
      silentRefresh(token);
      toast("Failed to delete community.", "error");
    }
  };

  const updateCommunity = async (id: string, data: UpdateCommunityInput) => {
    if (!token) return;
    setCommunities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    try {
      const res = await fetch(`${API_URL}/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (res.ok) toast("Community updated.", "success");
      else { silentRefresh(token); toast("Failed to update community.", "error"); }
    } catch (err) {
      console.error("Update Community Error:", err);
      silentRefresh(token);
      toast("Failed to update community.", "error");
    }
  };

  const adminUnblock = async (blockerCoupleId: string, targetId: string) => {
    if (!token) return;
    setBlocks((prev) =>
      prev.filter(
        (b) => !(b.blockerCoupleId === blockerCoupleId && b.targetId === targetId)
      )
    );
    try {
      const res = await fetch(`${API_URL}/blocks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blockerCoupleId, targetId }),
      });
      if (res.ok) toast("Block removed successfully.", "success");
      else { silentRefresh(token); toast("Failed to remove block.", "error"); }
    } catch (err) {
      console.error("Admin Unblock Error:", err);
      silentRefresh(token);
      toast("Failed to remove block.", "error");
    }
  };

  const resolveReport = async (id: string, status: 'resolved' | 'dismissed') => {
    if (!token) return;
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    try {
      const res = await fetch(`${API_URL}/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) toast(`Report marked as ${status}.`, "success");
      else { silentRefresh(token); toast("Failed to resolve report.", "error"); }
    } catch (err) {
      console.error("Resolve Report Error:", err);
      silentRefresh(token);
      toast("Failed to resolve report.", "error");
    }
  };

  const addCommunity = async (data: AddCommunityInput) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (res.ok) { toast("Community created successfully.", "success"); silentRefresh(token); }
      else toast("Failed to create community.", "error");
    } catch (err) {
      console.error("Add Community Error:", err);
      toast("Failed to create community.", "error");
    }
  };

  // Silent refresh — fetches fresh data in the background without touching
  // isLoading, so the page never blanks out.
  const silentRefresh = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/data`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json?.success && json.data) {
        applyData(json.data);
      }
    } catch { /* silent */ }
  }, [API_URL, applyData]);

  const refresh = useCallback(async () => {
    if (!token) return;
    await silentRefresh(token);
  }, [token, silentRefresh]);

  const sendNotification = async (title: string, message: string, recipientIds?: string[]) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message, recipientIds }),
      });
      if (!res.ok) throw new Error("Failed to send notification");
    } catch (err) {
      console.error("Send Notification Error:", err);
      throw err;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        stats,
        users,
        couples,
        communities,
        activities,
        prompts,
        reports,
        blocks,
        chartData,
        cityDistribution,
        userLogs,
        communityLogs,
        isLoading,
        isAuthenticated,
        login,
        logout,
        addPrompt,
        togglePrompt,
        editPrompt,
        reorderPrompts,
        deletePrompt,
        deleteUser,
        deleteCouple,
        banCouple,
        unbanCouple,
        deleteCommunity,
        addCommunity,
        updateCommunity,
        resolveReport,
        adminUnblock,
        processJoinRequest,
        sendNotification,
        refresh,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return context;
}
