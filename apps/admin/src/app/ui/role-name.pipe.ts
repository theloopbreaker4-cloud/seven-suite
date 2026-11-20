/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/**
 * System roles (owner/admin/member) are shown in the UI language; custom roles keep the name
 * the organization gave them.  {{ role.key | roleName: role.name }}
 */
@Pipe({ name: 'roleName', pure: false })
export class RoleNamePipe implements PipeTransform {
  private readonly t = inject(TranslocoService);

  transform(key: string, fallback?: string): string {
    const id = `roles.${key}`;
    const text = this.t.translate(id);
    return text && text !== id ? text : (fallback ?? key);
  }
}
