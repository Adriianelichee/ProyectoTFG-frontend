import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {

  transform(value: unknown, format: string = 'dd/MM/yyyy', locale: string = 'es-ES'): string {
    if (!value) return '';

    try {
      const date = new Date(value as string | number | Date);

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return '';
      }

      // Formatear según el formato solicitado
      switch (format) {
        case 'short':
          return this.formatShort(date, locale);
        case 'long':
          return this.formatLong(date, locale);
        case 'time':
          return this.formatTime(date, locale);
        case 'datetime':
          return this.formatDateTime(date, locale);
        case 'relative':
          return this.formatRelative(date);
        default:
          return this.formatCustom(date, format, locale);
      }

    } catch (error) {
      console.error('DateFormatPipe: Error formatting date', error);
      return '';
    }
  }

  private formatShort(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private formatLong(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  private formatTime(date: Date, locale: string): string {
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatDateTime(date: Date, locale: string): string {
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSec < 60) {
      return 'hace un momento';
    } else if (diffMin < 60) {
      return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHours < 24) {
      return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffDays < 7) {
      return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    } else {
      return this.formatShort(date, 'es-ES');
    }
  }

  private formatCustom(date: Date, format: string, locale: string): string {
    try {
      // Para formatos personalizados simples
      format = format.replace('dd', date.getDate().toString().padStart(2, '0'));
      format = format.replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'));
      format = format.replace('yyyy', date.getFullYear().toString());
      format = format.replace('HH', date.getHours().toString().padStart(2, '0'));
      format = format.replace('mm', date.getMinutes().toString().padStart(2, '0'));
      format = format.replace('ss', date.getSeconds().toString().padStart(2, '0'));

      return format;
    } catch (error) {
      console.error('Error en formateo personalizado', error);
      return date.toLocaleDateString(locale);
    }
  }
}
