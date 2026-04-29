# Feature Modules

This directory contains feature modules for the application.

## What are Feature Modules?

Feature modules are Angular modules that organize code related to a specific feature or functionality. They help:
- Keep the application organized
- Enable lazy loading for better performance
- Encapsulate feature-specific code
- Make code more maintainable

## Module Structure

Each feature module typically contains:
- Components
- Services (feature-specific)
- Models/Interfaces
- Routing configuration
- Module definition

## Example Structure

```
modules/
├── admin/
│   ├── components/
│   │   ├── admin-dashboard/
│   │   └── user-management/
│   ├── services/
│   │   └── admin.service.ts
│   ├── admin-routing.module.ts
│   └── admin.module.ts
├── products/
│   ├── components/
│   │   ├── product-list/
│   │   └── product-detail/
│   ├── services/
│   │   └── product.service.ts
│   ├── products-routing.module.ts
│   └── products.module.ts
└── README.md
```

## Creating a New Feature Module

### Using Angular CLI:

```bash
# Generate a new module with routing
ng generate module modules/feature-name --routing

# Generate components inside the module
ng generate component modules/feature-name/components/component-name
```

### Manual Creation:

1. Create module directory: `modules/feature-name/`
2. Create routing file: `feature-name-routing.module.ts`
3. Create module file: `feature-name.module.ts`
4. Create components directory: `components/`
5. Add feature components

## Lazy Loading

Feature modules can be lazy-loaded to improve initial load time:

### In app-routing.module.ts:

```typescript
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'products',
    loadChildren: () => import('./modules/products/products.module').then(m => m.ProductsModule)
  }
];
```

### In feature-routing.module.ts:

```typescript
const routes: Routes = [
  {
    path: '',
    component: FeatureLayoutComponent,
    children: [
      { path: '', component: FeatureListComponent },
      { path: ':id', component: FeatureDetailComponent }
    ]
  }
];
```

## Best Practices

1. **One Feature Per Module**: Each module should focus on a single feature
2. **Lazy Load Large Features**: Use lazy loading for features that aren't needed immediately
3. **Shared Code**: Put shared components/services in a shared module
4. **Consistent Naming**: Use consistent naming conventions (e.g., `feature-name.module.ts`)
5. **Routing**: Always include routing configuration for feature modules
6. **Encapsulation**: Keep feature-specific code within the module

## Example: Admin Module

```typescript
// admin.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    UserManagementComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
```

```typescript
// admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [
      { path: 'users', component: UserManagementComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
```

## When to Create a Feature Module

Create a feature module when:
- The feature is large and complex
- The feature is only used by certain users (e.g., admin panel)
- You want to lazy load the feature
- The feature has multiple related components
- You want to better organize your code

## When NOT to Create a Feature Module

Don't create a feature module when:
- The feature is very small (1-2 components)
- The feature is used everywhere in the app
- The components are better suited for a shared module
