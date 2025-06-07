import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FloorService } from '../../core/api/floor.service';
import { RoomService } from '../../core/api/room.service';
import { FloorOutDto } from '../../core/models/floor-out-dto';
import { RoomOutDto } from '../../core/models/room-out-dto';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  featuredRooms: RoomOutDto[] = [];
  floors: FloorOutDto[] = [];
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
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.loadFeaturedRooms();
    this.loadFloors();
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

  loadFloors(): void {
    this.floorService.getAll().subscribe({
      next: (floors) => {
        this.floors = floors;
      },
      error: (err) => console.error('Error al cargar plantas:', err)
    });
  }
}
