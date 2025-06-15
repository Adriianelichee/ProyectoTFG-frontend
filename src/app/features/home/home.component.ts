import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';
import {FloorService} from '../../core/api/floor.service';
import {RoomService} from '../../core/api/room.service';
import {WorkstationService} from '../../core/api/workstation.service';
import {ServiceService} from '../../core/api/service.service';
import {FloorOutDto} from '../../core/models/floor-out-dto';
import {RoomOutDto} from '../../core/models/room-out-dto';
import {WorkstationOutDto} from '../../core/models/workstation-out-dto';
import {ServiceOutDto} from '../../core/models/service-out-dto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  activeFaqIndex: number | null = null;
  featuredRooms: RoomOutDto[] = [];
  featuredWorkstations: WorkstationOutDto[] = [];
  featuredServices: ServiceOutDto[] = [];
  floors: FloorOutDto[] = [];
  showLoginToast = false;

  activeTabIndex: number = 0;

  testimonials = [
    {
      name: 'María García',
      company: 'Innovatech Solutions',
      image: '/testimonial-1.png',
      quote: 'CoWork Space ha transformado nuestra forma de trabajar. Los espacios son modernos, el ambiente es inspirador y el equipo siempre está dispuesto a ayudar.'
    },
    {
      name: 'Carlos Rodríguez',
      company: 'Digital Minds',
      image: '/testimonial-2.png',
      quote: 'Desde que trasladamos nuestra startup a CoWork Space, nuestra productividad ha aumentado significativamente. Las instalaciones son excepcionales.'
    },
    {
      name: 'Laura Martínez',
      company: 'Creative Studio',
      image: '/testimonial-3.png',
      quote: 'El ambiente colaborativo de CoWork Space nos ha permitido establecer conexiones valiosas con otras empresas. ¡Totalmente recomendado!'
    }
  ];

  faqs = [
    {
      question: '¿Cómo puedo reservar un espacio de trabajo?',
      answer: 'Puede reservar un espacio de trabajo iniciando sesión en su cuenta y navegando a la sección de reservas. Allí podrá seleccionar el tipo de espacio, la fecha y hora deseada.'
    },
    {
      question: '¿Cuáles son los horarios de funcionamiento?',
      answer: 'Nuestras instalaciones están abiertas las 24 horas del día, los 7 días de la semana para miembros con acceso completo. El personal de recepción está disponible de lunes a viernes de 8:00 a 20:00.'
    },
    {
      question: '¿Cómo funciona el servicio de limpieza?',
      answer: 'El servicio de limpieza se puede solicitar a través de la plataforma en la sección de servicios. Puede programar una limpieza regular o solicitar una limpieza puntual según sus necesidades.'
    },
    {
      question: '¿Puedo cancelar mi reserva?',
      answer: 'Sí, puede cancelar su reserva hasta 24 horas antes sin costo adicional. Las cancelaciones con menos de 24 horas de anticipación pueden estar sujetas a cargos.'
    }
  ];

  benefits = [
    {
      icon: 'fa-wifi',
      title: 'Internet de Alta Velocidad',
      description: 'Conexión fibra óptica de 1Gbps para todas tus necesidades.'
    },
    {
      icon: 'fa-coffee',
      title: 'Áreas de Descanso',
      description: 'Espacios para relajarse con café y snacks gratuitos.'
    },
    {
      icon: 'fa-calendar',
      title: 'Salas de Reuniones',
      description: 'Espacios equipados con la última tecnología para tus reuniones.'
    },
    {
      icon: 'fa-clock',
      title: 'Acceso 24/7',
      description: 'Trabaja cuando quieras con acceso las 24 horas, todos los días.'
    },
    {
      icon: 'fa-print',
      title: 'Servicios de Impresión',
      description: 'Impresoras y escáneres disponibles en todas las plantas.'
    },
    {
      icon: 'fa-shield-alt',
      title: 'Seguridad Garantizada',
      description: 'Sistema de vigilancia y control de acceso para tu tranquilidad.'
    }
  ];

  constructor(
    private authService: AuthService,
    private floorService: FloorService,
    private roomService: RoomService,
    private workstationService: WorkstationService,
    private serviceService: ServiceService
  ) {
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.loadFeaturedRooms();
    this.loadFeaturedWorkstations();
    this.loadFeaturedServices();
    this.loadFloors();
  }

  setActiveTab(index: number): void {
    this.activeTabIndex = index;
  }

  isActiveTab(index: number): boolean {
    return this.activeTabIndex === index;
  }

  loadFeaturedRooms(): void {
    this.roomService.getAll().subscribe({
      next: (rooms) => {
        this.featuredRooms = rooms
          .filter(room => room.available)
          .sort((a, b) => b.capacity - a.capacity)
          .slice(0, 3);
      },
      error: (err) => console.error('Error al cargar salas destacadas:', err)
    });
  }

  scrollToContact(): void {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({behavior: 'smooth'});
    }
  }

  toggleFaqItem(index: number): void {
    if (this.activeFaqIndex === index) {
      this.activeFaqIndex = null;
    } else {
      this.activeFaqIndex = index;
    }
  }

  isFaqActive(index: number): boolean {
    return this.activeFaqIndex === index;
  }

  loadFeaturedWorkstations(): void {
    this.workstationService.getAll().subscribe({
      next: (workstations) => {
        this.featuredWorkstations = workstations
          .filter(ws => ws.available)
          .sort((a, b) => b.hourlyRate - a.hourlyRate)
          .slice(0, 3);
      },
      error: (err) => console.error('Error al cargar puestos de trabajo destacados:', err)
    });
  }

  loadFeaturedServices(): void {
    this.serviceService.getAll().subscribe({
      next: (services) => {
        this.featuredServices = services
          .sort((a, b) => b.price - a.price)
          .slice(0, 3);
      },
      error: (err) => console.error('Error al cargar servicios destacados:', err)
    });
  }

  loadFloors(): void {
    this.floorService.getAll().subscribe({
      next: (floors) => {
        this.floors = floors;
      },
      error: (err) => console.error('Error al cargar plantas:', err)
    });
  }

  showPreview(type: string, id: number): void {
    if (!this.isLoggedIn) {
      this.showLoginToast = true;
      setTimeout(() => {
        this.showLoginToast = false;
      }, 3000);
    }
  }

  viewRoomPreview(room: RoomOutDto): void {
    this.showPreview('room', room.roomId);
  }

  viewWorkstationPreview(workstation: WorkstationOutDto): void {
    this.showPreview('workstation', workstation.workstationId);
  }

  viewServicePreview(service: ServiceOutDto): void {
    this.showPreview('service', service.serviceId);
  }
}
