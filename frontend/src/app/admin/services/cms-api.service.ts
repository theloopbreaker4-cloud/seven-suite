import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../config/api.config';

export type I18nField = Record<string, string>;

export interface CmsPage {
  _id: string;
  id?: number;
  slug: string;
  title: I18nField;
  content: I18nField;
  metaDesc: I18nField;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPost {
  _id: string;
  id?: number;
  slug: string;
  title: I18nField;
  excerpt: I18nField;
  content: I18nField;
  coverImage: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CmsMedia {
  _id:          string;
  filename:     string;
  originalName: string;
  url:          string;
  mimeType:     string;
  size:         number;
  createdAt:    string;
}

export interface CmsCategory {
  _id:         string;
  slug:        string;
  name:        I18nField;
  description: I18nField;
  type:        'post' | 'page';
  createdAt:   string;
}

export interface CmsTag {
  _id:       string;
  slug:      string;
  name:      I18nField;
  createdAt: string;
}

export interface CmsComment {
  _id:         string;
  postId:      string;
  authorName:  string;
  authorEmail: string;
  body:        string;
  isApproved:  boolean;
  createdAt:   string;
}

export interface CmsMenuItem {
  label:     string;
  url:       string;
  target:    '_self' | '_blank';
  sortOrder: number;
}

export interface CmsMenu {
  _id:       string;
  handle:    string;
  name:      string;
  items:     CmsMenuItem[];
  createdAt: string;
}

export interface CmsSocialLink {
  _id:       string;
  platform:  string;
  url:       string;
  label:     string;
  sortOrder: number;
  isActive:  boolean;
  createdAt: string;
}

export interface CmsSlide {
  _id:        string;
  title:      I18nField;
  subtitle:   I18nField;
  buttonText: I18nField;
  buttonUrl:  string;
  image:      string;
  overlay:    'none' | 'dark' | 'light';
  sortOrder:  number;
  isActive:   boolean;
  createdAt:  string;
}

export interface CmsUser {
  _id: string;
  id?: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  avatar: string;
  mobile: string;
  country: string;
  role: 'user' | 'admin';
  isActive: boolean;
  provider: string;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CmsApiService {
  constructor(private http: HttpClient) {}

  // Pages (admin — all including drafts)
  getPages(): Observable<{ items: CmsPage[]; total: number }> {
    return this.http.get<{ items: CmsPage[]; total: number }>(`${API_ENDPOINTS.cms.pages}/all?limit=100`);
  }
  getPage(id: string): Observable<CmsPage> {
    return this.http.get<CmsPage>(`${API_ENDPOINTS.cms.pages}/${id}`);
  }
  createPage(data: Partial<CmsPage>): Observable<CmsPage> {
    return this.http.post<CmsPage>(API_ENDPOINTS.cms.pages, data);
  }
  updatePage(id: string, data: Partial<CmsPage>): Observable<CmsPage> {
    return this.http.put<CmsPage>(`${API_ENDPOINTS.cms.pages}/${id}`, data);
  }
  deletePage(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.pages}/${id}`);
  }

  // Posts (admin — all including drafts)
  getPosts(limit = 50, offset = 0): Observable<{ items: CmsPost[]; total: number }> {
    return this.http.get<{ items: CmsPost[]; total: number }>(`${API_ENDPOINTS.cms.posts}/all?limit=${limit}&offset=${offset}`);
  }
  getPost(id: string): Observable<CmsPost> {
    return this.http.get<CmsPost>(`${API_ENDPOINTS.cms.posts}/${id}`);
  }
  createPost(data: Partial<CmsPost>): Observable<CmsPost> {
    return this.http.post<CmsPost>(API_ENDPOINTS.cms.posts, data);
  }
  updatePost(id: string, data: Partial<CmsPost>): Observable<CmsPost> {
    return this.http.put<CmsPost>(`${API_ENDPOINTS.cms.posts}/${id}`, data);
  }
  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.posts}/${id}`);
  }

  // Categories
  getCategories(type?: string): Observable<CmsCategory[]> {
    const q = type ? `?type=${type}` : '';
    return this.http.get<CmsCategory[]>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/categories')}${q}`);
  }
  createCategory(data: Partial<CmsCategory>): Observable<CmsCategory> {
    return this.http.post<CmsCategory>(API_ENDPOINTS.cms.pages.replace('/pages', '/categories'), data);
  }
  updateCategory(id: string, data: Partial<CmsCategory>): Observable<CmsCategory> {
    return this.http.put<CmsCategory>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/categories')}/${id}`, data);
  }
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/categories')}/${id}`);
  }

  // Tags
  getTags(): Observable<CmsTag[]> {
    return this.http.get<CmsTag[]>(API_ENDPOINTS.cms.pages.replace('/pages', '/tags'));
  }
  createTag(data: Partial<CmsTag>): Observable<CmsTag> {
    return this.http.post<CmsTag>(API_ENDPOINTS.cms.pages.replace('/pages', '/tags'), data);
  }
  updateTag(id: string, data: Partial<CmsTag>): Observable<CmsTag> {
    return this.http.put<CmsTag>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/tags')}/${id}`, data);
  }
  deleteTag(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/tags')}/${id}`);
  }

  // Comments (admin)
  getComments(): Observable<CmsComment[]> {
    return this.http.get<CmsComment[]>(API_ENDPOINTS.cms.pages.replace('/pages', '/comments'));
  }
  approveComment(id: string): Observable<CmsComment> {
    return this.http.put<CmsComment>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/comments')}/${id}/approve`, {});
  }
  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/comments')}/${id}`);
  }

  // Menus
  getMenus(): Observable<CmsMenu[]> {
    return this.http.get<CmsMenu[]>(API_ENDPOINTS.cms.pages.replace('/pages', '/menus'));
  }
  createMenu(data: Partial<CmsMenu>): Observable<CmsMenu> {
    return this.http.post<CmsMenu>(API_ENDPOINTS.cms.pages.replace('/pages', '/menus'), data);
  }
  updateMenu(id: string, data: Partial<CmsMenu>): Observable<CmsMenu> {
    return this.http.put<CmsMenu>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/menus')}/${id}`, data);
  }
  deleteMenu(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/menus')}/${id}`);
  }

  // Social Links
  getSocialLinks(): Observable<CmsSocialLink[]> {
    return this.http.get<CmsSocialLink[]>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/social')}?all=true`);
  }
  createSocialLink(data: Partial<CmsSocialLink>): Observable<CmsSocialLink> {
    return this.http.post<CmsSocialLink>(API_ENDPOINTS.cms.pages.replace('/pages', '/social'), data);
  }
  updateSocialLink(id: string, data: Partial<CmsSocialLink>): Observable<CmsSocialLink> {
    return this.http.put<CmsSocialLink>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/social')}/${id}`, data);
  }
  deleteSocialLink(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/social')}/${id}`);
  }

  // Slider
  getSlides(): Observable<CmsSlide[]> {
    return this.http.get<CmsSlide[]>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/slider')}?all=true`);
  }
  createSlide(data: Partial<CmsSlide>): Observable<CmsSlide> {
    return this.http.post<CmsSlide>(API_ENDPOINTS.cms.pages.replace('/pages', '/slider'), data);
  }
  updateSlide(id: string, data: Partial<CmsSlide>): Observable<CmsSlide> {
    return this.http.put<CmsSlide>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/slider')}/${id}`, data);
  }
  reorderSlides(order: Array<{ id: string; sortOrder: number }>): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/slider')}/reorder`, { order });
  }
  deleteSlide(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.pages.replace('/pages', '/slider')}/${id}`);
  }

  // Media
  private mediaUrl(): string {
    return API_ENDPOINTS.cms.pages.replace('/pages', '/media');
  }
  getMedia(): Observable<CmsMedia[]> {
    return this.http.get<CmsMedia[]>(this.mediaUrl());
  }
  uploadMedia(file: File): Observable<CmsMedia> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<CmsMedia>(this.mediaUrl(), fd);
  }
  deleteMedia(id: string): Observable<void> {
    return this.http.delete<void>(`${this.mediaUrl()}/${id}`);
  }

  // Users (admin)
  getUsers(): Observable<CmsUser[]> {
    return this.http.get<CmsUser[]>(API_ENDPOINTS.cms.users);
  }
  getUser(id: string): Observable<CmsUser> {
    return this.http.get<CmsUser>(`${API_ENDPOINTS.cms.users}/${id}`);
  }
  updateUser(id: string, data: Partial<CmsUser>): Observable<CmsUser> {
    return this.http.put<CmsUser>(`${API_ENDPOINTS.cms.users}/${id}`, data);
  }
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cms.users}/${id}`);
  }
}
