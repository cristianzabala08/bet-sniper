import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface BlogPost {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBlogPostDto {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author?: string;
  tags?: string[];
  isPublished?: boolean;
  sortOrder?: number;
}

@Injectable({ providedIn: 'root' })
export class BlogAdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  findAll(includeUnpublished = true): Observable<BlogPost[]> {
    return this.http.get<BlogPost[]>(`${this.apiUrl}/blog?includeUnpublished=${includeUnpublished}`);
  }

  findOne(id: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.apiUrl}/blog/${id}`);
  }

  create(data: CreateBlogPostDto): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${this.apiUrl}/blog`, data);
  }

  update(id: string, data: Partial<CreateBlogPostDto>): Observable<BlogPost> {
    return this.http.put<BlogPost>(`${this.apiUrl}/blog/${id}`, data);
  }

  delete(id: string): Observable<BlogPost> {
    return this.http.delete<BlogPost>(`${this.apiUrl}/blog/${id}`);
  }
}
