import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <--- 1. IMPORTAR ESTO

@NgModule({
  declarations: [ ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
  ]
})
export class CoreModule { }