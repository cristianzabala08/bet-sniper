import { Component, OnInit, inject, TemplateRef, ViewChild } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { BlogAdminService, BlogPost, CreateBlogPostDto } from 'src/app/services/blog.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './blog-admin.component.html',
  styleUrls: ['./blog-admin.component.scss']
})
export class BlogAdminComponent implements OnInit {
  private blogService = inject(BlogAdminService);
  private modalService = inject(NgbModal);

  posts: BlogPost[] = [];
  loading = false;

  postForm: CreateBlogPostDto = this.getEmptyForm();
  editingPostId: string | null = null;
  tagInput = '';

  modalRef: NgbModalRef | null = null;
  selectedPost: BlogPost | null = null;

  @ViewChild('postModal') postModal!: TemplateRef<any>;
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;

  ngOnInit() {
    this.loadPosts();
  }

  getEmptyForm(): CreateBlogPostDto {
    return {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      coverImage: '',
      author: '',
      tags: [],
      isPublished: false,
      sortOrder: 0
    };
  }

  loadPosts() {
    this.loading = true;
    this.blogService.findAll().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  generateSlug() {
    if (this.postForm.title) {
      this.postForm.slug = this.postForm.title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  addTag() {
    const tag = this.tagInput.trim();
    if (tag && this.postForm.tags && !this.postForm.tags.includes(tag)) {
      this.postForm.tags.push(tag);
      this.tagInput = '';
    }
  }

  removeTag(index: number) {
    if (this.postForm.tags) {
      this.postForm.tags.splice(index, 1);
    }
  }

  openCreateModal() {
    this.editingPostId = null;
    this.postForm = this.getEmptyForm();
    this.tagInput = '';
    this.modalRef = this.modalService.open(this.postModal, { size: 'lg', centered: true });
  }

  openEditModal(post: BlogPost) {
    this.editingPostId = post._id || null;
    this.postForm = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || '',
      author: post.author || '',
      tags: [...(post.tags || [])],
      isPublished: post.isPublished,
      sortOrder: post.sortOrder
    };
    this.tagInput = '';
    this.modalRef = this.modalService.open(this.postModal, { size: 'lg', centered: true });
  }

  savePost() {
    if (!this.postForm.title || !this.postForm.slug || !this.postForm.excerpt || !this.postForm.content) {
      alert('Por favor complete los campos requeridos (título, slug, resumen, contenido)');
      return;
    }

    if (this.editingPostId) {
      this.blogService.update(this.editingPostId, this.postForm).subscribe({
        next: () => { this.loadPosts(); this.closeModal(); },
        error: (err) => { alert(err.error?.message || 'Error al actualizar el post'); }
      });
    } else {
      this.blogService.create(this.postForm).subscribe({
        next: () => { this.loadPosts(); this.closeModal(); },
        error: (err) => { alert(err.error?.message || 'Error al crear el post'); }
      });
    }
  }

  openDeleteModal(post: BlogPost) {
    this.selectedPost = post;
    this.modalRef = this.modalService.open(this.deleteModal, { centered: true });
  }

  confirmDelete() {
    if (!this.selectedPost || !this.selectedPost._id) return;
    this.blogService.delete(this.selectedPost._id).subscribe({
      next: () => { this.loadPosts(); this.closeModal(); },
      error: (err) => { alert(err.error?.message || 'Error al eliminar el post'); }
    });
  }

  togglePublish(post: BlogPost) {
    if (!post._id) return;
    this.blogService.update(post._id, { isPublished: !post.isPublished } as any).subscribe({
      next: () => { post.isPublished = !post.isPublished; },
      error: (err) => { console.error('Error toggling publish', err); }
    });
  }

  closeModal() {
    if (this.modalRef) { this.modalRef.close(); this.modalRef = null; }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
