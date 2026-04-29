# Pipes

This directory contains custom Angular pipes for data transformation.

## Directory Structure

- **formatting/** - Pipes for formatting data (dates, file sizes, truncation, etc.)
- **filtering/** - Pipes for filtering and sorting arrays

## Formatting Pipes

### DateAgoPipe
Transforms dates into human-readable "time ago" format.

```typescript
{{ someDate | dateAgo }}           // "2 minutes ago"
{{ someDate | dateAgo:true }}      // "2m ago" (short format)
```

### FileSizePipe
Transforms bytes into human-readable file sizes.

```typescript
{{ 1024 | fileSize }}              // "1 KB"
{{ 1536 | fileSize:2 }}            // "1.50 KB"
{{ 1048576 | fileSize }}           // "1 MB"
```

### TruncatePipe
Truncates strings to a specified length.

```typescript
{{ longText | truncate:10 }}                    // "This is a..."
{{ longText | truncate:10:'[...]' }}            // "This is a[...]"
```

### SafeHtmlPipe
Sanitizes and marks HTML content as safe for rendering.

```typescript
<div [innerHTML]="htmlContent | safeHtml"></div>
```

**WARNING**: Only use with trusted HTML to avoid XSS attacks!

## Filtering Pipes

### FilterPipe
Filters arrays by search term across specified properties.

```typescript
// In component:
users = [
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
];

// In template:
{{ users | filter:'john':['name', 'email'] }}
// Returns: [{ name: 'John', email: 'john@example.com' }]
```

### SortPipe
Sorts arrays by a specified property.

```typescript
{{ users | sort:'name' }}              // Ascending
{{ users | sort:'name':'desc' }}       // Descending
{{ users | sort:'age':'asc' }}         // Ascending (explicit)
```

### UniquePipe
Filters arrays to contain only unique values.

```typescript
{{ [1, 2, 2, 3, 3, 4] | unique }}      // [1, 2, 3, 4]
{{ users | unique:'email' }}           // Users with unique emails
```

## Usage

### Import in Component (Standalone)

```typescript
import { DateAgoPipe, FileSizePipe } from '@app/pipes/formatting';
import { FilterPipe, SortPipe } from '@app/pipes/filtering';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [DateAgoPipe, FileSizePipe, FilterPipe, SortPipe],
  templateUrl: './example.component.html'
})
export class ExampleComponent { }
```

### Import in Module (Non-Standalone)

```typescript
import { DateAgoPipe, FileSizePipe } from '@app/pipes/formatting';
import { FilterPipe, SortPipe } from '@app/pipes/filtering';

@NgModule({
  declarations: [ExampleComponent],
  imports: [
    CommonModule,
    DateAgoPipe,
    FileSizePipe,
    FilterPipe,
    SortPipe
  ]
})
export class ExampleModule { }
```

## Best Practices

1. **Pure Pipes**: Keep pipes pure (no side effects) for better performance
2. **Performance**: Avoid using filtering/sorting pipes with `*ngFor` on large arrays
   - Use component methods or RxJS operators instead
3. **Standalone**: All new pipes should be standalone
4. **Naming**: Use descriptive names ending with "Pipe"
5. **Documentation**: Add JSDoc comments with usage examples

## Performance Notes

### Filtering Pipes and Change Detection

Filtering pipes (filter, sort, unique) are impure by default in this implementation, which means they run on every change detection cycle. For large arrays, consider these alternatives:

**Option 1: Filter in Component**
```typescript
get filteredUsers() {
  return this.users.filter(user =>
    user.name.includes(this.searchTerm)
  );
}
```

**Option 2: Use RxJS**
```typescript
filteredUsers$ = combineLatest([
  this.users$,
  this.searchTerm$
]).pipe(
  map(([users, term]) =>
    users.filter(user => user.name.includes(term))
  )
);
```

## Creating New Pipes

```bash
# Generate a new pipe
ng generate pipe pipes/category/pipe-name --standalone

# Example
ng generate pipe pipes/formatting/currency-format --standalone
```

## Examples

### Combining Multiple Pipes

```typescript
{{ users | filter:searchTerm:['name','email'] | sort:'name' | unique:'id' }}
```

### Using with Async Pipe

```typescript
{{ (users$ | async) | filter:searchTerm:['name'] | sort:'name':'desc' }}
```

### Custom Pipe Chaining

```typescript
{{ article.content | truncate:200 | safeHtml }}
{{ createdAt | dateAgo:true }}
{{ fileSize | fileSize:0 }}
```
