/**
 * Videoplex API client
 * Place at: apps/web/lib/api.ts
 *
 * Usage:
 *   import { api, setToken } from '@/lib/api'
 *   setToken(session.accessToken)           // after NextAuth login
 *   const { videos } = await api.videos.list()
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// ─── Token (SSR-safe: call setToken per-request in server components) ───────
let _token: string | null = null;
export const setToken  = (t: string | null) => { _token = t; };
export const getToken  = () => _token;
export const clearToken = () => { _token = null; };

// ─── Core fetch helper ───────────────────────────────────────────────────────
async function apiFetch<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  if (body)   headers['Content-Type']  = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `HTTP ${res.status}`);
  return data as T;
}

const GET    = <T>(path: string)              => apiFetch<T>('GET',    path);
const POST   = <T>(path: string, body?: unknown) => apiFetch<T>('POST',   path, body);
const PATCH  = <T>(path: string, body?: unknown) => apiFetch<T>('PATCH',  path, body);
const DELETE = <T>(path: string)              => apiFetch<T>('DELETE', path);

// ─── Types ───────────────────────────────────────────────────────────────────
export interface User {
  id: string; email: string; name?: string; role: string; createdAt: string;
  channel?: Channel;
}
export interface Channel {
  id: string; name: string; description?: string; logo?: string; banner?: string;
  ownerId: string; createdAt: string;
  videos?: Video[]; playlists?: Playlist[];
  _count?: { videos: number; playlists: number };
  owner?: { id: string; name?: string; email?: string };
}
export interface Video {
  id: string; title: string; description?: string; thumbnail?: string;
  duration?: number; status: 'PROCESSING' | 'READY' | 'FAILED';
  visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'; views: number;
  channelId: string; muxPlaybackId?: string; createdAt: string; updatedAt: string;
  channel?: { id: string; name: string; logo?: string; ownerId?: string };
}
export interface Playlist {
  id: string; name: string; description?: string; channelId: string;
  items?: PlaylistItem[];
  channel?: { id: string; name: string; logo?: string };
}
export interface PlaylistItem {
  id: string; playlistId: string; videoId: string; order: number; video?: Video;
}
export interface LiveStream {
  id: string; title: string; description?: string; status: string;
  streamKey: string; ingestUrl?: string; playbackId?: string; hlsUrl?: string;
  scheduledAt?: string; startedAt?: string; endedAt?: string; channelId: string;
  channel?: { id: string; name: string; logo?: string };
}
export interface PlaybackInfo {
  playbackId: string; hlsUrl: string; thumbnailUrl: string;
}

// ─── API surface ─────────────────────────────────────────────────────────────
export const api = {

  auth: {
    register:       (email: string, password: string, name?: string) =>
                      POST<{ user: User; token: string }>('/api/auth/register', { email, password, name }),
    login:          (email: string, password: string) =>
                      POST<{ user: User; token: string }>('/api/auth/login', { email, password }),
    me:             () => GET<{ user: User }>('/api/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
                      POST('/api/auth/change-password', { currentPassword, newPassword }),
  },

  channels: {
    list:   ()                              => GET<Channel[]>('/api/channels'),
    get:    (id: string)                    => GET<Channel>(`/api/channels/${id}`),
    me:     ()                              => GET<Channel>('/api/channels/me'),
    create: (name: string, description?: string) =>
              POST<Channel>('/api/channels', { name, description }),
    update: (data: Partial<Pick<Channel, 'name' | 'description' | 'logo' | 'banner'>>) =>
              PATCH<Channel>('/api/channels/me', data),
    delete: ()                              => DELETE('/api/channels/me'),
  },

  videos: {
    list: (params?: { q?: string; channelId?: string; limit?: number; cursor?: string }) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
      ).toString();
      return GET<{ videos: Video[]; nextCursor: string | null }>(`/api/videos${qs ? '?' + qs : ''}`);
    },
    get:          (id: string)       => GET<Video>(`/api/videos/${id}`),
    playback:     (id: string)       => GET<PlaybackInfo>(`/api/videos/${id}/playback`),
    getUploadUrl: ()                 => GET<{ url: string; uploadId: string }>('/api/videos/upload-url'),
    confirm:      (uploadId: string, title: string, description?: string, visibility?: string) =>
                    POST<Video>('/api/videos/confirm', { uploadId, title, description, visibility }),
    update:       (id: string, data: Partial<Pick<Video, 'title' | 'description' | 'visibility' | 'thumbnail'>>) =>
                    PATCH<Video>(`/api/videos/${id}`, data),
    delete:       (id: string)       => DELETE(`/api/videos/${id}`),

    /**
     * Full upload flow:
     *   1. Gets a Mux direct-upload URL from your backend
     *   2. PUTs the file to Mux via XHR (supports progress tracking)
     *   3. Confirms the upload with your backend to create the Video record
     */
    upload: async (
      file: File,
      title: string,
      description?: string,
      visibility = 'PUBLIC',
      onProgress?: (pct: number) => void,
    ): Promise<Video> => {
      const { url, uploadId } = await api.videos.getUploadUrl();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload  = () => (xhr.status < 300 ? resolve() : reject(new Error(`Mux upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(file);
      });

      return api.videos.confirm(uploadId, title, description, visibility);
    },
  },

  playlists: {
    get:         (id: string)                                          => GET<Playlist>(`/api/playlists/${id}`),
    create:      (name: string, description?: string)                  => POST<Playlist>('/api/playlists', { name, description }),
    update:      (id: string, data: { name?: string; description?: string }) =>
                   PATCH<Playlist>(`/api/playlists/${id}`, data),
    delete:      (id: string)                                          => DELETE(`/api/playlists/${id}`),
    addVideo:    (id: string, videoId: string)                         => POST<PlaylistItem>(`/api/playlists/${id}/videos`, { videoId }),
    removeVideo: (id: string, videoId: string)                         => DELETE(`/api/playlists/${id}/videos/${videoId}`),
    reorder:     (id: string, items: { id: string; order: number }[])  => PATCH<Playlist>(`/api/playlists/${id}/reorder`, { items }),
  },

  live: {
    list:   ()                                                                    => GET<LiveStream[]>('/api/live'),
    active: ()                                                                    => GET<LiveStream[]>('/api/live/active'),
    get:    (id: string)                                                           => GET<LiveStream>(`/api/live/${id}`),
    create: (title: string, description?: string, scheduledAt?: string)           => POST<LiveStream>('/api/live', { title, description, scheduledAt }),
    end:    (id: string)                                                           => POST(`/api/live/${id}/end`),
    delete: (id: string)                                                           => DELETE(`/api/live/${id}`),
  },

  admin: {
    stats:          ()                              => GET('/api/admin/stats'),
    users:          (q?: string)                    => GET(`/api/admin/users${q ? '?q=' + encodeURIComponent(q) : ''}`),
    setRole:        (id: string, role: string)      => PATCH(`/api/admin/users/${id}/role`, { role }),
    deleteUser:     (id: string)                    => DELETE(`/api/admin/users/${id}`),
    videos:         (status?: string)               => GET(`/api/admin/videos${status ? '?status=' + status : ''}`),
    setVisibility:  (id: string, visibility: string)=> PATCH(`/api/admin/videos/${id}/visibility`, { visibility }),
    deleteVideo:    (id: string)                    => DELETE(`/api/admin/videos/${id}`),
  },
};
