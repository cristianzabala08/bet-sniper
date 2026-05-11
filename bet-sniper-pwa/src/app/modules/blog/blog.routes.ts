import { Routes } from '@angular/router';
import { BlogListComponent } from './pages/blog-list/blog-list.component';
import { BlogDetailComponent } from './pages/blog-detail/blog-detail.component';

export const blogRoutes: Routes = [
  { path: '', component: BlogListComponent },
  { path: ':slug', component: BlogDetailComponent }
];
