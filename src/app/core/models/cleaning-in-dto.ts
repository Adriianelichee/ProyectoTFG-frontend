//Hacemos interfaz para cada entidades que recibimos del backend o enviamos al backend
export interface CleaningInDto {
  userId: number;          // Almacenamos el ID del usuario que realiza la limpieza
  cleaningDate: string;    // Guardamos la fecha en que se realizo la limpieza
  notes: string;           // Incluimos notas adicionales sobre el proceso de limpieza
  roomId: number | null;   // Registramos el ID de la habitacion si aplica
  workstationId: number | null;  // Anotamos el ID del puesto de trabajo si corresponde
  floorId: number;         // Identificamos el piso donde se efectuo la limpieza
}
